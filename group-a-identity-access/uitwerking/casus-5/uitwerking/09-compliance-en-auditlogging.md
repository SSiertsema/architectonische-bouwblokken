# 09 — Compliance en auditlogging

## Toepasselijk kader

Voor een consumer-wellness-aanbieder zoals Pulso is het compliance-landschap fundamenteel anders dan voor een gemeente (casus 1). Dominant:

- **AVG / UAVG** — verwerking van persoonsgegevens, waaronder gezondheidsdata (art. 9)
- **EHDS** (European Health Data Space) — in voorbereiding; relevant voor secundair gebruik van health-data en portabiliteit tussen diensten
- **ePrivacy (cookiewet)** — dominant voor het web-kanaal; consent voor trackers
- **Apple App Store Review Guidelines** — sectie 5.1 (privacy), health-apps-specifieke policies
- **Google Play Developer Policy** — health-apps, user data, permissions
- **Apple HealthKit / Google Fit platform policies** — eigen privacy-reviews en gebruiksbeperkingen
- **SOC 2 Type II** — certificering voor B2B2C-partnerships (werkgevers-wellness)
- **ISO 27001** — in aantocht; referentie voor beveiligingsbeheer
- **NIS2** — onder onderzoek voor middelgrote digitale aanbieders
- **Sectorale afzonderlijke regelgeving** (niet van toepassing op Pulso): Pulso is **geen** medisch hulpmiddel (MDR), **geen** betaaldienst (PSD2), **niet** aangewezen als essentiële dienst onder NIS2 categorieën als waterveiligheid

## AVG-onderdelen relevant voor A1 in deze casus

| Artikel | Onderwerp | Invulling in deze casus |
|---------|-----------|--------------------------|
| Art. 5(1)(a) | Rechtmatig, behoorlijk, transparant | Consent per doeleinde + leesbare privacystatement + audit-log |
| Art. 5(1)(b) | Doelbinding | Scopes afgestemd op expliciet doel per kanaal |
| Art. 5(1)(c) | Minimale gegevensverwerking | Progressive profiling + claim-scope per client-id |
| Art. 5(1)(e) | Opslagbeperking | Retentie-policies per event-type; inactieve-account-opruiming |
| Art. 5(1)(f) | Integriteit en vertrouwelijkheid | Argon2id, passkey-adoptie, DPoP, encryptie at-rest + in-transit |
| Art. 6 | Rechtsgrondslag | Per doeleinde gedocumenteerd (uitvoering overeenkomst / toestemming / gerechtvaardigd belang) |
| Art. 7 | Voorwaarden toestemming | Consent-log, intrekbaar, granulair, aparte opt-ins |
| Art. 9 | Bijzondere categorieën | Gezondheidsdata alleen met expliciete toestemming + per sub-categorie |
| Art. 15 | Recht op inzage | Self-service data-export (JSON + PDF) |
| Art. 16 | Recht op rectificatie | Profiel-pagina, e-mail-wijzigen-flow |
| Art. 17 | Recht op vergetelheid | Self-service account-deletie met 14-dagen grace |
| Art. 20 | Recht op dataportabiliteit | Machine-leesbare export, bij voorkeur in standaardformaten |
| Art. 21 | Recht van bezwaar | Opt-out marketing en personalisatie zonder restricties |
| Art. 25 | Privacy by design/default | Defaults conservatief (marketing uit, analytics uit) |
| Art. 30 | Verwerkingsregister | Gehouden buiten dit bouwblok; A1 levert evidence-data |
| Art. 32 | Beveiliging | MFA-optie, passkeys, breach-detection, encryptie |
| Art. 33 | Meldplicht datalekken | 72-uur AP-meldplicht; sign-in-logs zijn primaire forensische bron |
| Art. 34 | Communicatie bij datalekken | Mail naar getroffen users vanuit geverifieerd adres |

## EHDS — vooruitblik

EHDS (European Health Data Space) wordt van kracht 2027-2029 afhankelijk van sub-onderdeel. Pulso bereidt zich voor:

