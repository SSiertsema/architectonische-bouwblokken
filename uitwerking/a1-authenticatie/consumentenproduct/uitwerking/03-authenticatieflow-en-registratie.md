# 03 — Authenticatieflow en registratie

Dit bestand behandelt de authenticatie- en registratieflows voor het web- en het native mobile-kanaal. Wearable, voice, LLM en smart glasses worden in `04-device-en-kanaalintegratie.md` behandeld.

## Methoden die Pulso aanbiedt

Drie methoden in afnemende voorkeur:

1. **Passkeys (WebAuthn)** — primaire methode, phishing-resistent, device-bound of cross-device via iCloud Keychain / Google Password Manager / 1Password
2. **Social login** — Sign in with Apple (verplicht op iOS als andere social wordt aangeboden), Sign in with Google, Microsoft, Facebook
3. **E-mail + wachtwoord** — fallback; minimaal 12 tekens, gecontroleerd tegen Have I Been Pwned / breached-password-lists, Argon2id-hashing

MFA is niet standaard afgedwongen voor alle gebruikers (CIAM-norm: dat zou conversie doden), maar wel **step-up verplicht** voor gevoelige acties (e-mail wijzigen, abonnement opzeggen, data-export, wachtwoord-wijziging zonder passkey). Step-up-methoden: TOTP via authenticator-app, passkey (als ingericht), e-mail-OTP als laatste redmiddel.

SMS-OTP wordt **niet** aangeboden — SIM-swap-risico is niet te managen in een CIAM-context waar identiteitsverificatie pragmatisch is.

## Signup — progressive profiling

Pulso vraagt bij signup **alleen het absolute minimum**. De rest vult zich tijdens de customer journey.

### Stap 1 — "start nu"

| Veld | Verplicht? | Waarom |
|------|-----------|--------|
| E-mailadres | Ja | Accountherstel, marketing-opt-in apart |
| Wachtwoord OF passkey OF social | Ja | Een identity moet worden aangemaakt |
| Expliciete AVG-toestemming voor functionele verwerking | Ja | Juridische basis |
| Marketing-opt-in | Nee | Apart opt-in; standaard uit |

Na stap 1 is er een **user in de CIAM** (e-mail nog onverified) + **user in de applicatie-DB** (zonder workout-historie).

### Stap 2 — "bevestig je e-mail"

Directe mail met verificatielink. Geldig 24 uur; hergeneereerbaar. Pas na verificatie mogen accounts:

- Een abonnement kopen
- Een third-party integratie koppelen (Apple Health, Strava)
- Family-plan-uitnodigingen accepteren

Tot die tijd werkt de app in "gast-modus" — gebruiker kan één workout doen, daarna blocker.

### Stap 3 — progressief verrijken

Op logische momenten in de customer journey vraagt de app extra gegevens:

| Moment | Gevraagd | Waarom nu |
|--------|----------|-----------|
| Eerste workout voltooid | Naam of nickname | Voor begroeting en community |
| Tweede workout | Doelstelling (afvallen / mobiliteit / stress) | Voor aanbevelingen |
| Na een week | Geboortedatum (voor hartslagzones) | Gezondheidsdata — aparte consent |
| Bij activering Apple Health | Scope-keuze per data-categorie | Consent per scope |
| Bij abonnement | Betaalgegevens (alleen bij premium) | Wordt buiten CIAM door payment-provider afgehandeld |

Elk veld dat gezondheidsdata (art. 9 AVG) raakt, vraagt een aparte expliciete toestemming met verwijzing naar de Data Processing Agreement.

## Login — web (BFF-patroon)

Het web-kanaal volgt hetzelfde BFF-patroon als casus 1: **geen tokens in de browser**. De Vue 3 SPA praat alleen met de Node.js-BFF via een versleutelde sessiecookie. De BFF voert de OIDC-flow uit tegen het CIAM-platform.

### Stappen

