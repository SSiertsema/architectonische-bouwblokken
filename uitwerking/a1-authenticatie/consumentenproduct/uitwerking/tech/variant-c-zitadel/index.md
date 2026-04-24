# Variant C — Zitadel + FastAPI + Nuxt.js

Een derde variant naast Auth0 (A) en Keycloak (B). De stack is bewust anders op drie assen: andere CIAM-leverancier (Zitadel — Zwitsers, open source + managed cloud), andere backend-taal (Python + FastAPI), andere frontend-stack (Nuxt.js SSR met de Nitro-server als BFF). Dit laat zien dat Pulso's hoger-liggende ontwerpbeslissingen (flows, consent, sessiebeleid, compliance uit 01–09) één-op-één overeind blijven bij een volledig andere technologische invulling.

## Waarom Zitadel

- **EU-jurisdictie** — Zwitserse organisatie (Zürich); geen CLOUD Act-exposure
- **Open source (Apache 2.0)** — zelfde licentievrijheid als Keycloak, maar met modernere architectuur
- **Managed én self-host** — Zitadel Cloud voor snelheid, self-host voor volledige controle; dezelfde software-artifact
- **Event-sourced core** — alle mutaties zijn events; replay, audit en observability zijn een natuurlijk deel van het model
- **Multi-tenant from day one** — Instance/Organization-structuur past bij multi-regio-CIAM zonder losse tenants
- **OIDC-discovery volledig conform** — elk OIDC-conformant protocol werkt zonder aanpassingen

## Concepten — hiërarchie

Anders dan Auth0 (Tenant → Application) of Keycloak (Realm → Client) kent Zitadel vier niveaus:

```
Instance                    ← één per Zitadel-deployment (of per Cloud-tenant)
 ├── Organization           ← logische tenant; bevat users en admins
 │   ├── Project            ← logische applicatie; bundelt apps, rollen, grants
 │   │   ├── Application    ← client (web, mobile, API, SAML)
 │   │   ├── Role           ← project-gedefinieerde rol
 │   │   └── Grant          ← koppelt een user aan een project + roles
 │   ├── User               ← Human of Machine (service-account)
 │   └── Admin              ← rol binnen de org
 └── Admin                  ← instance-level
```

**Belangrijk**: een user woont in één organisatie, maar kan grants hebben op projecten van *andere* organisaties binnen dezelfde instance — dat is het "granted projects"-model en maakt B2B2C-scenario's mogelijk. Voor Pulso (pure B2C) is dit niet primair relevant, maar wel voor toekomstige family-plan-uitbreidingen.

## Pulso's Zitadel-opzet

Twee organisaties binnen één instance (Cloud of self-host):

```
Instance: pulso.zitadel.cloud  (of self-host: auth.pulso.com)
 │
 ├── Organization: pulso-eu
 │   ├── Project: pulso-platform
 │   │   ├── App: pulso-nuxt-web-prod          (OIDC Web, confidential, PKCE)
 │   │   ├── App: pulso-ios-prod               (OIDC Native, PKCE)
 │   │   ├── App: pulso-android-prod           (OIDC Native, PKCE)
 │   │   ├── App: pulso-api                    (API-type, token-introspection)
 │   │   ├── App: pulso-google-home            (OIDC Web, confidential)
 │   │   ├── App: pulso-alexa                  (OIDC Web, confidential)
 │   │   ├── App: pulso-chatgpt-actions        (OIDC Web, confidential)
 │   │   ├── App: pulso-device-flow            (OIDC Native, Device Flow)
 │   │   └── Project Roles: user, family-owner, family-member, support
 │   ├── Users: EU-eindgebruikers (Amira, Thomas, Nadia, ...)
 │   └── Service users: pulso-api-mgmt, pulso-mcp-proxy
 │
 └── Organization: pulso-us
     └── identieke structuur, US-gebruikers
```

Waarom twee organisaties en niet twee instances? Data-residency-scheiding werkt op org-niveau in Zitadel wanneer Cloud-regio's apart zijn; bij self-host host Pulso één instance per regio-cluster met daarin één org.

## Cloud vs. self-host

| Aspect | Zitadel Cloud | Self-host |
|--------|----------------|-----------|
| Time-to-value | Minuten — signup op `zitadel.com` | Dagen — Helm-chart deploy + Postgres + upgrade-strategie |
| Ops-last | Geen | Middel — pod-restarts, DB-backup, upgrades, observability |
| Data-residency | Regio-keuze uit een vaste set | Volledig eigen keuze — elke AWS/GCP/Azure-regio of on-prem |
| Kosten | Per MAU / per feature-tier (zie zitadel.com/pricing) | Infra-kosten + engineering-tijd |
| SLA | Zitadel's SLA | Zelf waarborgen |
| Customization | Actions v2 (JS); custom UI; custom domains | Bovendien: eigen plugins, eigen UI-theme via frontend-repo |
| Cert-erfenis | SOC 2 Type II, ISO 27001, GDPR DPA standaard | Pulso zelf — community-image bevat geen cert-evidence |
| Major upgrades | Automatisch | Elke 6-12 maanden eigen project |

