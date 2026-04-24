# 07 — Sessie en tokens

## Uitgangspunten

In een consumentencontext verschilt het sessiebeleid wezenlijk van een corporate casus:

- **Sessies zijn lang** — Amira wil niet elke ochtend opnieuw inloggen
- **Sessies zijn per-device, niet per-user** — elk apparaat houdt zijn eigen sessie bij; één uitloggen raakt niet alle andere
- **Step-up is contextueel** — niet bij elke actie, wel bij gevoelige
- **Refresh-token-hygiëne is kritisch** — op mobiele devices leven refresh-tokens lang; rotatie + reuse-detectie + binding zijn must-haves

Tegelijk: sessiekostenefficiëntie matters. Lange refresh-tokens op 650.000 MAU genereren veel verkeer richting de CIAM; design-keuzes beïnvloeden maandelijkse kosten materieel.

## Tokens per device-klasse

Tabel op herhaal (zie ook `04-device-en-kanaalintegratie.md`) met rationale:

| Device-klasse | Access TTL | Refresh TTL | Refresh rotatie | Binding | Rationale |
|---------------|------------|-------------|------------------|---------|-----------|
| Web (via BFF) | n.v.t. (sessiecookie) | n.v.t. | — | Versleutelde sessiecookie | BFF houdt tokens; cookie is binding naar browser |
| iOS/Android | 1 uur | 30 dagen | Ja | DPoP + app-attest / Play Integrity | Lang genoeg voor echte mobiele use, rotatie voor diefstal-resistentie |
| Watch / Wear OS | 1 uur | 7 dagen | Ja | Shared Keychain / Account group | Korter vanwege hogere exposure (device kan worden gekoppeld aan ander iPhone-profiel) |
| Stand-alone wearable | 1 uur | 30 dagen | Ja | Device-code-bound | Geen "ouder-device" om bij terug te vallen |
| Google Home / Alexa | 1 uur | 30 dagen rollend | Ja | Geen — host-platform waarborgt | Platform-eigen lange-levende-tokens |
| ChatGPT Actions | 1 uur | 30 dagen rollend | Ja | DPoP optioneel | Per-client; pred. gebruik |
| Claude MCP | 1 uur | 30 dagen max | Ja, maar forced re-consent na 30 dagen | DPoP aanbevolen | Dynamisch geregistreerde clients, strengere levensduur-cap |
| Smart glasses | 1 uur | 7 dagen | Ja | Device-attest | Nieuwe klasse; conservatiever |

## Refresh-token-rotation

Refresh-tokens zijn het lange-termijn-geheim. Pulso dwingt **rotation + reuse-detection** op alle kanalen af:

1. Bij elke `POST /token` met `grant_type=refresh_token` wordt een nieuw refresh-token teruggegeven
2. Het oude refresh-token wordt meteen ongeldig (niet zomaar "ook geldig")
3. Als het oude refresh-token later toch wordt aangeboden, interpreteert het CIAM dat als diefstal: de hele **family** (alle refresh-tokens in de ketting) wordt ingetrokken, en de user moet opnieuw inloggen

Visueel:

```
R0 → R1 (R0 nu dood)
R1 → R2 (R1 nu dood)
R0 gebruikt? ALARM — family weg, user opnieuw inloggen
```

Zowel Auth0 als Keycloak ondersteunen dit native. Keycloak via `revokeRefreshToken=true` + `refreshTokenMaxReuse=0`. Auth0 via "Refresh Token Rotation" op client-niveau.

## DPoP — sender-constrained tokens

Standaard zijn bearer-tokens stelbaar: wie hem heeft kan hem gebruiken. **DPoP (RFC 9449)** bindt een token aan een cryptografisch sleutelpaar dat alleen bij de client leeft:

- Client genereert key-pair lokaal (in Secure Enclave / Keystore)
- Bij elke API-call stuurt client een DPoP-header met een JWT ondertekend door die sleutel
- Server valideert dat het token is uitgegeven voor déze sleutel en de request-method/url

Effect: een gestolen access-token is waardeloos zonder de bijbehorende private key (die zit in hardware-gebonden opslag).

Pulso gebruikt DPoP verplicht op:

