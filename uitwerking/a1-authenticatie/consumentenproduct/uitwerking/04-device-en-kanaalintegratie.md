# 04 — Device- en kanaalintegratie

Waar `03-authenticatieflow-en-registratie.md` de web- en mobile-flows beschrijft, behandelt dit bestand de overige device-klassen waarop Pulso draait. Elk van deze kanalen gebruikt een specifieke OAuth-flow, heeft eigen beperkingen in UX en consent-registratie, en vereist eigen ontwerpbeslissingen rondom token-scoping en revocatie.

## Overzicht

| Device-klasse | Flow | Browser op device? | Consent-registratie ter plekke? | Voorbeeld-persona |
|---------------|------|---------------------|----------------------------------|---------------------|
| Wearable met companion (Apple Watch, Wear OS) | Pairing via mobiele app | Nee | Nee (via mobiel) | Amira |
| Wearable stand-alone (Apple Watch Cellular "family setup", LTE-Garmin) | OAuth 2.0 Device Authorization Grant | Beperkt | Nee (verwijst naar ander device) | — |
| Google Home / Google Assistant | OAuth 2.0 Account Linking | Op koppelend device | Nee (via koppelend device) | Henk |
| Amazon Alexa | OAuth 2.0 Account Linking | Via Alexa-app op telefoon | Nee (via telefoon) | Henk |
| LLM (ChatGPT Actions) | OAuth 2.0 Authorization Code + PKCE | Ja (via ChatGPT UI) | Ja, expliciet per scope | Nadia |
| LLM (Claude MCP-server) | OAuth 2.0 + Dynamic Client Registration | Ja (via Claude UI) | Ja, expliciet per scope | Nadia |
| Smart glasses (limited-UI) | QR-handoff naar mobiel of Device Flow | Nee | Nee (via mobiel) | Nadia |

Alle kanalen gebruiken hetzelfde CIAM-user-record. Alle tokens zijn **gescoped** — een Google Home-linked token heeft niet dezelfde rechten als een LLM-integratie-token, ook niet als het dezelfde user betreft.

## Wearable met companion — Apple Watch en Wear OS

De wearable heeft **geen eigen login-UI**. De identiteit wordt over de companion-app overgeheveld:

1. Gebruiker logt in op de iPhone (of Android-telefoon) — zie flow in `03-authenticatieflow-en-registratie.md`
2. Mobile app verkrijgt een **watch-specifiek OAuth-token** via een zogenoemde **token exchange** (RFC 8693) bij het CIAM — of, eenvoudiger, de mobile app deelt een refresh-token met de watch-app via de companion-API
3. Watch-app slaat het token op in haar eigen Keychain (watchOS) of EncryptedSharedPreferences (Wear OS)
4. Bij workout-start gebruikt de watch het token direct tegen `api.pulso.com` voor read/write van sessies

### Patroon — shared Keychain access-group

In iOS:

- `com.pulso.app` en `com.pulso.watch` delen een Keychain access-group
- iPhone-app schrijft refresh-token in die group
- Watch-app leest uit diezelfde group — geen eigen OAuth-flow nodig

In Android:

- Shared `UserHandle` en `AccountManager` stellen de Wear OS-app in staat het Pulso-account te lezen dat door de telefoon-app is aangemaakt

### Ontkoppeling

Een gebruiker kan via "Apparaten" in de web- of mobile-app **alle sessies per apparaat** zien en selectief intrekken:

- "Apple Watch van Amira" → revoke-button
- Het CIAM trekt het specifieke refresh-token in (niet de hele session-family)
- Watch-app krijgt 401 bij volgende API-call; toont "opnieuw pairen"-bericht op iPhone

## Wearable stand-alone — Device Flow

Een Apple Watch met cellular en "family setup", of een stand-alone Garmin met LTE, heeft **geen parent-iPhone**. Voor die scenario's gebruikt Pulso **OAuth 2.0 Device Authorization Grant (RFC 8628)**.

