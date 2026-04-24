# Persona: Nadia de privacybewuste professional

**ID:** `nadia-privacy-professional`
**Created:** 2026-04-24
**Version:** 1.0
**Context:** Casus 5 — Consumentenproduct (CIAM) bij Pulso

---

## Overview

> Nadia is een 38-jarige jurist gespecialiseerd in privacyrecht. Ze gebruikt Pulso met een mix van enthousiasme (de smart glasses-pilot interesseert haar vakmatig én persoonlijk) en professioneel scepticisme (ze leest elke toestemmingsregel en vergelijkt wat er wél en niet gedeeld wordt). Ze is de gebruiker die het moeilijkst te winnen is maar, eenmaal gewonnen, het meest loyaal wordt. Haar LLM-integratie vertrouwt ze voorzichtig.

---

## Demographics

| Attribute | Value |
|-----------|-------|
| **Leeftijd** | 38 |
| **Rol/Beroep** | Senior advocaat — privacy & data protection |
| **Woonplaats** | Den Haag |
| **Tech-affiniteit** | Hoog (functioneel) |
| **Gezin** | Alleenstaand |

---

## Goals & Motivations

### Primary Goals

1. **Een fitness-routine die in haar werkritme past** — reizend naar klanten, workshops geven, onregelmatige dagen
2. **Gezondheidsdata behouden zonder privacy-risico** — ze is zich heel bewust welke data bij welke verwerker ligt
3. **Nieuwe technologie hands-on begrijpen** — smart glasses en LLM-coaches zijn professioneel én persoonlijk interessant

### Motivations

- **Controle over eigen data** — AVG is voor haar geen theorie maar dagelijkse praktijk
- **Leergierig over nieuwe authmodellen** — ze wil weten hoe passkeys onder de motorkap werken
- **Verantwoordelijk voorbeeldgedrag** — ze vindt het belangrijk om zelf toe te passen wat ze klanten adviseert

---

## Pain Points & Frustrations

Nadia's frustraties zitten in privacy-details die andere gebruikers missen.

| Pain Point | Impact | Current Workaround |
|------------|--------|--------------------|
| Consent-popup die alles in één bulk vraagt ("accepteer alles") | Hoog | Klikt alles uit en wacht op de functionele gevolgen |
| Onduidelijke scope-uitleg bij LLM-integratie ("Pulso wil toegang tot je gezondheidsdata") | Hoog | Weigert tot ze precies weet wat er gedeeld wordt |
| Datadownload die geen machine-leesbaar formaat biedt | Medium | Dient AVG-verzoek in; duurt lang |
| Smart glasses die "ambient" data verzamelen zonder expliciete trigger | Hoog | Gebruikt ze alleen in sessies; nooit all-day |
| Verlopen passkey op een apparaat waar ze niet meer bij kan | Medium | Kent de herstelflow, maar vindt hem te kort op detailweergave |

---

## Behaviors & Characteristics

### Technical Proficiency

**Level:** Hoog (functioneel)

Nadia leest privacyvoorwaarden, DPIA's en verwerkersovereenkomsten voor haar werk. Ze heeft geen developer-background maar begrijpt concepten als "welke claims zitten in een token", "wat is dynamic client registration", "wat is een MCP-server en waar loopt het dataverkeer". Passkeys gebruikt ze, en ze kan uitleggen waarom ze veiliger zijn dan TOTP.

### Usage Patterns

| Pattern | Value |
|---------|-------|
| **Frequency** | 3-4× per week |
| **Session Duration** | 30-60 minuten (workout) + 5-10 minuten (analyse) |
| **Primary Device** | iPhone + Apple Watch + Meta Ray-Ban smart glasses (pilot) |
| **Secondary Devices** | MacBook (werk), iPad (reflectie) |
| **LLM-gebruik** | ChatGPT Plus + Claude; vraagt soms Pulso-coaching via de LLM-integraties |
| **Peak Usage Time** | Vroege avond + weekends |

### Decision Making

- **Authority Level:** Volledig zelfstandig in eigen keuzes; adviseert anderen vanuit haar expertise
- **Risk Tolerance:** Laag voor privacy; gemiddeld voor nieuwe features
- **Information Needs:** Volledige transparantie; liever één klik meer dan één onduidelijkheid

---

## Key Tasks & Workflows

### Primary Tasks

| Task | Frequency | Priority | Complexity |
|------|-----------|----------|------------|
| Workout volgen via smart glasses (pilot) | 2× per week | Medium | Hoog (nieuw) |
| Pulso bevragen via Claude over weekstructuur | Wekelijks | Medium | Hoog (LLM-scope) |
| Consent-instellingen bijstellen na update | 1-2× per maand | Hoog | Medium |
| Datadownload maken voor persoonlijk archief | Kwartaal | Medium | Medium |
| Sessies op alle devices uitloggen vóór buitenlandreis | 2-3× per jaar | Hoog | Medium |

### Typical Workflow

