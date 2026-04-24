# 06 — Consent en profielclaims

> **Scope:** dit bestand beschrijft wat de CIAM na authenticatie aflevert aan de applicatie (claims, scopes, consent) en hoe consent per doeleinde wordt vastgelegd. De feitelijke autorisatielogica (welke actie mag een ingelogde gebruiker uitvoeren, wie is eigenaar van een family-plan, wie kan welke data van een ander family-lid zien) valt onder **A2 — Autorisatie** en wordt daar behandeld.

In casus 1 was het overheersende onderwerp: hoe komen **rollen** uit Entra terecht in een token. In een consumentencasus zijn rollen meestal minimaal (één rol: de user zelf) en verschuift het zwaartepunt naar **consent** — welke toestemming heeft de gebruiker gegeven, per doeleinde en per ontvanger.

## Claims die de CIAM aflevert

Na een succesvolle OIDC-flow ontvangt de applicatie een ID-token met standaard-claims plus Pulso-specifieke claims.

| Claim | Type | Gebruik |
|-------|------|---------|
| `iss` | Standaard | Token-validatie |
| `aud` | Standaard | Token-validatie |
| `exp`, `nbf`, `iat` | Standaard | Token-validatie |
| `sub` | Standaard | Stabiele user-identifier; primaire sleutel applicatie-zijdig |
| `email` | Standaard | Weergave, correspondentie |
| `email_verified` | Standaard | Voorwaarde voor premium-acties |
| `name`, `given_name`, `family_name` | Standaard | Weergave (als user ze heeft ingevuld) |
| `picture` | Standaard | Avatar |
| `locale` | Standaard | UI-taal |
| `amr` | Standaard | Welke auth-factoren zijn gebruikt (`pwd`, `mfa`, `webauthn`, `totp`) |
| `acr` | Standaard | Authentication context class — "gewone login" vs. "recent step-up" |
| `azp` | Standaard | Authorized party — de client die dit token heeft aangevraagd |
| `nonce` | Standaard | Replay-bescherming |
| `https://pulso.com/region` | Custom (namespaced) | Data-residency-keuze (`eu` / `us`) |
| `https://pulso.com/consents` | Custom (namespaced) | Bitmask van actieve consents (zie onder) |
| `https://pulso.com/family_plan_id` | Custom | Optioneel — verwijst naar family-plan indien lid |

### Waarom `amr` en `acr` ertoe doen

`amr` en `acr` zijn cruciaal voor step-up-beslissingen verderop in de applicatie:

- `amr` bevat bijvoorbeeld `["webauthn", "mfa"]` — dat betekent de user is via passkey ingelogd met een MFA-gelijkwaardig sterkte-niveau
- `acr` kan Pulso-specifieke waarden aannemen:
  - `urn:pulso:acr:passkey` — ingelogd met passkey
  - `urn:pulso:acr:password` — alleen wachtwoord
  - `urn:pulso:acr:password+totp` — wachtwoord + TOTP (step-up geweest)
  - `urn:pulso:acr:stepped_up_recent` — een step-up is binnen de laatste 5 minuten uitgevoerd

Een endpoint als "account verwijderen" vereist `acr >= urn:pulso:acr:stepped_up_recent`; anders 403 + redirect naar step-up.

### Wat NIET in claims zit

Pulso houdt het ID-token **bewust klein**. Wat er niet in zit:

- Abonnementstatus (premium / free / family) — leeft in applicatie-DB
- Voorkeuren, instellingen, favoriete workouts — applicatie-DB
- Rechten-lijst of scopes — scopes zitten in access-token, niet in ID-token
- Health-data — nooit in tokens, alleen via scoped API-calls

Rationale: ID-tokens verspreiden zich over kanalen (mobile, voice, LLM). Elke claim is een potentiële informatielek.

## Consent-model

Pulso onderscheidt minimaal vier categorieën consent:

| Categorie | Doeleinde | Juridische basis | Default |
|-----------|-----------|------------------|---------|
| **Functioneel** | App laten werken, abonnement beheren, basis workout-data | Uitvoering overeenkomst + gerechtvaardigd belang | Impliciet bij signup |
| **Gezondheidsdata** (art. 9 AVG) | Hartslag, slaap, gewicht, menstruatie, HealthKit/Fit | Expliciete toestemming, per type | Standaard uit |
| **Analytics** | Product-analytics, A/B-testing (alleen geaggregeerd) | Toestemming | Standaard uit |
| **Marketing** | Nieuwsbrief, gepersonaliseerde campagnes | Toestemming | Standaard uit |
| **Personalisatie** | AI-coaching, aanbevelingen op basis van eigen data | Toestemming | Standaard uit |
| **Delen met derden (specifiek)** | Strava-sync, Apple Health, LLM-integratie | Toestemming, per partij | Standaard uit |

Elke categorie is **apart opt-in**, met eigen uit-knop in de "Privacy"-pagina.

### Consent-representatie

Actieve consents worden in de CIAM bijgehouden (bijvoorbeeld Auth0 `user_metadata.consents`, Keycloak user-attributes) én in de applicatie-DB (voor uitputtende audit). In het ID-token vertegenwoordigd als bitmask of lijst:

```json
"https://pulso.com/consents": {
  "functional": true,
  "analytics": false,
  "marketing": false,
  "personalization": true,
  "health_data": {
    "heart_rate": true,
    "sleep": false,
    "weight": false
  },
  "third_party": {
    "apple_health": true,
    "strava": true,
    "llm_chatgpt": false,
    "llm_claude": true
  }
}
```

De applicatie gebruikt dit als **feature-flag**: een pagina toont pas aanbevelingen als `personalization=true`; synced Strava-data komt pas binnen als `third_party.strava=true`.

### Consent-log (verantwoordingsplicht)

De AVG eist **aantoonbaar** dat consent is gegeven (artikel 7 lid 1). Pulso houdt een **consent-log**:

| Veld | Voorbeeld |
|------|-----------|
| `user_id` | `auth0|662a4f9b2e8c4f0012345678` |
| `consent_category` | `third_party.llm_claude` |
| `action` | `granted` / `revoked` |
| `timestamp` | `2026-03-14T10:21:44Z` |
| `source_channel` | `web` / `ios_app` / `universal_login` |
| `policy_version` | `2026.03` |
| `ip_address` | gehashed / generaliseerd (t.b.v. AVG-proportionaliteit) |
| `evidence_text` | De exacte tekst die is getoond bij de toestemming |
| `evidence_ui_version` | Commit-hash of build-nummer van de UI |

Dit log is **immutable append-only** — nooit overschreven, wel via retentie-policy opgeruimd na 7 jaar (bewaartermijn voor verantwoording).

## Scopes — per kanaal en per doeleinde

Pulso definieert **fijn-granulaire scopes** die in OAuth access-tokens belanden. Dit is de brug tussen consent en technische toegang: consent → scope-beschikbaarheid → scope in access-token → API-toegang.

### Scope-hiërarchie

```
workouts.read           — lezen van eigen workouts
workouts.write          — toevoegen/wijzigen workouts
trainingsload.read      — berekende trainingslast
health.heartrate.read   — hartslag-tijdreeksen
health.sleep.read       — slaapanalyse
health.weight.read      — gewicht-tijdreeks
health.menstrual.read   — cyclus-data
coaching.personalized   — AI-coaching op persoonlijke data
coaching.stream         — real-time audio-coaching
voice.sessions.start    — sessies starten via voice
voice.sessions.read     — progressie opvragen via voice
voice.notes.write       — spraaknotities toevoegen
account.email.change    — e-mailadres wijzigen (step-up vereist)
account.subscription.manage — abonnement wijzigen (step-up vereist)
account.export          — data-export aanvragen (step-up vereist)
account.delete          — account verwijderen (step-up vereist)
```

### Regels