### Flow

1. Gebruiker start pairing op de watch — tikt op een instel-item "koppelen met Pulso"
2. Watch vraagt een device-code aan: `POST https://auth.pulso.com/oauth/device/code` met `client_id` en `scope`
3. CIAM antwoordt met `device_code`, `user_code` (bijvoorbeeld `PULS-X4Q2`), `verification_uri_complete` (`https://pulso.com/activate?user_code=PULS-X4Q2`), `expires_in`, `interval`
4. Watch toont `user_code` + `verification_uri` (of een QR-code ernaar) op het scherm
5. Gebruiker opent `pulso.com/activate?user_code=PULS-X4Q2` op een ander device (telefoon, laptop)
6. Gebruiker logt daar in (BFF-flow), bevestigt "Wilt u apparaat PULS-X4Q2 koppelen aan uw account?"
7. Watch polled ondertussen `POST /oauth/token` met `grant_type=urn:ietf:params:oauth:grant-type:device_code` en `device_code`
8. Zodra bevestiging op de andere device is gedaan, krijgt de watch tokens terug
9. Watch slaat refresh-token op en werkt zelfstandig verder

Zelfde pattern geldt voor smart glasses met beperkte invoer.

## Voice-assistenten — Google Home en Alexa

Voice-platforms verplichten **OAuth 2.0 Authorization Code Flow** voor wat ze "Account Linking" noemen. Er is geen afwijking van de standaard — wel specifieke randvoorwaarden per platform.

### Google Home / Google Assistant

- **Redirect-URI** vast: `https://oauth-redirect.googleusercontent.com/r/<project-id>` en `https://oauth-redirect-sandbox.googleusercontent.com/r/<project-id>`
- **Client-registratie** vereist bij Google Actions Console, met Pulso's auth-endpoints (`/authorize`, `/token`) en scopes
- **Voice-only consent**: Google's platform toont een kort spraakbericht "Om Pulso te koppelen ga je naar je telefoon..." — de consent zelf gebeurt op het koppel-device
- **Scope voor voice**: `voice.sessions.read`, `voice.sessions.start`, `voice.notes.write` — beperkt tot wat voice-context nodig heeft
- **Geen health-data via voice** — hartslag, slaap, gewicht zijn bewust buiten voice-scope

### Amazon Alexa

- **Redirect-URI** vast: `https://pitangui.amazon.com/api/skill/link/<vendor-id>`, regio-varianten voor EU/JP
- **Alexa Skill** gepubliceerd met OAuth-client-gegevens van het CIAM
- **LWA (Login with Amazon)** is een alternatief waarbij Pulso niet zelf de auth doet maar Amazon's identity accepteert; Pulso kiest de standaard OAuth-route om platform-onafhankelijk te blijven
- **Scope**: zelfde voice-scopes als Google

### Device-mapping

Het voice-specifieke token wordt in het CIAM vastgelegd als een aparte **identity + session** onder de bestaande user:

- Henk's user: `sub=auth0|661a...`
- Identity: `google-home` (bron: Google Account Linking)
- Refresh-token: lang geldig (30 dagen, rollend)
- Scope: `voice.sessions.read voice.sessions.start voice.notes.write`

Als Henk's dochter in zijn account "Google Home ontkoppelen" kiest, wordt alleen deze identity/session ingetrokken — niet de hele user.

### Voice Match — stem-differentiatie

Pulso maakt gebruik van **Google Voice Match** en **Amazon Voice ID** om te weten *wie binnen het huishouden* spreekt. Dit wordt gecombineerd met Pulso's user-mapping:

- Henk's Google-account is gelinkt aan Pulso-user-A
- Echtgenote zou gelinkt kunnen zijn aan Pulso-user-B (of geen Pulso)
- "Hey Google, hoe is mijn Pulso-voortgang?" → Google Assistant stuurt `user_id`-signaal mee (de Google-`sub`) → Pulso-backend zoekt welke Pulso-user erbij hoort → antwoordt alleen met die persoon's data

