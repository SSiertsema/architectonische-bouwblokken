# Organisatieprofiel: Pulso (fictief)

**ID:** `pulso`
**Created:** 2026-04-24
**Version:** 1.0
**Context:** Casus 5 — Consumentenproduct (CIAM) — multi-kanaals wellness-platform

> Pulso is een fictief profiel, bedoeld om casus 5 en de bijbehorende persona's een concrete organisatorische achtergrond te geven. Waar cijfers genoemd worden zijn ze representatief voor een middelgrote Europese consumer-wellness-aanbieder, maar niet gekoppeld aan een bestaand bedrijf.

---

## Overview

> Pulso is een Nederlandse wellness- en fitness-aanbieder die een abonnementsdienst aanbiedt voor begeleide workouts, ademhalingsoefeningen en slaapcoaching. Het aanbod is bewust multi-kanaals: een web-app, native apps voor iOS en Android, integratie met wearables (Apple Watch, Wear OS, Garmin), voice-assistenten (Google Home, Alexa), LLM-integraties (ChatGPT Actions, Claude/MCP-server) en sinds recent een pilot op smart glasses. De gebruikersbasis is wereldwijd maar geworteld in Nederland; Europa is de primaire markt.

---

## Identiteit

| Kenmerk | Waarde |
|---------|--------|
| **Type** | Consumer-wellness SaaS (B2C abonnementsdienst) |
| **Oprichting** | 2019 |
| **Hoofdkantoor** | Amsterdam (NL) |
| **Medewerkers** | ~55 FTE, waarvan ~30 in engineering |
| **Gebruikers (MAU)** | ~650.000 wereldwijd |
| **Betalende abonnees** | ~200.000 |
| **Primaire markten** | Nederland, Duitsland, Verenigd Koninkrijk, Verenigde Staten |
| **Abonnementsmodel** | Free (progressive profiling), Premium (individueel), Family (tot 6 leden) |

---

## Missie en propositie

Pulso's belofte aan de gebruiker: "begeleiding die met je meebeweegt". In de praktijk betekent dat:

- Coaching die op het juiste device op het juiste moment beschikbaar is — een ademhalingsoefening aan tafel via de Google Home, een workout met hartslagbegeleiding via Apple Watch, een sessie samenvatten via een LLM-coach
- Lage instapdrempel (gratis niveau met progressive profiling) en hoge retentie door slimme context (begrijpt welk device je waar gebruikt)
- Privacy-first positionering — dat onderscheidt Pulso in een markt waarin veel apps gezondheidsdata doorverkopen

## Kerndiensten

- **Workout-begeleiding** — video- en audio-coaching, op maat voor niveau en doel
- **Ademhalings- en mindfulness-oefeningen** — veel gebruikt via voice-assistenten
- **Slaapcoaching** — analyse op basis van wearable-data
- **Community** — privé-groepen met bekenden, uitdagingen, delen van prestaties (opt-in)
- **Integraties** — Apple Health, Google Fit, Strava, Garmin Connect (bidirectioneel data-uitwisselen met opt-in scopes)
- **Voice-coaching** — "Hey Google, start een korte ademhalingsoefening met Pulso"
- **LLM-coaching** — "Vraag Pulso wat ik vandaag beter kan trainen" (via ChatGPT Actions of Claude MCP-integratie)
- **Smart glasses (pilot)** — heads-up workout-begeleiding voor lopen, yoga en krachttraining

---

## Organisatiestructuur (relevant voor casus 5)

| Onderdeel | Rol t.o.v. casus 5 |
|-----------|--------------------|
| **Product & Engineering** | Eigenaar van het CIAM-platform; bepaalt flows, features en device-koppelingen |
| **Security & Privacy** (1 CISO, 1 Privacy Lead / FG) | Stelt AVG- en security-beleid vast; toetser bij wijzigingen aan auth-flows |
| **Trust & Safety** | Bot- en fraudepreventie; accountherstel-escalaties; abuse-meldingen |
| **Growth / CRM** | Vraagpartij voor consent-categorieën (marketing, personalisatie) |
| **Customer Support** | Eerste lijn voor accountherstel; eigenaar van de support-UX binnen de CIAM-flow |
| **Legal / DPO** | AVG-compliance, EHDS-voorbereiding, App Store / Play Store policies |
| **Platform SRE** | Cloud-platform, observability, incident response |

---

## IT- en identiteitslandschap

Pulso is **cloud-native vanaf dag één**. Er is geen legacy-voetafdruk; het bedrijf is niet gebonden aan een corporate Microsoft- of Google-stack.

### Kernelementen