1. **Scopes zijn altijd minimum-noodzakelijk** per kanaal. Google Home krijgt nooit `health.*`; ChatGPT Actions krijgt alleen wat Nadia expliciet aanvinkt.
2. **Scopes zijn gebonden aan consent**. Een access-token met `health.heartrate.read` wordt alleen uitgegeven als `health_data.heart_rate=true` in de consent-status. Wordt consent ingetrokken, dan gaat de scope eruit bij volgende token-refresh.
3. **Scope-escalatie vraagt her-consent**. Een LLM-client die later ook `health.sleep.read` wil, moet een nieuwe consent-flow door — de oude autorisatie wordt daarop niet stilzwijgend uitgebreid.
4. **Downgrade is vrij**. Een user kan op elk moment scopes afnemen in de "Privacy"-pagina; het CIAM ontslaat de gerelateerde scopes bij volgende token-refresh.

## Consent per kanaal — concreet

### Web / mobile hoofdapp

Consent-instellingen zichtbaar in "Profiel → Privacy". Elke categorie een toggle met uitlegtekst en een link naar de verwerkingsgrond. Wijziging is direct effectief; bestaande tokens blijven geldig tot ze verlopen of expliciet worden geïnvalideerd.

### Voice (Google Home / Alexa)

Consent niet via stem (te ongenuanceerd). Initiële consent via **Account Linking-scherm** op koppelend device; wijzigingen via hoofdapp. Bij voice-start wordt géén herhaalde consent gevraagd.

### LLM-integratie

Strengste consent-pad. Bij eerste verbinding met een LLM-client:

1. CIAM toont consent-scherm met **per scope** een aparte toggle + uitleg
2. Gebruiker vinkt gewenste scopes aan
3. Step-up (passkey / TOTP) verplicht
4. Consent geldig 30 dagen; na 30 dagen vraagt het platform opnieuw

Zichtbaarheid achteraf: "Apparaten & integraties → LLM-integraties" toont per MCP-client welke scopes actief zijn.

### Smart glasses

Initiële consent via QR-handoff naar mobiele app; wijzigingen via hoofdapp. Op de bril zelf wordt geen consent aangevraagd (te weinig UI-ruimte).

## Privacy-by-default in claim-levering

Het CIAM-platform levert **niet standaard alles**. Pulso configureert claims per client-id:

- **Web-client**: alle standaard-claims + `consents` + `region`
- **Mobile-client**: idem
- **Voice-client**: alleen `sub`, `region`, geen e-mail of naam (voice heeft geen naam nodig)
- **ChatGPT-Actions-client**: `sub` + gekozen scopes, geen `email` (tenzij expliciet in scope)
- **Claude-MCP-client**: idem

Dit voorkomt dat een gebruiker onbedoeld persoonlijke data deelt met elke integratie.

## Effect per persona

| Persona | Consent-gedrag | Wat de applicatie ziet |
|---------|-----------------|-------------------------|
| **Amira** | Accepteert analytics + personalisatie, niet marketing | Aanbevelingen aan, geen nieuwsbrief |
| **Thomas** | Accepteert alleen functioneel bij signup | Minimale ervaring; geen aanbevelingen; dat merkt hij niet bewust |
| **Henk** | Zijn dochter heeft alles "standaard" aangezet | Alle functies werken voor Henk; hij heeft er geen mening over |
| **Nadia** | Per scope expliciet gekozen: LLM-Claude alleen workouts, geen analytics, geen marketing | Gefocust toegang; audit-log toont elke Claude-query |

## Relatie met andere bouwblokken

- **A2 — Autorisatie**: wie eigenaar is van welke data (eigen vs. family-plan-lid), wat rollen zoals family-admin mogen, en hoe de applicatie de scope- en claim-informatie inzet voor toegangsbeslissingen
- **C1 — Logging & Audit Trail**: het consent-log is ontworpen als onderdeel van de audit-trail; centrale opslag + retentie staan in C1
- **D3 — Compliance Evidence & Reporting**: hoe het consent-log wordt gebruikt als bewijs richting toezichthouder

## Waar dit bestand stopt

Buiten scope van A1 / dit bestand:

- Hoe de applicatie scopes **afdwingt** op API-endpoints (gebeurt per endpoint; autorisatie-logica in A2)
- Family-plan-rolmodel (A2)
- Hoe consent-wijzigingen downstream doorwerken in machine-learning-training data (data governance; D-groep)
- De UX van de consent-pagina zelf (product-UX; buiten bouwblok-scope)