- **Primair gebruik** (door de user zelf en door hulpverleners met toestemming): standaard-interoperabele uitwisseling in FHIR-formaat
- **Secundair gebruik** (research, beleidsvorming — opt-out): Pulso zal een expliciete opt-out bieden; default opt-in bij wet maar Pulso zet in op opt-out voor privacy-positionering
- Koppeling tussen A1 (identiteit) en EHDS: de **user moet uniek identificeerbaar** zijn over datasets heen — `sub` + verified e-mail is daar de drager

## Platform-policies (App Store, Play, HealthKit, Fit)

Apple en Google stellen eisen aan authenticatie in hun ecosystemen:

### Apple

- **Guideline 5.1.1(v)**: een account mag niet vereist zijn voor functies die er niet afhankelijk van zijn — vrije content moet ook zonder signup beschikbaar (Pulso's gratis niveau voldoet)
- **Guideline 5.1.1(iv)**: "Sign in with Apple" verplicht als andere social login wordt aangeboden
- **Guideline 5.1.1(i)**: data-deletie-optie in de app (niet alleen op de web-site)
- **HealthKit Review**: aparte privacy-uitleg in-app + expliciete Apple-consent-flow voor elke data-type

### Google

- **Health Apps policy**: voor apps met `BODY_SENSORS`, `ACTIVITY_RECOGNITION`, Fit API-gebruik — privacy-verklaring expliciet bij install
- **User Data policy**: consent-flow moet los zijn van de algemene ToS; opt-out moet even makkelijk als opt-in
- **Account deletion**: web-link + in-app-flow verplicht (in 2024/2025 aangescherpt)

Pulso heeft deze requirements verwerkt in de consent-flow (zie `06-consent-profielclaims.md`) en account-deletie (zie `08-accountlifecycle-en-herstel.md`).

## Auditlogging — bronnen

In tegenstelling tot casus 1 (waar Entra sign-in-logs de primaire bron zijn) zit Pulso's auditbewijs in meerdere bronnen die via een event-stream samenkomen.

### 1. CIAM event-stream

Elke serieuze CIAM biedt gestructureerde event-export:

- **Auth0**: Log Streams (HTTP/Datadog/Splunk/EventBridge) — real-time push van sign-in, sign-up, management-events
- **Keycloak**: Event Listener SPI — schrijft naar Kafka/HTTP/custom sink
- **Cognito**: CloudWatch + CloudTrail + EventBridge
- **Stytch**: Webhooks + audit API

Pulso stuurt alles naar één ingestion-endpoint (Fastify-service) die events:

1. Verrijkt met Pulso-context (`user_id`-mapping, `region`)
2. Schrijft naar Datadog voor warm gebruik + dashboards
3. Spiegelt naar S3 Glacier Deep Archive voor lange-termijn-retentie (immutable, object-lock)

### 2. Applicatie-events

Niet alles zit in de CIAM. Pulso's eigen backend logt ook:

- Consent-wijzigingen (gedetailleerder dan wat CIAM ziet)
- Data-export-verzoeken en -leveringen
- Account-deletie lifecycle-stappen
- LLM-query-logs (welke MCP-client vroeg wat op welke tijd)
- Family-plan-overgangen
- Step-up triggering context (welke actie vroeg step-up)

Deze applicatie-events komen bij dezelfde ingestion-endpoint binnen — uniformiteit is bewust.

### 3. Web edge-logs

CloudFront + WAF-logs staan in een apart S3-bucket en worden gecorreleerd via `request_id`. Ze bevatten IP-adressen en user-agent-strings, wat CIAM-logs soms niet doen.

### Voor A1 relevante event-types

| Event | Bron | Retentie |
|-------|------|----------|
| `login.success` | CIAM | 3 jaar |
| `login.failure` | CIAM | 3 jaar |
| `signup.success` | CIAM | 7 jaar |
| `signup.failure` | CIAM | 1 jaar (fraud-detectie) |
| `password.reset_request` | CIAM | 3 jaar |
| `password.reset_complete` | CIAM | 7 jaar |
| `email.change_requested` | Applicatie | 7 jaar |
| `email.change_complete` | CIAM + Applicatie | 7 jaar |
| `mfa.challenge_issued` | CIAM | 3 jaar |
| `mfa.challenge_success` / `mfa.challenge_failure` | CIAM | 3 jaar |
| `passkey.added` / `passkey.removed` | CIAM | 7 jaar |
| `session.created` | CIAM | 1 jaar |
| `session.revoked` | CIAM | 3 jaar |
| `token.refreshed` | CIAM | 90 dagen (high-volume) |
| `token.revoked_due_to_reuse_detection` | CIAM | 7 jaar (security-critical) |
| `consent.granted` / `consent.revoked` | Applicatie | 7 jaar |
| `data_export.requested` / `data_export.delivered` | Applicatie | 7 jaar |
| `account.deletion_requested` / `account.deletion_executed` | Applicatie | 7 jaar (geanonimiseerd) |
| `risk.high_risk_detected` | CIAM + applicatie-risk-engine | 7 jaar |
| `device.linked` / `device.unlinked` | CIAM + applicatie | 3 jaar |
| `llm.client_registered` / `llm.client_revoked` | Applicatie | 7 jaar |
| `llm.scope_granted` / `llm.scope_revoked` | Applicatie | 7 jaar |

## Retentie-rationale

Algemene uitgangspunten:

- **Security-critical events** (wachtwoord-reset, passkey-toevoeging, reuse-detectie): 7 jaar (parallel aan breach-onderzoeks-termijnen)
- **Routine-events** (login success): 3 jaar — voldoende voor anomalie-onderzoek
- **Hoog-volume events** (token-refresh): 90 dagen — storage-kosten vs. nut
- **Consent-events**: 7 jaar (AVG-verantwoordingsplicht)
- **Verwijderde account-events**: 7 jaar geanonimiseerd (user_id → hash)

Alle events in immutable Glacier-opslag met Object Lock (compliance-mode).

## Bewijsvoering — audit-queries

De volgende queries zijn opgeslagen als saved searches in Datadog en op lange-termijn-opslag (Athena over Glacier-data):

| Vraag | Query-onderwerp |
|-------|------------------|
| Is iemand ingelogd zonder MFA waar MFA vereist was? | `@event:login.success @mfa_required:true @mfa_used:false` |
| Welke logins mislukten en waarom? | `@event:login.failure`, aggregate op `reason` |
| Hoe vaak triggerde step-up gevoelige acties? | `@event:mfa.challenge_issued @context:sensitive_action` |
| Wie heeft account-deletie aangevraagd? Wanneer werd hij uitgevoerd? | Correlate `deletion_requested` en `deletion_executed` |
| Voor welke users is recent reuse-detection uitgeslagen? | `@event:token.revoked_due_to_reuse_detection`, laatste 90d |
| Welke LLM-clients heeft user X de afgelopen 30 dagen gebruikt? | `@user_id:X @event:llm.*` |
| Hoe vaak is bot-detection uitgeslagen per dag? | `@event:bot.detected` count by day |
| Welke data-exports zijn afgeleverd en wanneer? | `@event:data_export.delivered`, per user |
| Welke consents heeft user X actief en hoe zijn ze ontstaan? | `@event:consent.granted @user_id:X` + current consent-state |
| Is er patroon van geografische spring-in-logins (mogelijke ATO-poging)? | `@event:login.success` velocity-query per user |

## Alerting

Subset van bovenstaande queries is omgezet in real-time alerts (richting **C2**):

- **High**: massale bot-signup (meer dan 200 per minuut van één IP-range), credential-stuffing-campagne-detectie, reuse-detection boven threshold
- **Medium**: mislukte MFA-challenges boven normaal, verdachte geo-spring, onverwachte spike in account-deletion-requests
- **Low**: informatieve dashboards voor dagstand van CIAM-gezondheid

Alerts gaan naar Trust & Safety on-call via PagerDuty; High-severity ook naar CISO.

## Persoonsgegevens in logs

Sign-in- en consent-logs bevatten persoonsgegevens (user-id, e-mail, IP, locatie, device-fingerprint). Conform AVG:

- **Doelbinding**: logs worden gebruikt voor beveiliging, fraudedetectie, auditing, incident-afhandeling, AVG-verantwoording — nooit voor marketing, nooit voor productoptimalisatie op basis van individueel gedrag
- **Minimalisatie**: IP-adressen worden **na 30 dagen geredigeerd** naar /24 (IPv4) of /48 (IPv6) — behalve voor high-risk events waar volledige IP 90 dagen bewaard blijft
- **Bewaartermijn**: zoals per event-type hierboven; na termijn automatisch gewist via S3 lifecycle policies
- **Toegang**: alleen Trust & Safety, Security en aangewezen auditors (rol-based in AWS IAM); toegang zelf wordt gelogd (CloudTrail)
- **User-inzage**: user kan een beperkte set (zijn eigen sign-in-events van de laatste 90 dagen) inzien in "Apparaten & integraties" en in de data-export

## Datalek-procedure (AVG art. 33 / 34)

Bij een vermoeden of bevestiging van een persoonsgegevens-incident:

1. Trust & Safety-on-call classificeert binnen 1 uur
2. Forensisch team haalt relevante events uit Datadog + Athena-queries over Glacier-data
3. Scope bepaald (welke users, welke gegevenscategorieën)
4. Bij bevestigde meldingsplicht: AP-melding binnen 72 uur via reguliere meldingstool
5. Bij hoog risico voor getroffenen: notificatie aan betrokken users via geverifieerd e-mailadres (en in-app-banner)
6. Post-incident review en lessons-learned

## Certificeringen

- **SOC 2 Type II** — jaarlijkse audit; A1-evidence komt uit de logs hierboven
- **ISO 27001** (geplanned voor 2026) — brede scope; auth-logging voedt control-families A.9 (Access Control) en A.12 (Operations Security)
- **HIPAA** — Pulso is geen US healthcare-gedekte entiteit; HIPAA is niet van toepassing, maar wordt als "nice to have" referentie gehanteerd

## Platform-verschillen — compliance

| Compliance-onderwerp | Auth0 | Keycloak |
|----------------------|-------|----------|
| Data-residency | Keuze uit US, EU, AU regio's; tenant-gebonden | Volledige controle — waar Pulso host |
| SOC 2 Type II | Auth0 zelf gecertificeerd; Pulso erft controls | Pulso moet alles zelf certificeren |
| GDPR DPA | Standaard DPA beschikbaar | Intern — Pulso is zelf verwerker |
| Event-stream format | Auth0 Log Streams JSON | Keycloak event JSON via SPI |
| Retention native | Beperkt — export nodig | Afhankelijk van database-retentie |
| FedRAMP (niet relevant voor Pulso) | Geen — Okta US Public Sector apart | Zelf te certificeren |

Self-host geeft Pulso alle certificeringsverantwoordelijkheid; managed deelt die af. Bij een bedrijfje van 55 FTE is dit een materiële afweging.

## Verhouding tot andere bouwblokken

- **A2 — Autorisatie**: audit-events rond toegang tot andermans data (family-plan), rol-wijzigingen
- **C1 — Logging & Audit Trail**: brede logging-architectuur; dit bestand beperkt zich tot auth-events en consent
- **C2 — Monitoring & Alerting**: detectie- en alerting-logica
- **D1 — Standaarden Compliance Registry**: AVG-onderdelen en platform-policies zoals hier geciteerd worden centraal onderhouden
- **D3 — Compliance Evidence & Reporting**: het proces rond AVG-verzoeken, SOC 2-audit, EHDS-voorbereiding
- **D4 — Rollen & Verantwoordelijkheden**: wie (Trust & Safety, Security, DPO) bezit welke logs