1. Amira bezoekt `app.pulso.com`
2. BFF detecteert dat er geen geldige sessie is en redirect naar CIAM met: `response_type=code`, `scope=openid profile email offline_access`, `state`, `nonce`, `code_challenge`, `code_challenge_method=S256`
3. CIAM toont de Universal Login-pagina (custom-branded) — Amira kiest "passkey" (haar default)
4. Browser vraagt via WebAuthn haar platform-authenticator aan (Touch ID op MacBook)
5. Passkey-assertion terug naar CIAM; CIAM bevestigt de authenticatie
6. CIAM redirect naar `https://app.pulso.com/callback?code=...&state=...`
7. BFF wisselt de code in bij het token-endpoint (met PKCE `code_verifier`)
8. BFF ontvangt `id_token`, `access_token`, `refresh_token`
9. BFF valideert ID-token (signature tegen JWKS, `iss`, `aud`, `exp`, `nbf`, `nonce`)
10. BFF maakt server-side sessie, zet `__Host-pulso_session` cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`)
11. BFF redirect naar `/dashboard`
12. Vue SPA laadt, haalt `/api/me`, toont persoonlijke startpagina

### ID-token voorbeeld (Amira)

```json
{
  "iss": "https://auth.pulso.com/",
  "aud": "pulso-web-prod",
  "exp": 1745500000,
  "iat": 1745496400,
  "nbf": 1745496400,
  "sub": "auth0|662a4f9b2e8c4f0012345678",
  "email": "amira@example.com",
  "email_verified": true,
  "name": "Amira R.",
  "picture": "https://cdn.pulso.com/avatars/amira.jpg",
  "amr": ["webauthn"],
  "acr": "urn:pulso:acr:passkey",
  "nonce": "<nonce-from-request>",
  "https://pulso.com/region": "eu"
}
```

Naast standaard-claims gebruikt Pulso één **custom claim** met namespaced key (`https://pulso.com/region`) voor data-residency-routering in de applicatie. Andere applicatie-gegevens (abonnement, voorkeuren) zitten **niet** in het token maar worden uit de applicatie-DB gelezen op basis van `sub`.

## Login — mobile native (iOS / Android)

Native apps zijn **public clients** (geen client secret kunnen bewaren). Ze gebruiken **OAuth 2.0 Authorization Code Flow met PKCE**, uitgevoerd via `ASWebAuthenticationSession` (iOS) of Custom Tabs (Android) — geen embedded webview.

### Stappen — eerste login

1. Amira opent de Pulso-app op een nieuwe iPhone
2. App genereert `code_verifier` en `code_challenge`
3. App opent `ASWebAuthenticationSession` naar `https://auth.pulso.com/authorize?client_id=pulso-ios-prod&redirect_uri=com.pulso.app://callback&response_type=code&scope=openid+profile+email+offline_access+workouts.read+workouts.write&code_challenge=...&state=...`
4. Systeem-browser toont CIAM-pagina; Amira's iCloud Keychain biedt haar synced passkey aan
5. Face ID bevestigt; passkey-assertion wordt gestuurd
6. CIAM redirect naar `com.pulso.app://callback?code=...&state=...`
7. iOS koppelt de URL terug aan de Pulso-app (associated domains)
8. App wisselt code in bij token-endpoint — **geen client secret**, alleen `code_verifier` en `client_id`
9. App ontvangt `id_token`, `access_token`, `refresh_token`
10. App slaat refresh-token op in iOS Keychain (Secure Enclave-backed, accessGroup `com.pulso.app`)
11. App gebruikt `access_token` voor Pulso-API-calls; ververst proactief via refresh-token

### Biometric unlock — tweede en volgende keer

Bij het openen van de app wordt het access-token uit de Keychain opgehaald. iOS vraagt standaard geen biometrie voor die retrieval — Pulso voegt daarom een **aanvullende biometrische laag** toe:

- Keychain-item krijgt `kSecAttrAccessControl` met `.userPresence` of `.biometryCurrentSet`
- Bij elke app-start vraagt iOS Face ID / Touch ID vóór de refresh-token uitgelezen kan worden
- Bij een "biometric lockout" (3× gefaald) gaat de app terug naar volledige herauthenticatie via de browser-flow