Wanneer het signaal ontbreekt (geen Voice Match), antwoordt Pulso bewust generiek: "voor jouw persoonlijke voortgang, open de app" — dit voorkomt privacy-lekkage naar huisgenoten.

## LLM-integraties

Twee distinct patterns, beide gebaseerd op OAuth 2.0 maar met eigen platformafspraken.

### ChatGPT Actions (OpenAI)

ChatGPT Custom GPTs / Actions praten met externe API's via een OpenAPI-spec + OAuth 2.0-configuratie. Setup:

- Pulso registreert een OAuth-client specifiek voor "ChatGPT Actions"
- Client authenticeert als confidential client (ChatGPT heeft een server-side component)
- **Redirect-URI**: `https://chat.openai.com/aip/g-<gpt-id>/oauth/callback`
- **Scopes**: `workouts.read`, `workouts.write`, `trainingsload.read` — fijn-granulair, geen `*.read`
- **Token-levensduur**: access-token 1 uur; refresh-token 30 dagen rollend
- **Rate-limiting**: per client-id (ChatGPT kan veel queries afvuren)

User flow: Nadia activeert de GPT; ChatGPT toont een OAuth-consent-pagina via Pulso's `/authorize`; Nadia kiest welke scopes ze toestaat; terug in ChatGPT met een access-token; GPT kan nu Pulso-API's aanroepen binnen de scope.

### Claude MCP-server (Anthropic)

Model Context Protocol is ontworpen voor **dynamic client registration** (RFC 7591) — een MCP-client registreert zichzelf bij de server, zonder pre-shared client-id. Dit past bij Claude's decentrale model: elke Claude-gebruiker is een eigen client.

Pulso host een MCP-server op `mcp.pulso.com` die:

- OAuth 2.0 `/authorize`, `/token`, `/register` (DCR) endpoints aanbiedt
- Dynamic client registration accepteert — elke Claude-sessie wordt een unieke client
- PKCE verplicht voor alle clients
- Scopes identiek aan ChatGPT-patroon: `workouts.read`, etc.
- Het CIAM staat achter deze MCP-server; de MCP-server proxyt naar het CIAM voor de feitelijke OAuth-flow

User flow: Nadia opent Claude, voegt "Pulso" toe als MCP-server; Claude registreert zichzelf dynamisch als client; Nadia krijgt een OAuth-consent via het CIAM; Claude ontvangt scoped access-token.

### Verschil in trust-model

ChatGPT Actions gebruiken **één vertrouwde client** (OpenAI zelf). Claude MCP gebruikt **dynamisch geregistreerde clients** (één per gebruiker-sessie). Dit beïnvloedt:

- **Revocatie**: bij ChatGPT is "Pulso-GPT ontkoppelen" één action; bij Claude moet elke geregistreerde MCP-client afzonderlijk zichtbaar en intrekbaar zijn
- **Audit-logging**: Claude-clients krijgen elk een unieke `client_id` — Pulso logt per client welke queries zijn gedaan
- **Rate-limiting**: ChatGPT krijgt één grote bucket; Claude krijgt per-client buckets

### LLM-specifieke risico's

LLM-integraties brengen drie risico's die Pulso specifiek adresseert:

1. **Prompt injection** — kwaadwillige inhoud in een Pulso-response (bijvoorbeeld in een workout-naam) kan de LLM bewegen tot onbedoelde acties. Mitigatie: servers markeren alle user-gegenereerde tekst als "untrusted content" volgens MCP-guidelines.
2. **Scope-creep** — gebruiker denkt alleen workouts te delen, maar de LLM probeert ook `health.read` op te vragen. Mitigatie: scopes zijn **elk afzonderlijk opt-in**, geen bulk-acceptatie.
3. **Over-persistentie** — lange refresh-token-levensduur zonder her-consent. Mitigatie: voor LLM-clients is de refresh-token-levensduur 30 dagen en na die periode is expliciete her-consent vereist, niet automatische verlenging.