- **Cloud**: AWS als primair platform (eu-west-1 / eu-central-1), met failover in us-east-1 voor Noord-Amerikaanse gebruikers — data-residency-keuzes per gebruiker
- **Compute**: container-workloads op EKS, serverless functies voor webhook-processors
- **Databases**: Aurora PostgreSQL (transactioneel), DynamoDB (sessies en session-index), TimeScaleDB (workout-timeseries)
- **CDN + WAF**: CloudFront + AWS WAF
- **Identity**: op dit moment Auth0 (managed CIAM); wordt in deze casus heroverwogen met Keycloak als alternatief
- **Mobile**: native iOS en Android; shared networking via een eigen SDK
- **Observability**: Datadog (metrics, APM, logs) + Sentry (errors)
- **CI/CD**: GitHub Actions + ArgoCD
- **Secrets**: AWS Secrets Manager + per-environment KMS-keys

### Applicatielandschap (illustratief)

- **Web-app** (`app.pulso.com`) — Vue 3 SPA met Node.js/Fastify BFF
- **Marketing site** (`pulso.com`) — Astro statische site
- **iOS-app** — SwiftUI, distributie via App Store
- **Android-app** — Jetpack Compose, distributie via Play Store
- **Wearable-modules** — watchOS companion + Wear OS + Garmin Connect IQ-app + Fitbit Web API-integratie
- **Voice-skills** — Google Home Action, Alexa Skill, eigen voice-backend (NLU + TTS)
- **LLM-integraties** — Claude MCP-server, ChatGPT Actions-manifest
- **Admin dashboard** — intern, voor support en Trust & Safety; gebruikt Entra ID workforce SSO (buiten scope van deze casus — zie casus 1)

---

## Compliance- en beleidskader

| Kader | Relevantie |
|-------|------------|
| **AVG / UAVG** | Dominant — persoonlijke gezondheidsdata valt onder bijzondere categorie (art. 9) |
| **EHDS — European Health Data Space** | In aantocht; Pulso bereidt zich voor op secundair gebruik-compliance en data-portabiliteit |
| **NIS2** | Mogelijk relevant als "digitale aanbieder" van middelgrote schaal — in onderzoek |
| **ePrivacy / Cookiewet** | Dominant voor web-kanaal; consent-banner verplicht voor analytics/marketing |
| **App Store Review Guidelines** (Apple) | Sectie 5.1 (privacy), 5.1.1 (data-collectie), 5.1.2 (data-gebruik), 5.1.5 (locatie) |
| **Google Play Developer Policy** | Health-apps policy, user data policy, permissions |
| **Apple HealthKit / Google Fit policies** | Aparte privacy-toelichting en expliciete opt-in voor lezen/schrijven |
| **SOC 2 Type II** | Voltooid in 2024 voor enterprise/family-B2B-klanten |
| **ISO 27001** | Geplande certificering in 2026 — voorwaarde voor partnerships met werkgevers-wellness |

---

## Risicoprofiel

- **Credential stuffing** — Pulso-accounts worden actief aangevallen via gerecyclede wachtwoorden uit andere breaches
- **Account takeover via social login drift** — een gebruiker verliest toegang tot zijn oude Gmail-account en daarmee tot Pulso
- **Health-data-lek** — schaamtegevoelige data (gewicht, menstruatiecyclus, slaap); impact persoonlijk én reputationeel
- **Review bombing bij auth-incidenten** — een verbroken login-flow leidt binnen uren tot 1-ster-reviews in de App/Play Store
- **Voice-assistent abuse** — een huisgenoot die "Hey Google, toon Pulso-voortgang van Anna" zegt — accountlinking-ontwerp moet dit afvangen
- **LLM-integratie risico's** — onbedoelde data-exfiltratie via prompt injection; scope-creep in LLM-access
- **Smart glasses compliance** — nieuwe device-klasse met onzekere privacy-reviews; eerste launches worden door privacy-watchdogs bekeken
- **Family-plan fraude** — "family" wordt misbruikt als gedeelde-account-model met 6 losse gebruikers

---

## Stakeholders en ketenpartners

| Stakeholder | Relatie |
|-------------|---------|
| **Eindgebruikers (consumenten)** | Primaire afnemers; direct betalend |
| **Social-login-providers** (Apple, Google, Microsoft, Facebook) | IdP-federatie voor signup/login |
| **Wearable-platforms** (Apple, Google, Garmin, Fitbit) | Data-integratie + reviewproces voor HealthKit/Fit |
| **App distributieplatforms** (Apple App Store, Google Play) | Distributie + beleidsvereisten + review |
| **Voice-platforms** (Google, Amazon) | Account Linking + skill-review |
| **LLM-platforms** (OpenAI ChatGPT, Anthropic Claude) | Action/MCP-koppeling; eigen authorization-flows |
| **Betaaldienstverleners** (Stripe, Adyen) | Abonnementen; buiten scope A1, maar raakvlak met step-up bij abonnementswijzigingen |
| **CIAM-leverancier** (momenteel Auth0) | Kritieke SaaS-dependency |
| **Autoriteit Persoonsgegevens** | Toezichthouder AVG — meldplicht datalekken |
| **Privacy-watchdogs en pers** | Reputationeel relevant, zeker bij nieuwe device-klassen |

