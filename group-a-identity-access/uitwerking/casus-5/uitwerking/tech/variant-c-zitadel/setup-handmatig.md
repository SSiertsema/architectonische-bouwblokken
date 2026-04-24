# Handmatige setup — Variant C

De code-bestanden in deze variant (Nuxt, FastAPI, MCP-proxy) draaien pas nadat er een aantal dingen buiten de code om zijn ingericht. Deze pagina is een **runbook**: per stap beschreven wat een operator klikt, configureert of genereert, met verwijzingen naar welke env-variabelen het uiteindelijk levert.

De stappen zijn geordend in een logische volgorde. Waar je eerste keer doorheenloopt: ~3–4 uur voor een schone EU-omgeving. Onderhoud daarna is marginaal.

## Overzicht van wat je nodig hebt

| Categorie | Wat | Waar |
|-----------|-----|------|
| Zitadel | Instance, organisaties, project, applications, service-accounts, actions | Zitadel Console (`pulso.zitadel.cloud` of self-host admin) |
| Identity Providers | Sign in with Apple, Google, Microsoft, Facebook configuraties | Respectievelijke developer portals |
| Voice | Google Action + Alexa Skill registreren | Actions Console + Alexa Developer Console |
| LLM | ChatGPT Custom GPT + Anthropic (voor MCP-server-listing) | OpenAI / Claude-kant |
| Mobile | Associated Domains (iOS) + Digital Asset Links (Android) + App Attest keys + Play Integrity | Apple Developer Portal + Google Play Console |
| AWS | Secrets Manager, ACM certs, CloudFront/WAF regels, Redis, Aurora | AWS Console of Terraform |
| DNS | A/CNAME-records voor `app.`, `api.`, `auth.`, `mcp.pulso.com` | Pulso's DNS-provider |
| Compliance | DPA, privacystatement, cookie-banner | Juridische bijsluiters |

## 1. Zitadel — Cloud of self-host keuze

### Cloud

1. Ga naar `zitadel.com` → "Sign up" → "Customer Portal"
2. Kies regio: **EU-residency** voor Pulso's EU-gebruikers (Frankfurt / Amsterdam)
3. Noteer de instance-URL die je krijgt: `https://pulso-<slug>.zitadel.cloud`
4. Koppel een custom domain: Customer Portal → Instance → "Custom Domain" → voer `auth.pulso.com` in; Zitadel toont DNS-records (CNAME) die je bij Pulso's DNS-provider toevoegt
5. Wacht tot TLS-certificate-issuance klaar is (~5–10 min via ACME); custom domain wordt "verified"
6. Herhaal voor `pulso-us` tenant in US-regio (aparte instance of aparte organization — Pulso kiest aparte organization binnen één instance als de Cloud-tier dat toelaat; anders twee instances)

### Self-host

1. Deploy Keycloak's tegenhanger: Helm-chart `zitadel/zitadel` op EKS, minimaal 3 replicas, anti-affinity over AZ's
2. Aurora PostgreSQL 15 in dezelfde VPC (gedeeld cluster is OK; Zitadel maakt eigen schema)
3. Configureer SMTP voor notifications (Pulso gebruikt AWS SES in eu-west-1)
4. ACM-cert voor `auth.pulso.com`; attach aan ALB
5. Draai `zitadel admin setup` om het initiële admin-account aan te maken

Output van stap 1: `NUXT_OIDC_PROVIDERS_ZITADEL_BASE_URL=https://auth.pulso.com`

## 2. Zitadel — organisatie en admin

