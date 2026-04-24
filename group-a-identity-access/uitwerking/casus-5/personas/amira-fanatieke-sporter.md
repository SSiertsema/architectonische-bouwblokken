# Persona: Amira de fanatieke sporter

**ID:** `amira-fanatieke-sporter`
**Created:** 2026-04-24
**Version:** 1.0
**Context:** Casus 5 — Consumentenproduct (CIAM) bij Pulso

---

## Overview

> Amira is een 34-jarige UX-designer die fanatiek sport — vier à vijf trainingen per week, een hardloopwedstrijd elk kwartaal. Ze gebruikt Pulso dagelijks op Apple Watch, iPhone en web, en verwacht dat haar identiteit zich net zo vloeiend door die devices beweegt als haar trainingsdata. Passkeys zijn voor haar geen experiment maar een standaardverwachting.

---

## Demographics

| Attribute | Value |
|-----------|-------|
| **Leeftijd** | 34 |
| **Rol/Beroep** | Senior UX-designer bij een SaaS-bedrijf |
| **Woonplaats** | Utrecht |
| **Tech-affiniteit** | Hoog — early adopter |
| **Gezin** | Woont samen met partner; geen kinderen |

---

## Goals & Motivations

### Primary Goals

1. **Een trainingsvoortgang opbouwen** die zichtbaar blijft over weken en maanden, zonder dat devicewissel haar data splitst
2. **Friktieloos starten** — als ze om 6:30 op haar Apple Watch op "start workout" tikt, wil ze geen loginscherm zien
3. **Precisiedata bewaren** — hartslagzones, laadvermogen, trainingslast; deze data is voor haar professioneel belangrijk (ze optimaliseert op cijfers)

### Motivations

- **Prestatiegroei** — concrete verbetering week op week is haar dopamine
- **Design-minded pragmatisme** — ze accepteert geen friction die voorkombaar is; een extra klik is een ontwerpfout
- **Privacybewust zonder paranoia** — ze begrijpt wat ze weggeeft en verwacht dat Pulso dat respecteert, maar leest niet elke toestemmingsregel

---

## Pain Points & Frustrations

Authenticatie hoort voor Amira idealiter onzichtbaar te zijn. Friction met login is pijn.

| Pain Point | Impact | Current Workaround |
|------------|--------|--------------------|
| Opnieuw moeten inloggen op de web-app als ze al is ingelogd op mobiel | Medium | Ze gebruikt de web-app maar zelden; liever alleen mobiel |
| Op Apple Watch opnieuw pairen na watchOS-update | Hoog | Ze schuift updates uit; niet ideaal |
| Social login die "toestemming vragen" pagina's elke paar maanden opnieuw toont | Laag | Klikt door, licht geïrriteerd |
| Twee apparaten vragen gelijktijdig om MFA-bevestiging en ze weet niet welke eerst | Medium | Annuleert beide en probeert opnieuw |

---

## Behaviors & Characteristics

### Technical Proficiency

**Level:** Hoog

Amira is geen developer, maar door haar vak heeft ze een goed mentaal model van flows, states en errors. Ze leest foutmeldingen, begrijpt concepten als "een app toegang geven" en kan door de tech-sectie van een privacyvoorwaarde heen. Passkeys adopteerde ze direct toen Apple ze introduceerde.

### Usage Patterns

| Pattern | Value |
|---------|-------|
| **Frequency** | Dagelijks, meestal twee sessies (ochtend training + avond reflectie) |
| **Session Duration** | 45-90 min trainingssessies + korte checks van 1-2 min |
| **Primary Device** | Apple Watch (tijdens training), iPhone (voorbereiding + analyse) |
| **Secondary Devices** | MacBook (week-analyse op zondag), Home Pod (morning routine) |
| **Peak Usage Time** | 06:30-07:30 ochtendtraining, 20:00-21:00 reflectie |

### Decision Making

- **Authority Level:** Maakt eigen keuzes over gezondheid/training; consulteert soms een coach
- **Risk Tolerance:** Bewust laag waar het privacy betreft, hoog waar het nieuwe features betreft
- **Information Needs:** Transparantie over data-gebruik; heldere controles over wat gedeeld wordt

---

## Key Tasks & Workflows

### Primary Tasks

| Task | Frequency | Priority | Complexity |
|------|-----------|----------|------------|
| Workout starten op Apple Watch | 4-5× per week | Hoog | Simple |
| Trainingsgeschiedenis bekijken op iPhone | Dagelijks | Hoog | Simple |
| Wekelijkse progressie analyseren op web | Wekelijks | Medium | Moderate |
| Strava-synchronisatie inregelen | Eenmalig per app-install | Medium | Moderate |
| Een workout delen met haar partner (family-plan) | Incidenteel | Laag | Simple |

### Typical Workflow

