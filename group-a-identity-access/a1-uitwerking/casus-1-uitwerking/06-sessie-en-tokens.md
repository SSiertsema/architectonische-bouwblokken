# 06 — Sessie en tokens

## Tokens

Na een geslaagde authenticatieflow ontvangt de backend van de beheertool drie tokens van Entra ID:

| Token | Doel | Levensduur in deze casus |
|-------|------|--------------------------|
| **ID token** | Bewijs van authenticatie en claims over de gebruiker | 1 uur (standaard Entra) |
| **Access token** | Niet actief gebruikt — de beheertool roept geen downstream-API aan namens de gebruiker | 1 uur indien aangevraagd |
| **Refresh token** | Nieuw ID/access-token verkrijgen zonder interactieve login | 24 uur effectief, door sign-in frequency van 8 uur uit CA |

Het ID-token wordt **één keer bij ontvangst** gevalideerd: signatuur tegen de JWKS van de tenant, `iss`, `aud`, `exp`, `nbf`, `nonce`. Na validatie worden de relevante claims (`oid`, `preferred_username`, `name`, `roles`) overgenomen in de applicatiesessie. Het token zelf wordt niet opnieuw gebruikt.

## Sessiecookie

De applicatie zet een eigen versleutelde sessiecookie na voltooiing van de OIDC-flow. Eigenschappen:

- `HttpOnly` — niet leesbaar vanuit JavaScript, beschermt tegen XSS-token-theft
- `Secure` — alleen over HTTPS
- `SameSite=Lax` — voldoende voor deze server-side webapp; `Strict` is niet nodig omdat er geen cross-site navigation vanuit betrouwbare bronnen voorkomt
- Versleuteld en ondertekend via **ASP.NET Core Data Protection**, met sleutels opgeslagen in Azure Key Vault en gedeeld tussen alle App Service-instances
- `Path=/` en gebonden aan `beheer.meerwijde.nl`
- Cookie-levensduur: maximaal gelijk aan de sign-in frequency uit CA (8 uur), met idle-timeout van 60 minuten

## Token refresh

Omdat de beheertool zelf geen downstream-API's aanroept, gebruikt de applicatie het refresh-token terughoudend. De standaard-middleware ververst alleen wanneer een nieuwe validatie nodig is. Belangrijker is dat het refresh-token wordt **geweigerd** zodra:

- Het account is gedeactiveerd in AD of Entra (via sync)
- Het wachtwoord is gewijzigd door de gebruiker of een beheerder
- Een CA-policy een nieuwe interactieve login eist (sign-in frequency verlopen)
- De gebruiker expliciet is afgemeld via Entra

## Continuous Access Evaluation (CAE)

CAE is actief voor de beheertool. Entra stuurt near real-time events naar de applicatie bij:

- Gebruiker gedeactiveerd of gebruikersrisico verhoogd
- Wachtwoordwijziging
- Significant locatiewijziging
- Token-revocatie door een beheerder

De applicatie ontvangt in dat geval een **claims challenge** en dwingt de gebruiker tot een nieuwe interactieve login. Dit vervangt het wachten op access-token-expiratie en is het mechanisme waardoor het intrekken van een toegang van een ontslagen of gecompromitteerd account binnen minuten doorwerkt tot in de applicatiesessie, niet pas na uren.

## Uitloggen

De applicatie biedt een expliciete "uitloggen"-actie in de UI:

1. De sessiecookie wordt verwijderd (server-side vernietigd, client-side overschreven met `expires=0`)
2. De gebruiker wordt geredirect naar het Entra end-session-endpoint: `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/logout?post_logout_redirect_uri=<...>`
3. Entra beëindigt de SSO-sessie in de browser
4. Entra roept de front-channel logout URL's aan van alle andere apps waar de gebruiker bij ingelogd was (single logout)
5. De gebruiker eindigt op de "U bent afgemeld"-pagina van de beheertool

Automatisch afsluiten gebeurt op drie momenten:

- **Idle timeout** (60 min geen activiteit) — sessiecookie verloopt, volgende request triggert OIDC-redirect
- **Absolute session timeout** (8 uur) — gelijk aan de sign-in frequency uit CA
- **Sluiten browser** — persistent browser session is uit in CA; de SSO-sessie overleeft een browser-herstart niet

## Verhouding tot A3

Dit bestand beschrijft sessiemanagement **voor zover het direct uit de OIDC-flow en Entra CA volgt**. Applicatie-specifiek sessiegedrag dat los van de IdP staat — zoals concurrent session-limiet, step-up authentication voor gevoelige acties binnen de app, of sessie-invalidatie bij rolwijziging — valt onder **A3 — Sessiemanagement** en wordt daar uitgewerkt.

## Ervaring voor Sanne

Voor Sanne is het effect van deze instellingen:

- Aan het begin van haar werkdag één stille SSO-redirect, eventueel met één push-notificatie voor MFA als het PRT net vervallen is
- Gedurende de dag geen onderbrekingen — haar sessie blijft actief zolang ze actief is
- Als ze over lunchtijd meer dan een uur weg is, vraagt de app bij terugkeer om een refresh van haar sessie, die zonder extra MFA wordt afgehandeld dankzij haar nog geldige PRT
- Na werktijd sluit ze de laptop; de sessie eindigt van nature en haar volgende werkdag begint met een schone start
