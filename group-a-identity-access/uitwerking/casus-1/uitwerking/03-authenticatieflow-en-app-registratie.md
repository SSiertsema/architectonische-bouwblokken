# 03 — Authenticatieflow en Entra-app-registratie

## Protocol

De beheertool gebruikt **OpenID Connect (OIDC)** met de **Authorization Code flow met PKCE**. Dit is de gangbare standaard voor server-side webapplicaties die richting Entra ID federeren. Zowel de frontend als de backend van de beheertool wonen in dezelfde App Service; de backend voert de tokenuitwisseling uit.

## Stappen in de authenticatieflow

1. Sanne benadert `https://beheer.meerwijde.nl`
2. De backend detecteert dat er geen geldige sessie is en redirect haar browser naar het Entra-autorisatie-endpoint met: `client_id`, `redirect_uri`, `response_type=code`, `scope=openid profile email offline_access`, `state`, `nonce`, `code_challenge` + `code_challenge_method=S256`
3. Entra ID controleert of er al een actieve Entra-sessie is. Omdat Sanne eerder die dag haar Windows-werkplek ontgrendelde met Windows Hello for Business, bestaat er een **Primary Refresh Token (PRT)** en is ze feitelijk al aangemeld bij Entra zonder interactieve stap
4. Entra evalueert de relevante Conditional Access-policies (MFA, device compliance, locatie — zie `04-conditional-access-en-mfa.md`). Alle checks slagen zonder extra prompt dankzij het PRT en de compliant Intune-status van de laptop
5. Entra redirect de browser terug naar de `redirect_uri` met een autorisatiecode
6. De backend wisselt de code in bij het token-endpoint (met `code_verifier` + clientcertificaat-credential) tegen een ID-token, access token en refresh token
7. De backend valideert de ID-token-signatuur tegen de actuele JWKS van Entra, controleert `iss`, `aud`, `exp`, `nbf`, `nonce`
8. De backend zet een versleutelde sessiecookie en serveert de dashboardpagina van de beheertool

Voor Sanne voelt dit als "de pagina openen en direct bij het dossier zijn". Technisch zijn alle authenticatiestappen wel degelijk doorlopen, maar zonder gebruikersinteractie.

## Entra-app-registratie

Per omgeving bestaat één app-registratie: `beheertool-prod`, `beheertool-acc`, `beheertool-tst`. Configuratie voor productie:

| Veld | Waarde |
|------|--------|
| **Name** | `beheertool-prod` |
| **Supported account types** | Accounts in this organizational directory only (single tenant) |
| **Redirect URI (web)** | `https://beheer.meerwijde.nl/signin-oidc` |
| **Front-channel logout URL** | `https://beheer.meerwijde.nl/signout-oidc` |
| **Post-logout redirect URI** | `https://beheer.meerwijde.nl/logged-out` |
| **ID tokens enabled** | Ja |
| **Access tokens enabled** | Alleen indien de backend een downstream-API aanroept namens de gebruiker |
| **Client authentication** | Certificaat uit Azure Key Vault (geen client secret) |
| **API permissions (delegated)** | `Microsoft Graph: User.Read`; admin consent verleend |
| **Token configuration — optional claims** | `email`, `preferred_username`, `family_name`, `given_name` |
| **App roles** | Gedefinieerd per functionele rol; zie `05-rollen-en-claims.md` |
| **Expose an API** | Niet ingericht — de beheertool heeft geen gescheiden backend-API met eigen scopes |

## Client-authenticatie zonder shared secret

Voor client-authenticatie richting het token-endpoint wordt **geen client secret** gebruikt. In plaats daarvan:

- De App Service draait met een **system-assigned managed identity**
- Een **certificaat** in **Azure Key Vault** wordt door de managed identity uitgelezen bij opstart
- Dit certificaat is als **certificate credential** geregistreerd op de app-registratie in Entra
- Certificaatrotatie verloopt via Key Vault met een automated rotation policy; de publieke helft wordt bij rotatie geüpload naar de app-registratie via Terraform

Hiermee bestaat er nergens een statisch geheim in de applicatieconfiguratie dat kan uitlekken. De koppeling tussen applicatie en Entra verloopt volledig via Azure-interne identiteitsbewijzen en Key Vault-toegangscontrole.

## Client library

De applicatie gebruikt **MSAL** in de taal van het platform. Voor ASP.NET Core is dat `Microsoft.Identity.Web`, dat bovenop MSAL.NET zit en de OIDC-middleware integreert in de standaard-authenticatiepipeline. Specifieke instellingen:

- `TokenValidationParameters` — `ValidateIssuer`, `ValidateAudience`, `ValidateLifetime`, `RequireSignedTokens` allemaal `true`
- `ResponseType` — `code` (authorization code flow)
- `SaveTokens` — `true` zodat de backend desgewenst een API-call namens de gebruiker kan doen
- `UseTokenLifetime` — `false`; de applicatie gebruikt haar eigen sessie-levensduur (zie `06-sessie-en-tokens.md`)

## Voorbeeld van claims in het ID-token

Geanonimiseerd voorbeeld van de payload van een ID-token voor Sanne:

```json
{
  "iss": "https://login.microsoftonline.com/<tenant-id>/v2.0",
  "aud": "<client-id-beheertool-prod>",
  "exp": 1714060800,
  "iat": 1714057200,
  "nbf": 1714057200,
  "oid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "tid": "<tenant-id>",
  "sub": "U4s_XgZ...",
  "preferred_username": "sanne.jansen@meerwijde.nl",
  "name": "Sanne Jansen",
  "given_name": "Sanne",
  "family_name": "Jansen",
  "nonce": "<nonce-from-request>"
}
```

Aanvullende claims die via de app-registratie kunnen worden meegegeven (zoals een `roles`-claim voor app roles) zijn input voor autorisatie-beslissingen en worden in `05-rollen-en-claims.md` kort beschreven op het niveau van claim-levering. De betekenis en het gebruik van die claims valt onder A2.
