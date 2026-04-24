# TECH — technische uitwerking Casus 5

Deze sectie bevat drie volledige technische invullingen van de casus. De hoofdstukken 01-09 zijn platform-agnostisch; deze `tech/`-sectie maakt het concreet door het CIAM-platform *vast te pinnen* en de integratie end-to-end te beschrijven.

## Drie varianten naast elkaar

| Variant | CIAM | Backend | Frontend | Rol in deze casus |
|---------|------|---------|----------|---------------------|
| **A — Auth0** (Okta Customer Identity Cloud) | Managed SaaS | Node.js + Fastify BFF | Vue 3 SPA | Leidraad — marktleider, rijke built-ins, Pulso's huidige stack |
| **B — Keycloak** | Self-hosted open source | Node.js + Fastify BFF | Vue 3 SPA | Alternatief — volledige controle, data-residency, voorspelbare kosten |
| **C — Zitadel** | Open source + Cloud (Zwitsers) | Python + FastAPI | Nuxt.js (Nitro BFF) | Alternatieve stack — EU-jurisdictie, event-sourced, Python + Nuxt |

Waar varianten identiek zijn (mobile AppAuth-patroon, voice/LLM-integratiepatronen, refresh-rotation-strategie) schrijft dit document het één keer op; waar ze verschillen (CIAM-configuratie, SDK, observability-koppeling, operationele overwegingen) staat het per-variant in de bijbehorende submap.

## Gedeelde stack — variant A en B

- **Frontend (web)** — Vue 3 + Vite + TypeScript, gedraaid als SPA
- **Backend-for-Frontend** — Node.js 20 + Fastify + TypeScript op AWS (ECS/Fargate of EKS), BFF-patroon voor web
- **Mobile** — iOS (SwiftUI + AppAuth-iOS), Android (Jetpack Compose + AppAuth-Android)
- **Database** — Aurora PostgreSQL voor user-profielen, DynamoDB voor sessies/session-index, TimeScaleDB voor workout-timeseries
- **Edge** — CloudFront + AWS WAF
- **Observability** — Datadog (APM + logs) + Sentry (errors)
- **Voice** — Google Actions Console + Alexa Skills Kit
- **LLM** — ChatGPT Actions manifest + Claude MCP-server (Pulso zelf-gehost)

## Afwijkende stack — variant C

- **Frontend (web)** — Nuxt.js (Vue 3 + Nitro-server) — de Nitro-server is de BFF
- **Backend** — Python 3.12 + FastAPI + Authlib — pure API, geen sessies, alleen Bearer-token-validatie
- Mobile, database, edge, voice, LLM: identiek aan A/B

## Patroon 1 — BFF voor web

Zelfde als casus 1: de Vue-SPA houdt **geen tokens** vast. De BFF is de "vertrouwde partij" richting de CIAM; de browser ontvangt alleen een versleutelde, `HttpOnly` sessiecookie. Voordelen: geen token-opslag in JavaScript-bereik (XSS-resistenter), makkelijk sessie-invalidatie, platformtoegewezen consent-hantering.

## Patroon 2 — Public client voor mobile

iOS en Android apps zijn **public clients**. OAuth 2.0 Authorization Code met PKCE, uitgevoerd via systeem-browser (ASWebAuthenticationSession / Custom Tabs), geen client-secret, refresh-tokens in Keychain/EncryptedSharedPreferences achter biometrische gate. DPoP en app-attest/Play Integrity voor sender-binding.

## Patroon 3 — Device Flow voor limited-UI

Smart glasses en stand-alone wearables. OAuth 2.0 Device Authorization Grant (RFC 8628). Device toont user-code en verification-URI (of QR); gebruiker bevestigt op ander device; device polled token-endpoint tot grant is goedgekeurd.

## Patroon 4 — Account Linking voor voice

Google Home en Alexa zijn **pre-registered OAuth-clients** met vaste redirect-URIs. Pulso registreert zich in beide platforms als "provider"; user doet het linken via platform-specifieke UX; tokens leven op het voice-platform, Pulso vertrouwt ze via standaard OAuth-flow.

## Patroon 5 — Dynamic Client Registration voor LLM

Claude MCP-servers accepteren dynamische client-registratie (RFC 7591). Pulso host een MCP-server die zich gedraagt als een OAuth 2.0 authorization server met `/register`-endpoint. ChatGPT Actions gebruiken een statisch geregistreerde confidential client.

## Pagina's

### Variant A — Auth0

- [Variant A index](./variant-a-auth0/) — tenant-opzet, Universal Login, Actions, Bot Detection, kosten
- [Vue frontend — Auth0](./variant-a-auth0/vue-frontend-stappen) — concrete Vue-implementatiestappen
- [Backend Node.js — Auth0](./variant-a-auth0/backend-node-stappen) — concrete BFF-implementatiestappen
- [Mobile-integratie — Auth0](./variant-a-auth0/mobile-integratie) — AppAuth met Auth0-tenant
- [Voice + LLM — Auth0](./variant-a-auth0/voice-en-llm) — Account Linking + MCP + Actions

### Variant B — Keycloak