---

## Constraints en randvoorwaarden

- **Kostenmodel per MAU** — CIAM-kosten schalen mee met de gebruikersbasis; boven 500k MAU is de prijsstaffel materieel voor de winstgevendheid
- **Time-to-market** — Pulso concurreert op feature-tempo; auth-wijzigingen mogen het release-ritme niet vertragen
- **Data-residency** — EU-gebruikers houden data in EU; US-gebruikers mogen in US-regio; data-migratie tussen regio's is complex
- **Beperkte IT-tolerantie bij eindgebruikers** — anders dan in B2B accepteert een consument géén "bel de servicedesk"; elk probleem moet self-serve oplosbaar zijn
- **Platform-reviewcycli** — een wijziging in de iOS-login-flow kost 2-4 weken doorlooptijd door App Store Review
- **No-code/low-code bestuurbaarheid** — Growth en Support willen flows kunnen bijsturen zonder releasecyclus (rules/actions in de IdP)
- **Incidentresponse-eisen** — AP-meldplicht binnen 72 uur bij datalekken; alle auth-events moeten binnen die termijn reconstrueerbaar zijn

---

## Digitale strategie en ambitie

- **Privacy als onderscheidend kenmerk** — geen doorverkoop van data; lokale verwerking waar mogelijk
- **Multi-device, multi-modaal** — elk nieuw groot apparaat (smart glasses, AR) wordt serieus bekeken; de login-flow moet erin passen zonder herontwerp
- **Passwordless tegen 2027** — passkeys als primaire methode; wachtwoord als erfenis-fallback
- **Open standaarden boven vendor lock-in** — Pulso gebruikt graag managed diensten, maar wil migratiepaden openhouden (vandaar het onderzoek naar Keycloak als alternatief)
- **LLM en AR als groeivectoren** — authenticatie en consent mogen geen rem zijn op product-experimenten in deze richtingen
- **Community-opbouw** — gedeelde accounts ("family") zonder dat het privacy-discipline uitholt

---

## Relevantie voor casus 5

Pulso is een typische CIAM-casus nieuwe stijl: consumer-schaal, multi-modaal, privacy-gevoelig, en bewust niet gebonden aan één corporate identiteitsstack. Het bedrijf staat voor concrete afwegingen die in dit bouwblok terugkomen:

- Een greenfield keuze tussen managed CIAM (Auth0, Cognito, Entra External ID, Clerk, Stytch, ...) en self-hosted (Keycloak, Ory, Zitadel)
- Een breed device-spectrum dat dezelfde identiteit moet dragen
- AVG-consent dat per doeleinde en per kanaal gedifferentieerd moet worden
- Fraude- en misbruikpreventie die dagelijks ingrijpt, niet alleen in de randgevallen
- Lifecycle-flows die self-serve moeten werken — van signup tot verwijdering
- Een technische architectuur die het product naar LLM's en smart glasses kan volgen zonder dat de auth-laag steeds wordt overhoop gehaald

Concreet voor deze uitwerking:

- De vier persona's (Amira, Thomas, Henk, Nadia) zijn allen Pulso-gebruikers; samen raken ze alle flows
- De technische uitwerking in `tech/` laat twee paden zien: Auth0 als managed leidraad en Keycloak als self-host alternatief — beide zijn in Pulso-stijl onderhoudbaar door een klein engineering-team
- De keuzes rond data-residency (EU vs US), consent-gedifferentieerde claims en device-specifieke token-levensduren zijn reëel voor een organisatie op deze schaal

---

## Notes

- Dit profiel is **fictief en illustratief**. Gegevens zoals MAU, regio's en integraties zijn plausibel voor een middelgrote consumer-wellness-aanbieder in 2026.
- Pulso is bewust *niet* gereguleerd als medisch hulpmiddel of betaaldienst — dat zou de casus richting MDR / PSD2 duwen, wat buiten de intentie van deze A1-uitwerking valt.
- Naar verwachting komen er meer persona's en scenario's bij wanneer andere bouwblokken (A2, A3, B-groep, C-groep) op Pulso worden uitgewerkt.
