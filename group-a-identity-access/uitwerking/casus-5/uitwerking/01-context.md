# 01 — Context en uitgangspunten

## Situatieschets

Deze casus betreft een consumentenproduct: een multi-kanaals wellness- en fitness-abonnementsdienst voor eindgebruikers. Als referentie-organisatie geldt **Pulso** (zie `../organisatieprofielen/pulso.md`), een Nederlandse aanbieder met ~650.000 MAU wereldwijd, ~200.000 betalende abonnees, en een bewust multi-modale productstrategie: iOS- en Android-apps, een web-app, integraties met Apple Health / Google Fit / Strava / Garmin Connect, voice-skills op Google Home en Amazon Alexa, LLM-integraties (ChatGPT Actions, Claude via MCP-server) en een pilot op smart glasses.

De gebruikers zijn niet één homogene groep. Vier persona's maken de spreiding concreet en worden consequent teruggekoppeld in de ontwerpkeuzes:

- `../personas/amira-fanatieke-sporter.md` — wearable-first, passkeys, dagelijks gebruik
- `../personas/thomas-wisselgebruiker.md` — sporadisch, wachtwoordherstel-centraal
- `../personas/henk-voice-first-gebruiker.md` — voice-only via Google Home, toegankelijkheid
- `../personas/nadia-privacy-professional.md` — LLM- en smart-glasses-pionier, AVG-rechten

De authenticatie-architectuur moet elk van deze gebruikers door hun primaire kanalen dragen — en ook door de randgevallen (migratie naar nieuwe telefoon, verbroken Google-Home-koppeling, verlopen passkey op een kwijtgeraakt device).

## Uitgangspunten

De volgende technische, organisatorische en juridische gegevens zijn als uitgangspunt genomen en vormen de basis voor de verdere uitwerking in deze map:

- **Gebruikersbron**: geen corporate IdP en geen HR-bron — elke gebruiker registreert zichzelf
- **Primaire markten**: Nederland, Duitsland, Verenigd Koninkrijk, Verenigde Staten; EU-hosting voor EU-gebruikers, US-hosting voor US-gebruikers
- **Cloudplatform**: AWS (eu-west-1, eu-central-1, us-east-1), cloud-native vanaf dag één, geen legacy-voetafdruk
- **Abonnementsmodel**: gratis niveau (progressive profiling) + Premium (individueel) + Family (tot 6 leden)
- **Compliance-baseline**: AVG/UAVG is dominant; gezondheidsdata valt onder bijzondere categorie (art. 9 AVG); EHDS in aantocht; Apple HealthKit en Google Fit hebben eigen privacy-reviewprocessen; App Store en Play Store policies gelden voor de native apps
- **CIAM-platformstatus**: Pulso gebruikt momenteel Auth0; in deze casus wordt de platformkeuze **bewust heroverwogen** met Keycloak als volwaardig alternatief, zodat de managed-vs-self-host-afweging expliciet wordt
- **Device-breedte**: web (SPA + BFF), native iOS (SwiftUI), native Android (Jetpack Compose), Apple Watch + Wear OS + Garmin Connect IQ companion-apps, Google Home Action, Alexa Skill, ChatGPT Actions, Claude MCP-server, Meta Ray-Ban smart glasses (pilot)
- **Organisatorisch**: Product & Engineering bezit de CIAM-configuratie; Security & Privacy + Legal/DPO zijn toetsende partijen; Trust & Safety neemt de fraude- en misbruik-response voor zijn rekening; Customer Support is eerste lijn voor accountherstel

## Scope van deze uitwerking

**Binnen scope:**
- Keuze en vergelijking van CIAM-platformen (managed, dev-first, self-host, BaaS) met selectiecriteria
- Authenticatieflows voor web (BFF), native mobile (public client met PKCE), limited-UI devices (device flow), voice-assistenten (account linking) en LLM-integraties (dynamic client registration + OAuth 2.0)
- Passkeys als primaire methode, social login als alternatief, e-mail/wachtwoord als fallback
- Fraude- en misbruikpreventie (bot, credential stuffing, ATO, device fingerprint, risk-based step-up)
- AVG-consent per doeleinde + scope-design voor third-party integraties
- Sessie- en tokenbeleid: refresh-rotation, step-up voor gevoelige acties, device-binding, session-management
- Accountlifecycle: signup, verify, progressive profiling, herstel, e-mailwijziging, device-kwijt, verwijdering, family-plan
- Compliance-kaders en auditlogging specifiek voor authenticatie