- [Variant B index](./variant-b-keycloak/) — realm-ontwerp, providers, FAPI, self-host topologie, ops
- [Vue frontend — Keycloak](./variant-b-keycloak/vue-frontend-stappen) — concrete Vue-implementatiestappen
- [Backend Node.js — Keycloak](./variant-b-keycloak/backend-node-stappen) — concrete BFF-implementatiestappen
- [Mobile-integratie — Keycloak](./variant-b-keycloak/mobile-integratie) — AppAuth met Keycloak-realm
- [Voice + LLM — Keycloak](./variant-b-keycloak/voice-en-llm) — Account Linking + MCP + Actions

### Variant C — Zitadel

- [Variant C index](./variant-c-zitadel/) — Zitadel-concepten, Cloud vs self-host, Pulso's org-opzet, vergelijking met A/B
- [Architectuur — Variant C](./variant-c-zitadel/architectuur) — Nuxt ↔ FastAPI ↔ Zitadel diagrammen
- [Nuxt frontend — Zitadel](./variant-c-zitadel/nuxt-frontend-stappen) — Nuxt 3/4 + nuxt-oidc-auth + server-BFF
- [Backend Python (FastAPI) — Zitadel](./variant-c-zitadel/backend-python-stappen) — Authlib + JWKS + Management API
- [Mobile-integratie — Zitadel](./variant-c-zitadel/mobile-integratie) — AppAuth met Zitadel issuer
- [Voice + LLM — Zitadel](./variant-c-zitadel/voice-en-llm) — Account Linking + MCP-proxy (DCR)

### Overkoepelend

- [Architectuur & communicatie](./architectuur) — componentendiagram + sequencediagrammen per kanaal

## Beslissingscriteria — drie varianten vergeleken

| Criterium | Auth0 (A) | Keycloak (B) | Zitadel (C) |
|-----------|-----------|---------------|---------------|
| HQ / jurisdictie | US (Okta) | US (Red Hat/IBM) | Zwitserland (EU) |
| CLOUD Act-exposure | Ja | Ja (als US-distributie) | Nee |
| Licentie | Commercieel | Apache 2.0 | Apache 2.0 + commercial cloud |
| Managed opt-in | Native | Alleen self-host | Native (Cloud) + self-host |
| Admin-UX | Uitstekend | Goed | Goed, modern |
| Event-model | Logs + webhooks | Event Listener SPI | Event-sourced (native) |
| Actions-taal | JavaScript | Java SPI + FreeMarker | JavaScript |
| DCR | Via Mgmt API | Native RFC 7591 | Via Mgmt API |
| Frontend in deze casus | Vue 3 SPA | Vue 3 SPA | Nuxt.js (Nitro) |
| Backend in deze casus | Node.js Fastify | Node.js Fastify | Python FastAPI |
| Pricing op 650k MAU | Hoog (per-MAU) | Flat (infra) | Middelhoog (per-MAU Cloud) |
| Ops-complexiteit | Nul | Middel-hoog | Laag (Cloud) / middel (self-host) |

## Beslissingscriteria Auth0 vs. Keycloak voor Pulso

| Criterium | Auth0 voordeel | Keycloak voordeel |
|-----------|-----------------|---------------------|
| Time-to-value | Vliegensvlug — tenant live in een middag | Dagen tot weken — realm-ontwerp, hosting, HA |
| Operationele last | Minimaal — Okta host en upgradet | Middel-zwaar — patches, HA, DB-backups, logs |
| Feature-velocity | Hoog — nieuwe features continu live | Gemiddeld — community release-ritme |
| MAU-kosten | Schalend per user (materieel boven 500k) | Flat — infra-kosten (schat 20-40% lager voor Pulso's schaal) |
| Data-residency controle | Keuze uit regio's van Auth0 | Volledig zelf gekozen |
| Lock-in-risico | Materieel — Actions/Rules zijn Auth0-specifiek | Laag — open standaard, portable |
| Certificeringen-erfenis | Pulso erft SOC 2, GDPR DPA van Okta | Pulso moet alles zelf borgen |
| Admin-UX voor non-engineers | Uitstekend | Goed maar minder polished |
| Customization-diepte | Beperkt tot wat Actions toelaten | Onbeperkt (Java SPI) |
| Supply-chain-risico | Enkele partij (Okta), historische incidenten | Self-contained |

**Pulso's huidige afweging:**
- Opschalen voorbij 500k MAU maakt Auth0-kosten pijnlijker; Keycloak wordt aantrekkelijker
- Compliance-erfenis (SOC 2) en snelheid van feature-rollout zijn op korte termijn met Auth0 beter
- Lock-in-risico dwingt Pulso om een "exit-path" te hebben — Keycloak-variant is die exit-path op papier
- Voor MCP/dynamic-client-registration heeft Pulso beide platformen nodig te valideren (Keycloak heeft er sneller support voor dan managed)

## Pagina-keuze-hulp

- Werk je aan de tenant-setup of het CIAM-bestuurlijke vlak? → Variant-index
- Implementeer je frontend? → `vue-frontend-stappen`
- Implementeer je de BFF? → `backend-node-stappen`
- Implementeer je iOS of Android? → `mobile-integratie`
- Koppelt je voice of LLM? → `voice-en-llm`
- Wil je het grote plaatje of flow per kanaal zien? → `architectuur`