1. Login op `auth.pulso.com/ui/console` met het admin-account
2. Je zit standaard in de "default" organization → rename naar `pulso-eu` (Instance-level menu)
3. Creëer een tweede organization `pulso-us` (indien je één instance met twee org's hanteert)
4. Voeg een tweede admin-user toe (break-glass) met MFA verplicht
5. Configureer "Password Policy" per org:
   - Minimale lengte: 12
   - Check against HIBP: aan (nieuwer in Zitadel; anders via eigen Action)
6. Configureer "Login Policy" per org:
   - Allow username password: aan (fallback)
   - Allow external IdP: aan
   - Passwordless: **required** of **allowed** (Pulso kiest "allowed" — passkeys aanmoedigen, niet forceren)
   - MFA init: aan na eerste login
   - Second factors: TOTP + U2F aan; SMS uit

## 3. Zitadel — Identity Providers (social login)

Voor elke social provider: ga naar Organization → Identity Providers → Create.

### Sign in with Apple

Vooraf op Apple Developer Portal:
1. Registreer een **Services ID** (bijv. `com.pulso.signin`)
2. Voeg als Return URL toe: `https://auth.pulso.com/idps/callback` (het Zitadel callback-pad)
3. Genereer een **Sign in with Apple private key** — download het `.p8`-bestand, noteer de `Key ID`
4. Noteer het `Team ID` van je Apple-developer-account

In Zitadel:
1. Identity Providers → Create → Apple
2. Vul in: Client ID = Services ID, Team ID, Key ID, Upload de `.p8`
3. Scopes: `name email`
4. "Automatic creation": aan — nieuwe Apple-users krijgen direct een Zitadel-user
5. "Automatic linking": **"claim" mode** — link automatisch bij verified email

### Google

Op Google Cloud Console:
1. Create Project (of herbruik)
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application
3. Authorized redirect URIs: `https://auth.pulso.com/idps/callback`
4. OAuth consent screen: fill in, publish
5. Noteer Client ID en Client Secret

In Zitadel: zelfde flow als Apple, met Google-credentials.

### Microsoft

Op Azure Portal (Entra ID):
1. App registrations → Register an application → "Pulso SSO" → Supported account types: Personal Microsoft accounts only (consumer)
2. Redirect URI: Web → `https://auth.pulso.com/idps/callback`
3. Certificates & secrets → New client secret (24 maanden geldig)
4. Noteer Application (client) ID en client secret

In Zitadel: Identity Providers → Create → Generic OIDC (of "Microsoft" als preset beschikbaar), vul issuer in (`https://login.microsoftonline.com/consumers/v2.0`) en credentials.

### Facebook

Op Facebook Developers:
1. Create App → Consumer
2. Facebook Login → Settings → Valid OAuth Redirect URIs: `https://auth.pulso.com/idps/callback`
3. Noteer App ID en App Secret

In Zitadel: Identity Providers → Create → Facebook.

## 4. Zitadel — project en applications

1. Organization → Projects → Create Project → "Pulso Platform"
2. Open het project; noteer het **Project ID** (numeriek; nodig voor `urn:zitadel:iam:org:project:id:{PROJECT_ID}:aud` scope)
3. Project Roles → Create:
   - `user` (standaard; elke Pulso-gebruiker)
   - `family-owner`
   - `family-member`
   - `support` (Customer Support)
4. Per application (zie onder) ga je naar Applications → Create:

### pulso-nuxt-web-prod

- Type: **OIDC Web**
- Authentication method: **Basic** (client_secret_basic) — Nuxt heeft een server, dus confidential client is OK
- Redirect URIs:
  - `https://app.pulso.com/auth/zitadel/callback`
- Post-logout redirect URIs:
  - `https://app.pulso.com/`
- Token Settings:
  - Access Token Type: **JWT**
  - Access Token Role Assertion: aan
  - ID Token Role Assertion: aan
  - Refresh Token: aan
  - Refresh Token Max Lifetime: 30d
  - Refresh Token Idle: 30d
- Post-create: kopieer **Client ID** en **Client Secret**

→ Env-variabelen voor Nuxt:
```bash
NUXT_OIDC_PROVIDERS_ZITADEL_CLIENT_ID=<Client ID>
NUXT_OIDC_PROVIDERS_ZITADEL_CLIENT_SECRET=<Client Secret>
# of leeg voor PKCE — Pulso kiest PKCE, dus CLIENT_SECRET leeg en authenticationScheme='none'
```

### pulso-ios-prod en pulso-android-prod

- Type: **OIDC Native**
- Authentication method: **None** (public client + PKCE)
- Redirect URIs:
  - iOS: `com.pulso.app://auth.pulso.com/ios/callback`
  - Android: `com.pulso.app://auth.pulso.com/android/callback`
- "Development Mode": **uit** in productie
- Token Settings: zelfde als Nuxt-web
- Post-create: kopieer Client ID (geen secret bij public)

### pulso-api

- Type: **API**
- Authentication method: **Private Key JWT** (voor token-introspection) of geen (als FastAPI alleen tokens valideert via JWKS — wat de gekozen aanpak is)
- Geen redirect URIs (API-type)
- Dit is het "Resource Server"-record; de `aud`-claim in access-tokens verwijst naar deze app-ID

### pulso-google-home, pulso-alexa, pulso-chatgpt-actions

- Type: **OIDC Web**
- Authentication method: **Basic**
- Redirect URIs: zie per kanaal in `voice-en-llm.md`
- Kopieer Client ID + Client Secret voor de respectievelijke externe consoles

### pulso-device-flow

- Type: **OIDC Native**
- Authentication method: **None**
- Grant types: inclusief **Device Authorization Grant** (aanvinken in Zitadel's app-settings)
- Gebruikt door smart glasses en stand-alone wearables

### pulso-mcp-dcr

- Type: **Machine user** (service account) — géén OIDC-app
- Dit is de service-account die de MCP-proxy gebruikt om dynamisch nieuwe OIDC-apps aan te maken
- Zie stap 5 hieronder

## 5. Zitadel — service accounts voor server-to-server

Zitadel onderscheidt "Human Users" en "Machine Users". FastAPI en de MCP-proxy draaien als Machine Users.

### pulso-api-mgmt (voor FastAPI)

1. Organization → Users → Service Users → Create → "pulso-api-mgmt"
2. Open de user → Keys → Create key → **JWT** → download het JSON-bestand (bevat `userId`, `keyId`, `key` (PEM))
3. Bewaar het JSON-bestand veilig; upload naar AWS Secrets Manager:
   ```
   aws secretsmanager create-secret \
     --name pulso/prod/zitadel-mgmt-key \
     --secret-string file://pulso-api-mgmt-key.json
   ```
4. Grant deze user IAM-rol in de organization:
   - Organization → Authorizations → Create → selecteer service-user → kies rollen:
     - `ORG_USER_MANAGER` (users beheren)
     - `ORG_SETTINGS_WRITE` (user-metadata)
     - `ORG_USER_PERMISSION_WRITE` (grants)
5. Key-rotatie: Pulso roteert elke 180 dagen; Zitadel ondersteunt meerdere actieve keys tegelijk

→ Env-variabele voor FastAPI:
```bash
ZITADEL_MGMT_KEY_FILE=/run/secrets/zitadel-mgmt-key.json
ZITADEL_MGMT_ORG_ID=<Organization ID>
```

### pulso-mcp-proxy (voor MCP-server)

Zelfde patroon als hierboven, maar met rollen beperkt tot:
- `PROJECT_OWNER_WRITE` (voor het aanmaken van nieuwe Applications in het Pulso-platform project)
- `PROJECT_APP_DELETE` (voor het intrekken van MCP-clients)

Key opslaan in Secrets Manager als `pulso/prod/mcp-proxy-key`.

## 6. Zitadel — Actions v2 configureren

Actions zijn JavaScript-snippets die Zitadel runt bij specifieke flow-events.

1. Organization → Actions & Flows → Actions → Create
2. Voor elke action die in `backend-python-stappen.md` / `voice-en-llm.md` wordt genoemd:
   - Naam: bijv. `pulso-post-auth-webhook`
   - Script: plak de inhoud uit het JS-snippet
   - Allowed to fail: nee (harde failure blokkeert de auth-flow — bewust, anders mis je security-signaal)
   - Timeout: 5 seconden
   - Secrets: voeg `PULSO_WEBHOOK_TOKEN` toe met een sterke random waarde (moet matchen met `INTERNAL_TOKEN` in FastAPI's env)
3. Flows → Select Flow (bijv. "Internal Authentication") → Add Trigger → "Post Authentication" → kies de bijbehorende action
4. Test de flow door eens in te loggen en te checken of de webhook bij FastAPI aankomt

## 7. Zitadel — branding en custom domain

1. Organization → Branding → upload Pulso-logo + favicon
2. Custom colors: primary = Pulso's brand-color
3. Login text: aanpassen voor consent-bewuste taal
4. Custom CSS: optioneel — Zitadel ondersteunt een custom stylesheet voor de Universal Login-achtige pagina
5. Email templates: personaliseren (Welcome, Verify Email, Password Reset, New Device Detected)
6. Notification texts in meerdere talen: NL, DE, EN (Pulso's primaire markten)

## 8. Google Home — Actions Console

1. [console.actions.google.com](https://console.actions.google.com) → New Project
2. Kies "Custom" of "Smart Home" (Pulso kiest Custom voor rijke dialogen)
3. Account linking → enable
4. Linking type: **OAuth**, Grant type: **Authorization code**
5. Client ID, Client Secret: uit Zitadel's `pulso-google-home` app
6. Authorization URL: `https://auth.pulso.com/oauth/v2/authorize`
7. Token URL: `https://auth.pulso.com/oauth/v2/token`
8. Scopes (space-separated):
   ```
   openid profile email offline_access
   voice.sessions.start voice.sessions.read voice.notes.write
   urn:zitadel:iam:org:project:id:<PROJECT_ID>:aud
   ```
9. Upload privacy policy URL, voorwaarden URL
10. Add Zitadel-redirect-URIs in Zitadel's app-config:
    - `https://oauth-redirect.googleusercontent.com/r/<google-project-id>`
    - `https://oauth-redirect-sandbox.googleusercontent.com/r/<google-project-id>`
11. Fulfillment: deploy de fulfillment-code (zie `voice-en-llm.md`) naar Cloud Functions of een HTTPS-endpoint; vul de URL in
12. Invocation name: "Pulso" (check dat het vrij is)
13. Test via Actions Simulator; daarna Submit for Review

## 9. Amazon Alexa — Developer Console

1. [developer.amazon.com/alexa](https://developer.amazon.com/alexa) → Create Skill
2. Skill Name: "Pulso", Primary locale, Custom skill model
3. Account Linking → enable, type Auth Code Grant
4. Authorization URI: `https://auth.pulso.com/oauth/v2/authorize`
5. Access Token URI: `https://auth.pulso.com/oauth/v2/token`
6. Client ID / Client Secret: uit Zitadel's `pulso-alexa` app
7. Client Authentication Scheme: "HTTP Basic"
8. Scopes: zelfde als Google Home
9. Domain list: `auth.pulso.com`, `api.pulso.com`
10. Redirect-URIs voor Alexa naar Zitadel toevoegen:
    - `https://layla.amazon.com/api/skill/link/<vendor-id>`
    - `https://pitangui.amazon.com/api/skill/link/<vendor-id>`
    - `https://alexa.amazon.co.jp/api/skill/link/<vendor-id>`
11. Invocation name: "Pulso"
12. Intent model + Lambda-fulfillment (zie `voice-en-llm.md`)
13. Certification: Submit → wacht op review

## 10. ChatGPT — Custom GPT / Actions

1. [chat.openai.com/gpts/editor](https://chat.openai.com/gpts/editor) → Create a GPT
2. Name: "Pulso Coach"
3. Description + instructions: specificeer wat de GPT mag/niet mag
4. Actions → Authentication → OAuth
5. Client ID / Client Secret: uit Zitadel's `pulso-chatgpt-actions` app
6. Authorization URL: `https://auth.pulso.com/oauth/v2/authorize`
7. Token URL: `https://auth.pulso.com/oauth/v2/token`
8. Scope: `openid profile email offline_access workouts.read trainingsload.read urn:zitadel:iam:org:project:id:<PROJECT_ID>:aud`
9. Token exchange method: "Default (POST request)"
10. Schema (OpenAPI): upload of paste de spec uit `voice-en-llm.md`
11. Privacy policy URL: Pulso's AVG-pagina
12. Publish: **"Only me"** eerst voor testing; daarna "Anyone with the link" of "Public" na review
13. Copy de redirect URI die ChatGPT toont (`https://chat.openai.com/aip/g-<gpt-id>/oauth/callback`) en voeg toe aan Zitadel's `pulso-chatgpt-actions` redirect-URIs

## 11. Claude MCP — Anthropic-kant

Er is geen centrale "register" bij Anthropic voor MCP-servers. Gebruikers voegen Pulso's MCP-URL zelf toe in Claude Desktop / Claude-apps.

Wat Pulso wel doet:
1. Een publiek gedocumenteerde MCP-URL: `https://mcp.pulso.com` (zie stap 14 voor DNS)
2. Een publieke `/.well-known/oauth-authorization-server` met de MCP-proxy's metadata (issuer, `/register`, `/authorize`, `/token` endpoints)
3. Een documentatie-pagina `pulso.com/developers/mcp` die uitlegt hoe een gebruiker dit in Claude Desktop toevoegt
4. Opt-in listing in directories zoals `mcp-server-directory` (indien gewenst)

Geen review-flow nodig zoals bij Google/Amazon — ieder die het pad kent kan connecten. Rate-limiting en DCR-policy in de MCP-proxy houden dit onder controle.

## 12. Apple Developer — Associated Domains (iOS mobile)

Voor `com.pulso.app://auth.pulso.com/ios/callback` deep-links:

1. [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles → Identifiers → je app-ID
2. Capabilities → Associated Domains: aan, voeg toe:
   ```
   applinks:auth.pulso.com
   applinks:app.pulso.com
   ```
3. Re-generate provisioning profile
4. Host de AASA-file op `https://auth.pulso.com/.well-known/apple-app-site-association`:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [{
         "appID": "TEAMID.com.pulso.app",
         "paths": ["/ios/callback"]
       }]
     }
   }
   ```
   (content-type `application/json`, geen extensie)

### App Attest (iOS)

1. Capabilities → App Attest: aan (geen extra Apple-side config, werkt per device)
2. Backend: registreer de Apple-root-cert om attests te valideren
3. In FastAPI (of via Action): voeg attest-validation-endpoint toe

## 13. Google Play — Digital Asset Links + Play Integrity (Android mobile)

1. Voor `com.pulso.app://auth.pulso.com/android/callback`:
   - Host `https://auth.pulso.com/.well-known/assetlinks.json`:
     ```json
     [{
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.pulso.app",
         "sha256_cert_fingerprints": ["<SHA-256 van signing cert>"]
       }
     }]
     ```
   - Fingerprint ophalen: `keytool -list -v -keystore release.keystore`

2. Play Integrity:
   - [play.google.com/console](https://play.google.com/console) → App → Settings → App integrity
   - Vraag Play Integrity-key aan
   - Download de public key voor server-side validation
   - Sla op in Secrets Manager
   - FastAPI: implementeer `verify_play_integrity_token` (gebruikt Google's Play Integrity API om tokens te verifiëren)

## 14. DNS + certificaten

Zet bij Pulso's DNS-provider (Route 53 / Cloudflare):

| Record | Type | Waarde |
|--------|------|--------|
| `app.pulso.com` | CNAME | Nuxt-deploy (Vercel / CloudFront / eigen LB) |
| `api.pulso.com` | CNAME | FastAPI-LB (CloudFront met WAF → ALB → ECS) |
| `auth.pulso.com` | CNAME | Zitadel-Cloud custom domain endpoint (of self-host ALB) |
| `mcp.pulso.com` | CNAME | MCP-proxy LB |
| `app.pulso.com/.well-known/apple-app-site-association` | gehost | (via Nuxt static route) |
| `auth.pulso.com/.well-known/assetlinks.json` | gehost | (via Zitadel's "public" custom-resources of aparte S3/CF-distribution) |

TLS-certificaten:
- ACM certs in `us-east-1` voor CloudFront (verplicht); in regio voor ALB's
- Auto-renewal via ACM

## 15. AWS — infrastructuur (code + config)

Veel hiervan gaat via Terraform/CloudFormation (IaC), maar een aantal **eenmalig handmatig**:

1. **Secrets Manager** — 3 secrets aanmaken:
   - `pulso/prod/zitadel-mgmt-key` — Zitadel service-account JSON
   - `pulso/prod/mcp-proxy-key` — MCP-proxy service-account JSON
   - `pulso/prod/nuxt-session-secret` — 64-byte hex voor Nuxt encrypted sessions
2. **IAM-rol voor FastAPI** (ECS-task-role):
   - `secretsmanager:GetSecretValue` op bovenstaande secrets
   - Niet meer
3. **KMS-key** voor envelope-encryption van Aurora + Redis
4. **ElastiCache (Redis)**:
   - Cluster mode off (Pulso's belasting past binnen één shard)
   - Subnet group in private subnets
   - Auth-token verplicht
5. **Aurora PostgreSQL**:
   - Cluster in private subnets
   - Iam-auth aan
   - Parameter group met logging aan
6. **CloudFront + WAF**:
   - Distribution voor `app.pulso.com` en `api.pulso.com`
   - WAF-rules: rate-limiting op `/oauth/*`, `/auth/*` paden; OWASP Core Rule Set; Pulso-custom-rules voor signup-abuse
7. **Route 53 health checks** op `api.pulso.com/healthz`

## 16. Observability

1. **Datadog** — API-key in Secrets Manager; DD-agent deployed als DaemonSet op EKS
2. **Zitadel event-export**:
   - Cloud: Zitadel Cloud Pro-tier biedt event-webhook — configureer in Instance → Event Streams
   - Self-host: custom Event Listener SPI deployen, of events-API pollen vanuit een FastAPI-consumer
3. **Sentry** — DSN per service; ingesteld via env
4. **Dashboards** — importeer Datadog-dashboards uit Pulso's shared-library (`pulso-observability-dashboards` repo)

## 17. Compliance — buiten-code bijsluiters

1. **DPA (Data Processing Agreement) met Zitadel** — tekenen via Customer Portal → Compliance
2. **DPA met sub-processoren** — AWS, Datadog, Stripe, etc.
3. **Privacy Statement** op `pulso.com/privacy` bijwerken:
   - Zitadel vermelden als identity-verwerker
   - Data-locaties (Frankfurt / eigen self-host cluster)
   - Retentie-termijnen
4. **Cookie-banner** update: Zitadel's login-cookie valt onder "functioneel" (geen opt-in nodig, wel transparantie); de analytics-cookie wel
5. **Verwerkersregister** (AVG art. 30) update met alle nieuwe integraties (Google Home, Alexa, ChatGPT, Claude MCP) — elk is eigen verwerker
6. **DPIA-update** — de LLM-integraties + smart glasses zijn nieuwe verwerkingen met eigen DPIA-paragrafen
7. **Incident-response-plan** update — voeg Zitadel-contact toe, plus runbook voor "Zitadel-outage" scenario

## 18. Testing — end-to-end smoke tests

Na alle setup, run deze smoke tests (automatisch of handmatig):

1. **Web login-flow** via Nuxt:
   - Open `https://app.pulso.com` → klik "Inloggen"
   - Zitadel Universal Login toont Pulso-branding
   - Login met passkey → redirect terug → `/dashboard` laadt
2. **Mobile login-flow** (iOS + Android):
   - App start → loginscherm via Custom Tab / ASWebAuth
   - Face ID / passkey prompt
   - Terug in app, workouts laden
3. **Google Home**:
   - In Google Home-app: "Talk to Pulso" → account linking
   - Na linking: "Hey Google, start a Pulso breathing session"
4. **Alexa**:
   - Enable Skill → account linking
   - "Alexa, ask Pulso to start a breathing session"
5. **ChatGPT Custom GPT**:
   - Start GPT → authorize
   - Vraag: "Show me my last workouts"
6. **Claude MCP**:
   - Voeg MCP-server toe in Claude Desktop: `https://mcp.pulso.com`
   - Claude vraagt om consent via Zitadel's Universal Login
   - Vraag: "What did I do at Pulso last week?"
7. **Device Flow** (smart glasses simulator):
   - Run `curl -X POST https://auth.pulso.com/oauth/v2/device_authorization ...`
   - Bevestig via `verification_uri_complete` in een browser
   - Poll `/token` → krijg Bearer-token

## 19. Checklist-samenvatting

- [ ] Zitadel tenant (Cloud of self-host) live, custom domain `auth.pulso.com`
- [ ] Twee organisaties: `pulso-eu`, `pulso-us`
- [ ] Project `pulso-platform` met Project Roles
- [ ] Applications: web, ios, android, api, google-home, alexa, chatgpt-actions, device-flow
- [ ] Service-accounts `pulso-api-mgmt`, `pulso-mcp-proxy` met keys in Secrets Manager
- [ ] Identity Providers: Apple, Google, Microsoft, Facebook
- [ ] Actions + webhook-secret gedeeld met FastAPI
- [ ] Google Actions Console → Pulso Action met Account Linking
- [ ] Alexa Developer Console → Pulso Skill met Account Linking
- [ ] OpenAI Custom GPT met OAuth-config
- [ ] MCP-proxy gepubliceerd op `mcp.pulso.com`
- [ ] Apple Associated Domains + App Attest
- [ ] Google Digital Asset Links + Play Integrity
- [ ] DNS: `app.`, `api.`, `auth.`, `mcp.pulso.com`
- [ ] ACM-certs voor alle domeinen
- [ ] AWS Secrets Manager entries
- [ ] IAM-roles voor ECS-tasks
- [ ] CloudFront + WAF-distributies
- [ ] Datadog + Sentry ingericht
- [ ] DPA's getekend
- [ ] Privacy Statement + cookie-banner bijgewerkt
- [ ] End-to-end smoke tests geslaagd

## Terugkerend onderhoud

| Frequentie | Taak |
|-------------|------|
| Dagelijks | Trust & Safety check Datadog alerts |
| Wekelijks | Event-log steekproef: onverwachte patronen? |
| Maandelijks | Key-rotation check (service-accounts, KMS) |
| Kwartaal | DPA-audit per sub-processor |
| Per release | Nieuwe scopes/actions → DPIA-delta |
| Per Zitadel-major-versie | Upgrade-test in staging eerst (zelf-host) |
| Per 180 dagen | Rotate service-account private keys |

## Wat variant A/B anders doet

Dezelfde runbook voor Auth0 (variant A) en Keycloak (variant B) loopt grotendeels parallel — alleen de CIAM-specifieke stappen (1–7) verschillen:

- **Auth0** vervangt Zitadel-Console-stappen door Auth0-Dashboard-stappen; veel van wat hier via Actions moet, gaat daar via Rules/Actions-in-Auth0
- **Keycloak** vervangt het door Realm-config in Admin Console; service-accounts heten "service account per client"; geen managed cloud

De externe integraties (Google, Alexa, ChatGPT, Claude, AWS, DNS, stores) zijn identiek — alleen de URLs en credentials verschillen per CIAM.