Android-equivalent: `BiometricPrompt` + `EncryptedSharedPreferences` met `BIOMETRIC_STRONG` class authenticatie.

### Refresh-rotation

Elke keer dat de app het refresh-token inwisselt voor een nieuw access-token, **krijgt ze ook een nieuw refresh-token** terug. Het oude refresh-token wordt ongeldig. Dit is "refresh token rotation":

- Beperkt impact bij gestolen token tot de tijd tussen twee refreshes
- Detecteert token-diefstal via "reuse detection": als de oude token wordt aangeboden na gebruik, trekt het platform de hele family in en dwingt het nieuwe inlog af

## Social login — account linking

Wanneer een gebruiker eerst met e-mail signup doet en later "Sign in with Google" gebruikt met hetzelfde (verified) e-mailadres, herkent het CIAM de bestaande user en **koppelt** de Google-identity aan dat account in plaats van een duplicaat te maken.

Dit gebeurt alleen als:

- Het Google-account een **verified e-mail** heeft (`email_verified: true` in de Google ID-token)
- Het e-mailadres overeenkomt met een bestaande Pulso-user
- De gebruiker expliciet bevestigt "we zien dat je al een account hebt — wil je Google koppelen?" (bewuste stap om account takeover via gekapte social te voorkomen)

Onder de motorkap is dit een feature van het CIAM-platform ("Account Linking" in Auth0 via een Action; "Account linking" in Keycloak via een built-in First Broker Login flow). Het patroon werkt op elke managed en self-host-stack; de uitvoering verschilt.

### Belangrijke valkuil — social zonder verified e-mail

Sommige social providers (bepaalde Facebook-configuraties) leveren geen `email_verified: true`. Dan mag **géén automatische linking** plaatsvinden, omdat een aanvaller een Facebook-account kan aanmaken met elk willekeurig e-mailadres. Pulso behandelt dit expliciet: unverified e-mail uit social → gebruiker krijgt een eigen verification-stap.

## Wachtwoord-fallback

Een gebruiker zonder passkey en zonder social kan e-mail+wachtwoord gebruiken.

Beleid:

- **Minimaal 12 tekens**, geen verplichte complexiteitsregels (volgt NIST SP 800-63B)
- **Blacklist** tegen Have I Been Pwned Passwords API (k-anonymity)
- **Hashing** met Argon2id, parameters geconfigureerd voor ~500 ms op de CIAM-server
- **Rotatie** niet gedwongen — gedwongen rotatie leidt tot voorspelbare patronen
- **Reset** via e-maillink (zie `08-accountlifecycle-en-herstel.md`)
- **Breach-driven reset** — bij bekende lek van dit adres elders stuurt Pulso een proactief reset-verzoek

## Leeservaring per persona

| Persona | Dominante methode | Wat hij/zij ziet |
|---------|-------------------|------------------|
| **Amira** | Passkey (synced via iCloud) | "Face ID" pop-up; verder niets |
| **Thomas** | E-mail + wachtwoord | Loginscherm; bij vergeten een herstelflow |
| **Henk** | Google-account (via Account Linking in voice-kanaal — zie 04) | Geen loginscherm; zijn dochter heeft het gedaan |
| **Nadia** | Passkey + step-up TOTP voor LLM-scope | Face ID + authenticator-prompt bij gevoelige acties |

## Claim-overdracht naar de applicatie

Na een succesvolle login ontvangt de BFF (of de mobile app) een ID-token met de claims uit de voorbeeldsectie hierboven. De applicatie leest `sub` en `email` uit en gebruikt `sub` als foreign key naar haar eigen `users`-tabel. Alle overige gebruikersdata (abonnement, voorkeuren, workouts) leeft in de applicatie-DB en wordt **niet in de CIAM** opgeslagen.

Een volledige lijst claims + semantiek + scope-design staat in `06-consent-profielclaims.md`.