**Buiten scope:**
- Inhoudelijke autorisatielogica voor de applicatie zelf, inclusief family-plan rolmodel (zie **A2 — Autorisatie**)
- Applicatiesessiegedrag dat losstaat van de IdP, zoals concurrent-session-limiet binnen de applicatie (zie **A3 — Sessiemanagement**)
- Geheimenbeheer buiten de scope van authenticatie (zie **B3 — Secrets Management**)
- Bredere logging- en monitoringinrichting (zie **C1** en **C2**)
- Workforce-authenticatie van Pulso-medewerkers (admin dashboard, engineering tools) — dat patroon is casus 1
- Betalingsflows (Stripe, Adyen) — alleen het raakvlak met step-up bij abonnementswijzigingen wordt genoemd

## Positionering ten opzichte van casus 1

Waar casus 1 rust op een bestaande werkplek-IdP en zich richt op één homogene gebruikersgroep, vertrekt casus 5 vanuit het tegenovergestelde uitgangspunt: zelfregistrerende consumenten zonder gedeelde IdP-context, op uiteenlopende devices, met sterk uiteenlopende tech-affiniteit. Het contrast per onderwerp:

| Onderwerp | Casus 1 | Casus 5 |
|-----------|---------|---------|
| Identiteitsbron | HR → AD → Entra ID | Zelfregistratie per gebruiker |
| Dominant protocol | OIDC (met bekende tenant) | OIDC + OAuth 2.0 + WebAuthn + Device Flow + social federatie |
| Sterkste controle | Conditional Access bij IdP | Fraude- en misbruikpreventie in de auth-laag + risk-based step-up |
| Autorisatiemodel | App roles via claims | Owner-of-own-data + family-plan (minimale rollen) |
| Sessielevensduur | 8 uur werkdag | Lange sessies met refresh-rotation; step-up voor gevoelige acties |
| Compliance-drijver | BIO / ENSIA / NCSC | AVG / EHDS / App Store / HealthKit / Google Fit |
| Device-breedte | Beheerde werkplek | Web + mobile + wearable + voice + LLM + smart glasses |
| Platformkeuze | Gegeven (Entra ID aanwezig) | Greenfield afweging tussen >15 serieuze opties |

## Leeswijzer

De volgende bestanden in deze map werken elk een specifiek aspect verder uit:

- `02-identiteitsarchitectuur.md` — CIAM-platformlandschap, selectiecriteria, datamodel user vs. identity, netwerkpositie
- `03-authenticatieflow-en-registratie.md` — passkeys, social login, e-mail+wachtwoord, progressive profiling, Authorization Code + PKCE
- `04-device-en-kanaalintegratie.md` — wearable pairing, Device Authorization Grant, Account Linking voor voice, LLM-integraties (MCP + ChatGPT Actions), smart glasses QR-handoff
- `05-fraude-en-misbruikpreventie.md` — bot-signup, credential stuffing, ATO, device fingerprint, adaptive step-up
- `06-consent-profielclaims.md` — AVG-consent per doeleinde, claims die de IdP aflevert, scope-design voor third-party integraties
- `07-sessie-en-tokens.md` — tokenlevensduur per device-klasse, refresh-rotation, step-up, session-management API
- `08-accountlifecycle-en-herstel.md` — signup → verify → progressive profiling → herstel → e-mailwissel → device-kwijt → verwijdering → family-plan-eigenaarschap
- `09-compliance-en-auditlogging.md` — AVG + EHDS + platform-policies + consent-log + erasure-log + sign-in-log
- `10-ciam-providerlijst-per-continent.md` — catalogus van betrouwbare CIAM-providers per continent, met hosting-regio's en selectie-advies

De technische uitwerking in `tech/` toont **twee volledige varianten** naast elkaar: Auth0 (managed SaaS, leidraad) en Keycloak (self-hosted open source). De hoofdstukken 01-09 blijven platform-agnostisch; platformvergelijkingen lopen door de tekst als tabellen.