1. 06:25 — alarm gaat af op iPhone, ze doet Apple Watch om
2. 06:30 — opent Pulso op de watch, kiest "start workout" (geen loginscherm; de watch-app is gepaird via haar iPhone-app)
3. 07:15 — einde workout; watch synct data naar iPhone
4. 07:25 — check op iPhone: trainingslast, hartslagherstel; passkey-authenticatie via Face ID is onzichtbaar
5. 20:00 — korte reflectie op iPhone: notitie toevoegen bij de ochtendtraining
6. Zondag — opent app.pulso.com op MacBook; logt in met passkey via Touch ID; bekijkt week-analyse

---

## Environment & Context

### Tools & Systems

- **Apple Watch** — primaire trainingsdevice
- **iPhone** — controlecentrum voor Pulso + social apps
- **MacBook** — week-analyse, professioneel werk
- **Strava** — social cycling/running (syncht met Pulso)
- **Apple Health** — centrale aggregator van gezondheidsdata
- **Home Pod** — ochtendroutine (soms "Hey Siri, start een Pulso-ademhalingsoefening")

### Constraints

- **Early mornings** — voor 7 uur moet alles werken zonder hersenactiviteit
- **Privacy-bewuste doelgroep** — ze praat met collega's over apps; één reputatieprobleem met Pulso en ze migreert
- **Premium-abonnement** — verwacht premium-ervaring, geen bugs in flows die al jaren bestaan
- **Eén-device-kwijt-scenario** — als haar iPhone in de trein blijft liggen, wil ze haar Apple Watch uit Pulso kunnen uitloggen voordat ze weer een iPhone activeert

### Stakeholders

| Stakeholder | Relationship | Interaction |
|-------------|--------------|-------------|
| Partner | Family-plan co-member | Gedeeld plan, aparte data |
| Strava-community | Sociale delers | Wekelijkse ritten |
| Hardloopcoach | Externe professional | Periodiek data delen (export) |
| Pulso support | Zelden contact | Alleen bij defecten |

---

## Quotes & Mindset

> "Als ik om 6:30 op 'start' druk, wil ik trainen — niet authenticeren."

> "Ik betaal premium. Een 'opnieuw inloggen'-scherm op mijn horloge voelt alsof ik al minder krijg dan ik betaal."

> "Passkeys zijn gewoon beter. Ik snap niet dat ze niet overal de standaard zijn."

---

## Scenarios

### Success Scenario

Amira krijgt een nieuwe iPhone. Ze zet hem op via Quick Start met haar oude toestel. Pulso verschijnt tussen de migrerende apps; bij eerste opening vraagt de app of ze met Face ID wil doorgaan — achter de schermen is haar passkey overgezet via iCloud Keychain. Geen e-mailadres intikken, geen wachtwoord bedenken, geen "verifieer dit nieuwe device"-mail. Haar Apple Watch blijft gewoon werken; de trust chain loopt via haar Apple ID. Binnen dertig seconden start ze haar workout alsof er niets veranderd is.

### Frustration Scenario

Na een watchOS-update werkt haar Pulso-watch-app niet meer. De app vraagt op de iPhone of ze opnieuw wil pairen. Ze tikt "ja", maar op de watch verschijnt "Ga naar je iPhone om door te gaan". Op de iPhone staat niets. Na een herstart van beide devices lukt het; de workout van die ochtend mist ze niet, maar ze heeft 15 minuten verloren en twijfelt openlijk of ze deze winter wel door wil met Pulso. Ze laat dit niet weten aan support — ze stopt in stilte.

---

## User Story Mapping

Deze persona mapt op user stories met:

- **"Als fanatieke sporter..."** — rol
- **"Ik wil..."** — afgeleid van haar taken (workout starten, progressie zien, data synchroniseren, device vervangen)
- **"Zodat..."** — afgeleid van haar motivaties (geen friction, continuïteit over devices, dataprecisie)

Voorbeeld:

> Als fanatieke sporter
> wil ik op mijn nieuwe iPhone direct verder kunnen met Pulso via mijn bestaande passkey,
> zodat ik geen trainingsdag verlies aan heraanmelden of herkoppelen van mijn Apple Watch.

---

## Notes

- Amira is de "golden path"-persona voor de sequencediagrammen in `tech/`. Haar flow (passkey + Apple-stack + wearable-companion) is representatief voor ~30% van de Pulso-gebruikersbasis.
- Haar pijn ligt niet in authenticatie-vóór-ze-traint (dat werkt goed), maar in **migratie-scenario's**: nieuw device, OS-update, watch-reset. Die horen hoog te staan in de lifecycle-ontwerpkeuzes (zie `08-accountlifecycle-en-herstel.md`).
- Haar tolerantie voor privacy-incidenten is laag; ze leest geen privacyvoorwaarden maar reageert hard op incidenten in de pers.