- iOS / Android native
- LLM-clients (aanbevolen; ChatGPT en Claude ondersteunen het beide in nieuwere SDK's)

DPoP is **niet** gebruikt op:

- Web BFF (browser; key zou in JS leven — minder waardevol)
- Voice-platforms (platform-gebonden; platform regelt zelf binding)

## App-attest en Play Integrity

Naast token-binding wil Pulso weten dat de **app zelf** authentiek is, niet een gemodificeerde versie. iOS biedt **App Attest**, Android biedt **Play Integrity API**.

- Bij eerste app-start + periodiek (bijvoorbeeld elke 7 dagen) vraagt Pulso de native app om een device-attest
- Attest-bewijs wordt meegestuurd met token-refresh-call
- CIAM (via Auth0 Action / Keycloak authenticator) valideert de attest
- Ongeldige attest → refresh-token revoked, opnieuw inloggen via standaard flow

## Sessie-levensduur en absolute timeout

| Device-klasse | Idle timeout | Absolute timeout |
|---------------|--------------|--------------------|
| Web (sessiecookie) | 8 uur | 30 dagen (maar refresh via passkey is stil) |
| iOS/Android | Geen (app blijft stil draaien) | 90 dagen zonder activiteit → force re-auth |
| Watch / Wear OS | Geen | 30 dagen zonder activiteit → opnieuw pairen |
| Voice (Google Home) | Geen | Re-link bij platform-initiated sign-out |
| LLM | Session-scoped | 30 dagen consent-cap |

De absolute timeouts zorgen dat inactieve accounts op verloren devices uiteindelijk vanzelf dichtklappen.

## Step-up authentication

Pulso vereist step-up (een recente sterke authenticatie) voor gevoelige acties. De `acr`-claim in het access-token en de `auth_time`-claim bepalen of step-up recent genoeg is.

### Triggers

Zie `05-fraude-en-misbruikpreventie.md` voor de volledige lijst; kort:

- Account-attributen wijzigen (e-mail, wachtwoord zonder passkey, telefoonnummer)
- Abonnement wijzigen of opzeggen
- Data-export aanvragen
- Account verwijderen
- LLM-integratie koppelen of scope-uitbreiden
- Familie-plan-eigenaarschap overdragen

### Implementatie

Pulso's BFF / mobile app houdt bij welke `acr`-waarde het laatste token heeft, en de `auth_time`. Voor elke gevoelige actie:

1. Controleer of `acr` sterk genoeg is én `auth_time` recent (< 5 min)
2. Zo nee: stuur `response_type=code&prompt=login&acr_values=urn:pulso:acr:stepped_up_recent&max_age=0` naar CIAM
3. CIAM vraagt de step-up-factor (passkey of TOTP), levert nieuw token met verhoogd `acr`
4. BFF / mobile gebruikt nieuw token voor de gevoelige actie; valt daarna terug op het reguliere token

## Session-management API

Elke Pulso-user kan in "Apparaten & integraties" zien wat er actief is en intrekken. Dit werkt via de admin-API van het CIAM:

- **Auth0**: `DELETE /api/v2/users/{user_id}/sessions` (alle), `DELETE /api/v2/refresh-tokens/{id}` (per stuk)
- **Keycloak**: `DELETE /auth/admin/realms/{realm}/users/{id}/logout` (alle actieve sessies), `DELETE /auth/admin/realms/{realm}/sessions/{session}` (per stuk)

Pulso wrapt dit in een applicatie-endpoint `POST /api/sessions/revoke` dat:

- Authenticatie controleert (step-up vereist)
- De juiste admin-API aanroept
- Een audit-event schrijft
- Een push-notificatie stuurt naar het getroffen device ("Je bent uitgelogd vanuit een ander apparaat")

## Token-revocatie bij incidenten

Bij een verdacht ATO-signaal of een gebruikersklacht ("er is iemand anders ingelogd"):

1. Trust & Safety drukt "alle sessies + refresh-tokens intrekken"
2. Het CIAM invalideert alle refresh-tokens voor de user
3. Access-tokens blijven technisch geldig tot hun 1-uurs-TTL — nadat Pulso's API via CAE-achtige signalering (zie onder) ze ook afwijst
4. User moet opnieuw inloggen; krijgt een informatie-mail over wat er is gebeurd

## Continuous authentication (CAE-equivalent)

Auth0 heeft geen eigen Continuous Access Evaluation zoals Entra; Keycloak idem. Pulso gebruikt een pragmatische variant:

- Webhook van CIAM naar Pulso-backend bij `user.revoked`, `user.locked`, `password.changed`, `session.revoked`
- Pulso-backend houdt een in-memory **deny-list** van (user_id, issued-before-timestamp); access-tokens ouder dan de timestamp worden afgewezen ongeacht hun TTL
- Deny-list is self-clearing na 1 uur (dan zijn de tokens sowieso verlopen)

Dit beperkt de "schadenstraal" van een gelekt token tot maximaal 1 uur én geeft Trust & Safety een directe kill-switch.

## Uitloggen

Elke device-klasse biedt een eigen uitlog-mechanisme:

- **Web**: sessiecookie deletion + redirect naar CIAM end-session-endpoint + post-logout-redirect
- **Mobile**: Keychain/Keystore-entry wissen + refresh-token revocation-call naar CIAM + lokale state clearen
- **Watch/Wear OS**: "ontkoppel Pulso" op de host-telefoon; watch-sessie wordt via shared-keychain-deletion ingetrokken
- **Voice**: "Hey Google, ontkoppel Pulso" → Google roept Pulso's revocation-endpoint aan
- **LLM**: user verwijdert de MCP-server in Claude / Custom GPT in ChatGPT → revocation-webhook
- **Smart glasses**: "ontkoppel op telefoon"

Er is één overkoepelende knop: **"Alle sessies uitloggen"** in de web/mobile-app. Handig voor verkochte of verloren devices.

## Cookies voor het web-kanaal

Herhalingen van casus 1's aanpak, aangescherpt voor CIAM-context:

- `__Host-pulso_session` — sessiecookie, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- Versleuteld met AES-GCM; key in AWS Secrets Manager / KMS-encrypted
- TTL 8 uur; bij het verstrijken full re-auth via OIDC
- `__Secure-pulso_refresh_indicator` — optionele second cookie die aangeeft dat de browser-familie een refresh-token elders (bij het CIAM) heeft; gebruikt voor silent refresh
- Geen access-token in de browser. Ooit.

## Platform-specifieke implementatienotes

| Onderwerp | Auth0 | Keycloak |
|-----------|-------|----------|
| Refresh rotation | Tab in "Applications → Settings → Token" | `revokeRefreshToken=true`, `refreshTokenMaxReuse=0` in realm settings |
| DPoP support | Opt-in, via Actions of API | Via client-attribute `use-dpop` (nieuwere versies) |
| Session max age | Per Application settings | Per Realm → Sessions tab |
| `acr_values` support | Full | Full via authentication-flow conditions |
| Deny-list via webhook | Auth0 Webhook / Log Streams | Keycloak Event Listener SPI |
| Admin API voor revocation | `/api/v2/...` (M2M token) | `/auth/admin/realms/...` (service-account) |

Concrete configuratie: zie `tech/variant-a-auth0/backend-node-stappen.md` en `tech/variant-b-keycloak/backend-node-stappen.md`.

## Effect per persona

| Persona | Sessie-ervaring |
|---------|-------------------|
| **Amira** | Stil — passkey wake-up, geen expliciete login voor dagen |
| **Thomas** | Absolute timeout van 90 dagen raakt hem; comebacks via wachtwoordreset |
| **Henk** | Voice-linked token blijft 30 dagen; 3 weken voor verloop krijgt zijn dochter een re-link-waarschuwing |
| **Nadia** | LLM-refresh verplicht haar elke 30 dagen tot her-consent; dat vindt ze goed |

## Verhouding tot A3

A3 — Sessiemanagement behandelt:

- Concurrent-session-limiet binnen de applicatie-DB (bijvoorbeeld "maximaal 5 actieve mobile sessions")
- Server-side session-store-keuze en sharding
- Sessie-invalidatie bij applicatie-interne events die geen token-events zijn

Dit bestand beperkt zich tot wat uit de OIDC/OAuth-flows en de CIAM-configuratie volgt.