Pulso's keuze in deze casus: **Cloud voor EU, self-host-optioneel voor US** — Cloud dekt de primaire markt met zijn SOC 2-evidence-erfenis, self-host houdt de migratie-optie open.

## Zitadel vs. Auth0 vs. Keycloak — vergelijking per concept

| Concept | Auth0 (variant A) | Keycloak (variant B) | Zitadel (variant C) |
|---------|--------------------|------------------------|----------------------|
| Legal entity | US (Okta Inc.) | US (Red Hat/IBM) | Zwitserland (CAOS AG) |
| CLOUD Act-exposure | Ja | Ja | Nee |
| Tenantmodel | Tenant per prod/acc/dev | Realm per doel | Instance → Organization |
| Client-object heet | Application | Client | Application |
| Rol-levering in token | `roles` via App Roles/Action | `roles` via Role Mapper | `urn:zitadel:iam:org:projects:roles` scope |
| Passkey-support | Universal Login-built-in | WebAuthn-authenticator | Native, eerste-klas |
| Actions / extensie-taal | JavaScript (Auth0 Actions) | Java SPI + FreeMarker-thema | JavaScript (Actions v2) |
| DCR (RFC 7591) | Via Management API | Native `/realms/{r}/clients-registrations/openid-connect` | Via Management API (proxied) |
| Device Flow | Ondersteund | Ondersteund | Native, eerste-klas |
| Python SDK | Authlib of Auth0-Python-SDK | Authlib of python-keycloak | Authlib (officieel aanbevolen) |
| Management API | REST (Auth0 Management API) | REST (Admin REST API) | gRPC + REST parallel |
| Event-export | Log Streams | Events Listener SPI | Events API (gRPC) + Actions-webhook |
| Pricing-model | Per MAU | Flat (infra) | Per MAU (Cloud) / flat (self-host) |
| Licentie | Commercieel | Apache 2.0 | Apache 2.0 |

## Stackkeuze — Python + Nuxt samenvatting

- **Nuxt.js** is de SSR-variant van Vue 3. In plaats van een losse Vue-SPA-bundel die met een Node-Fastify-BFF praat, heeft Nuxt zelf een server (Nitro) die die BFF-rol kan vervullen. Pulso's architectuur in deze variant gebruikt de Nitro-server **als BFF**: browser ↔ Nuxt-server (session-cookie) ↔ FastAPI (Bearer-token).
- **FastAPI** is een async Python-webframework; wordt door Pulso gebruikt als pure business-API achter de BFF. FastAPI valideert JWT's van Zitadel via JWKS, spreekt de Zitadel Management API aan voor admin-operaties, en consumeert Zitadel's event-stream.
- **Authlib** is de door Zitadel zelf aanbevolen Python OIDC-bibliotheek (er is geen eigen Python SDK). Het zelfde geldt aan beide kanten: Nuxt gebruikt `nuxt-oidc-auth`, FastAPI gebruikt `authlib.integrations.starlette_client` + `authlib.jose`.

Gedetailleerde implementaties:

- [Architectuur voor deze variant](./architectuur) — diagrammen van rolverdeling en flow
- [Handmatige setup — runbook](./setup-handmatig) — wat je configureert in Zitadel Console, Google, Alexa, ChatGPT, Apple, Play, AWS, DNS
- [Nuxt frontend — stappen](./nuxt-frontend-stappen) — `nuxt-oidc-auth`, composables, server-proxy
- [FastAPI backend — stappen](./backend-python-stappen) — Authlib, JWKS-cache, Management API
- [Mobile-integratie](./mobile-integratie) — AppAuth iOS/Android tegen Zitadel
- [Voice + LLM](./voice-en-llm) — Google Home / Alexa / ChatGPT / Claude MCP

## Kosten- en ops-overwegingen voor Pulso

- **Zitadel Cloud** is goedkoper per MAU dan Auth0 op Pulso's schaal (650k MAU). Break-even richting Keycloak-self-host ligt bij ~1.5M MAU in 2026-prijzen — boven die schaal wordt self-host aantrekkelijker.
- **Self-host** met twee regio-clusters (eu-west-1, us-east-1) vraagt ongeveer de helft van het engineering-werk dat Keycloak vergt, doordat Zitadel single-binary + Helm-chart is en Go-based (geen Java-heap-tuning).
- **Actions v2** in Zitadel dekken de meeste customization-behoeften die Pulso in Auth0 Actions had; de migratiekosten tussen Cloud en self-host zijn minimaal (zelfde configuratieformaat).
- **Python-stack-keuze**: FastAPI + Authlib vereist geen eigen SDK-generatie als Pulso uitsluitend met REST-management-API werkt. Als later fijnmazige event-subscription via gRPC nodig is, kan Pulso op dat moment alsnog een gegenereerde stub toevoegen.