1. 18:30 — komt thuis van een klant; zet Meta Ray-Ban op
2. Zegt tegen de bril: "start workout" — de bril toont een QR-code-handoff naar haar iPhone voor step-up-auth
3. Op iPhone: Face ID; de workout start, begeleiding verschijnt in haar gezichtsveld
4. Tijdens workout: audio-begeleiding via de bril; hartslagdata via Apple Watch
5. Na afloop: iPad — vraagt "Claude, samengevat hoe liep mijn week bij Pulso?" — Claude gebruikt de MCP-integratie, maar mag alleen workouts en trainingslast zien (niet slaap, niet gewicht — die scope heeft ze uitgezet)
6. Claude antwoordt; Nadia noteert in haar eigen journal

---

## Environment & Context

### Tools & Systems

- **iPhone + Apple Watch** — dagelijks
- **Meta Ray-Ban smart glasses (pilot)** — bij sport
- **MacBook** — werk
- **Claude Desktop met MCP-integraties** — privé-dagelijks
- **ChatGPT Plus** — werk + experiment
- **1Password** — password manager, inclusief passkeys
- **Proton Mail** — primaire e-mail

### Constraints

- **Geen work-life-vermenging in data** — haar juridische werk raakt geen gezondheidsdata; Pulso mag nooit per ongeluk werkdata bereiken (en andersom)
- **EU-hosting vereist** — als Pulso-data naar US verhuisde, stopt ze
- **AVG-recht op verwijdering moet real zijn** — een "soft-delete" die data 2 jaar bewaart is onacceptabel
- **Minimale LLM-scope** — LLM's krijgen alleen wat ze vraagt, nooit default-toegang tot alles
- **Audit-trails moet ze kunnen opvragen** — wie heeft wanneer wat gezien van haar data

### Stakeholders

| Stakeholder | Relationship | Interaction |
|-------------|--------------|-------------|
| Klanten | Professioneel | Adviseert ze over vergelijkbare consent-ontwerpen |
| Autoriteit Persoonsgegevens | Professioneel raakvlak | Volgt beleid |
| Pulso (als verwerker) | Vanuit gebruikersrol | Dient jaarlijks AVG-verzoek in (verificatietest) |
| LLM-providers | Afzonderlijke verwerkers | Overweegt scope zorgvuldig |

---

## Quotes & Mindset

> "Ik betaal voor een dienst — dat ik ook producten ben is niet onvermijdelijk."

> "Als ik niet precies weet welke data naar Claude gaat, krijgt Claude geen data."

> "Een 'accepteer alles'-knop zonder alternatief is een designkeuze, geen consent."

---

## Scenarios

### Success Scenario

Pulso rolt een nieuwe functie uit: workout-samenvattingen kunnen door Claude of ChatGPT worden opgevraagd via een LLM-integratie. Nadia opent haar consent-instellingen en ziet per LLM-provider een aparte fijn-granulaire scope-keuze: "Workouts & trainingslast (samengevat)" / "Hartslag (ruw)" / "Slaap (samengevat)" / "Gewicht". Naast elke scope staat welke data feitelijk wordt doorgegeven, in welk formaat, en een laatste-gebruikt-datum. Ze zet voor Claude alleen de eerste scope aan; voor ChatGPT niets. Audit-log toont haar per week welke queries Claude deed; ze is blij verrast.

### Frustration Scenario

Na een update ziet Nadia dat haar smart glasses een nieuwe permission heeft aangevinkt: "deel omgevingsdata voor ambient coaching". Ze had dit niet bewust aangezet. Ze zoekt in de consent-instellingen en ziet het tussen tientallen andere aan/uit-knoppen, zonder uitleg. Ze zet het uit, mailt support, vraagt een DPIA. Wacht 6 weken. Overweegt publicatie in haar column.

---

## User Story Mapping

> Als privacybewuste professional
> wil ik per LLM-integratie en per data-categorie afzonderlijk consent kunnen geven,
> zodat ik niet gedwongen word tot bulk-acceptatie van data-toegang die ik niet nodig acht.

> Als privacybewuste professional
> wil ik een leesbaar audit-logboek kunnen inzien van wie wanneer welke data van mij heeft bekeken,
> zodat ik mijn recht op informatie effectief kan uitoefenen zonder een formeel verzoek.

---

## Notes

- Nadia is de **consent- en LLM/smart-glasses-persona**. Haar frustraties raken aan `06-consent-profielclaims.md`, `04-device-en-kanaalintegratie.md` en `09-compliance-en-auditlogging.md`.
- Haar profiel zet druk op: (a) **consent-granulariteit**, (b) **scope-design per kanaal**, (c) **real-time audit-inzage** voor gebruikers, (d) **harde grenzen tussen data-categorieën**.
- Ze is een **first-feedback-gebruiker**: als een nieuwe feature haar over de streep trekt, is dat een sterk signaal. Als zij afhaakt, is dat een waarschuwing voor de bredere privacy-bewuste segmenten.
- Haar bestaan in de persona-set rechtvaardigt dat casus 5 nieuwe kanalen (LLM-integraties, smart glasses) met vol vakinhoudelijk gewicht behandelt in plaats van als bijzin.