## Smart glasses — QR-handoff

Meta Ray-Ban, Apple Vision Pro en XREAL zijn vooralsnog **limited-UI** — er is een scherm, maar geen ergonomisch login-mechanisme. Pulso kiest voor **QR-handoff**:

1. Gebruiker start Pulso-module op de bril
2. Bril toont QR-code met daarin `pulso://activate?session_id=<...>`
3. Gebruiker scant met telefoon (Pulso-app herkent de deeplink)
4. Pulso-app vraagt Face ID / biometrische bevestiging
5. App stuurt bevestiging + scoped token naar CIAM via een korte "pair device"-API
6. Bril polled het token endpoint (zelfde device-flow-pattern) en ontvangt tokens

Alternatief bij Vision Pro is "Optic ID" als WebAuthn-authenticator: dan is de bril een **volledige WebAuthn-authenticator** en loopt de flow als native mobile (PKCE + passkey). Dit wordt verwacht in nieuwere visionOS-versies.

## Token-scoping overzicht

Tokens per kanaal verschillen in **scope** en **levensduur**. Dit is bewust: geen enkel kanaal krijgt meer toegang dan het nodig heeft.

| Kanaal | Scopes (typisch) | Access-token TTL | Refresh-token TTL |
|--------|------------------|-------------------|---------------------|
| Web (BFF) | `openid profile email offline_access workouts.*` | 1 uur | Niet direct aan browser; sessie via cookie |
| iOS/Android native | `openid profile email offline_access workouts.* health.*` | 1 uur | 30 dagen rollend |
| Apple Watch / Wear OS | `workouts.read workouts.write` | 1 uur | 7 dagen rollend |
| Stand-alone wearable (Device Flow) | `workouts.read workouts.write` | 1 uur | 30 dagen rollend |
| Google Home / Alexa | `voice.*` | 1 uur | 30 dagen rollend |
| ChatGPT Actions | `workouts.read trainingsload.read` (per scope opt-in) | 1 uur | 30 dagen rollend |
| Claude MCP | `workouts.read` (per scope opt-in) | 1 uur | 30 dagen — daarna re-consent |
| Smart glasses | `workouts.read coaching.stream` | 1 uur | 7 dagen rollend |

Uitvoering per platform verschilt (Auth0 heeft een API voor refresh-token-families per grant-type; Keycloak doet het via offline-tokens en client-scoped sessions) — zie `tech/` voor het concrete inregelen.

## Revocatie en zichtbaarheid

Pulso biedt elke gebruiker een **"Apparaten & integraties"** pagina met:

- Alle actieve sessies, per device-klasse
- Datum/tijd laatst gebruik, geografische schatting, user-agent
- Eén-kliks revoke per item, en "alles uitloggen"-knop
- LLM-integraties apart zichtbaar, met voor elke MCP-client de queries van de laatste 30 dagen

Technisch wordt deze pagina gevoed vanuit het CIAM-platform (Auth0 Management API / Keycloak Admin REST API). De revocatie zelf roept direct de IdP-API aan; applicatie-DB volgt via webhook (`session.revoked` event) voor lokale cache-invalidatie.

## Relatie tot andere bestanden

- Fraude- en misbruikpatronen specifiek voor voice en LLM — zie `05-fraude-en-misbruikpreventie.md`
- Consent-registratie per kanaal — zie `06-consent-profielclaims.md`
- Token-levensduur-rationale en step-up voor gevoelige acties — zie `07-sessie-en-tokens.md`
- Device-kwijt-flow en "alles uitloggen" na incident — zie `08-accountlifecycle-en-herstel.md`
