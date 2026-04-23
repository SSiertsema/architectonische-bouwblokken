# Persona: Sanne de Beleidsmedewerker

**ID:** `sanne-beleidsmedewerker`
**Created:** 2026-04-23
**Version:** 1.0
**Context:** Casus 1 — Interne beheertool bij een overheidsinstantie (Azure + AD)

---

## Overview

> Sanne is een senior beleidsmedewerker bij een Nederlandse overheidsinstantie die dagelijks meerdere keren dossiers raadpleegt en verrijkt in een interne beheertool, en dat wil doen met zo min mogelijk frictie en met zorg voor de persoonsgegevens die ze verwerkt.

---

## Demographics

| Attribute | Value |
|-----------|-------|
| **Role/Title** | Beleidsmedewerker |
| **Department** | Beleid / vakinhoudelijk cluster binnen de overheidsinstantie |
| **Experience** | Senior (5–10 jaar in dezelfde of vergelijkbare rol) |
| **Werkplek** | Hybride — ongeveer half kantoor, half thuis, op een Intune-beheerde laptop |

---

## Goals & Motivations

### Primary Goals

1. Dossiers efficiënt raadplegen en verrijken met eigen duiding, zodat beleidsvraagstukken op een gedegen informatiebasis worden beantwoord
2. Collega's binnen het cluster kunnen helpen met haar domeinkennis door relevante dossiers en context snel te kunnen tonen

### Motivations

- **Inhoudelijke kwaliteit leveren** — gedegen, goed onderbouwde beleidsstukken vormen haar professionele trots
- **Zorgvuldig omgaan met persoonsgegevens** — ze is zich scherp bewust dat de dossiers echte mensen betreffen; rechtmatigheid en discretie zijn voor haar waarden, niet alleen regels
- **Erkend worden als domeinexpert** — een goede werkdag is een dag waarop collega's haar om raad vragen en ze hen verder kan helpen

---

## Pain Points & Frustrations

Authenticatie zelf vormt voor Sanne **geen frustratie**: inloggen werkt soepel dankzij SSO met haar werkplekaccount, MFA gaat vanzelf, en ze merkt de beveiliging nauwelijks in haar dagelijkse flow. De frustraties die ze wel ervaart liggen elders in haar werk.

| Pain Point | Impact | Current Workaround |
|------------|--------|--------------------|
| Context wisselen tussen meerdere dossiers kost tijd | Medium | Houdt zelf losse aantekeningen bij in een notitieblok |
| Relevante eerdere duiding terugvinden in een lang dossier | Medium | Gebruikt zoekopdrachten en scrollt, soms vraagt ze een collega |
| Onderbrekingen door ad-hoc vragen tijdens diep werk | Medium | Blokkeert focusblokken in de agenda |

---

## Behaviors & Characteristics

### Technical Proficiency

**Level:** Gemiddeld

Sanne leert nieuwe tools vlot aan en accepteert enige complexiteit, maar is geen power-user. Ze verwacht dat tools werken zonder dat ze de handleiding hoeft te lezen. Ze gebruikt filters, zoekopdrachten en exportfuncties comfortabel, maar verdiept zich niet in instellingen of technische opties die niet direct haar werk raken.

### Usage Patterns

| Pattern | Value |
|---------|-------|
| **Frequency** | Meerdere keren per dag |
| **Session Duration** | Vaak langere sessies (30–90 min) afgewisseld met korte raadplegingen |
| **Primary Device** | Intune-beheerde laptop, zowel op kantoor als thuis |
| **Peak Usage Time** | Ochtend (diep werk) en begin van de middag (afstemming met collega's) |

### Decision Making

- **Authority Level:** Werkt zelfstandig binnen het beleidskader; adviseert de leidinggevende
- **Risk Tolerance:** Risico-avers waar het persoonsgegevens en rechtmatigheid betreft
- **Information Needs:** Diepgaande context per dossier, met mogelijkheid tot snelle samenvatting

---

## Key Tasks & Workflows

### Primary Tasks

| Task | Frequency | Priority | Complexity |
|------|-----------|----------|------------|
| Dossier openen en historie doornemen | Meerdere keren per dag | Hoog | Moderate |
| Aantekening of duiding toevoegen aan dossier | Dagelijks | Hoog | Simple |
| Filteren/zoeken op dossiers met bepaalde kenmerken | Dagelijks | Hoog | Moderate |
| Export maken ten behoeve van een beleidsnotitie | Wekelijks | Medium | Moderate |

### Typical Workflow

1. Start werkdag op Intune-laptop (thuis of kantoor), opent de browser met de beheertool
2. SSO logt haar vrijwel onzichtbaar in via Entra ID; MFA alleen bij start of na lange onderbreking
3. Opent het dossier dat vandaag prioriteit heeft en leest de laatste aantekeningen
4. Wisselt een paar keer tussen verwante dossiers om context op te bouwen
5. Voegt eigen duiding toe, markeert relevante passages
6. Stemt 's middags kort af met een collega via Teams, deelt screenshot of dossierverwijzing
7. Sluit laptop af; de sessie eindigt conform het sign-in frequency-beleid van de organisatie

---

## Environment & Context

### Tools & Systems

- **Microsoft 365 (Outlook, Teams, Word, OneNote)** — communicatie, documenten, notities
- **Interne beheertool** — primaire werkapplicatie voor dossierbeheer
- **Intranet / kennisbank** — beleidskaders, richtlijnen, procedures
- **Juridische bronnen (wetten.overheid.nl, kennisdatabase)** — toetsen van rechtmatigheid en context

### Constraints

- **AVG en wettelijke bewaartermijnen** — haar werk valt onder strikte privacy-eisen
- **Hybride werkplek-beleid** — thuis werken is toegestaan, maar alleen op de beheerde laptop binnen het conditional access-beleid
- **Meerdere gelijktijdige vraagstukken** — ze werkt zelden aan één onderwerp tegelijk
- **Beperkte tijd voor technisch onderzoek** — tools moeten gewoon werken; uitzoeken waarom iets niet werkt is verloren tijd

### Stakeholders

| Stakeholder | Relationship | Interaction |
|-------------|--------------|-------------|
| Collega-beleidsmedewerkers | Collaborates with | Dagelijks — afstemmen, kennis delen |
| Leidinggevende / afdelingshoofd | Reports to | Wekelijks — prioriteiten, voortgang |
| Privacy-officer / jurist | Consults | Incidenteel — toetsing bij twijfel over rechtmatigheid |
| IT-servicedesk | Supports | Zelden — alleen bij storing of nieuw device |

---

## Quotes & Mindset

> "Ik wil mijn tijd besteden aan de inhoud van een dossier, niet aan het systeem waarin het staat."

> "Als ik inlog moet ik meteen door kunnen — onderbrekingen in mijn denkwerk zijn erger dan een extra klik."

> "Ik voel me geslaagd als een collega zegt: 'goed dat jij er was, ik zag dat stuk over het hoofd.'"

---

## Scenarios

### Success Scenario

Sanne start haar dag om 8:30 thuis. Ze klapt haar laptop open, logt in op Windows met Windows Hello, en opent de browser. De beheertool herkent haar direct via Entra-SSO en ze zit binnen enkele seconden in het dossier dat ze gisteren halverwege had gelaten. Ze leest de laatste aantekeningen, voegt een duiding toe over een vergelijkbare casus uit een ander dossier, en stuurt een collega een korte Teams-bericht met een verwijzing. Om 11:00 komt die collega langs met een dankwoord — precies de informatie die hij miste voor zijn notitie. De beveiliging heeft zichzelf op geen enkel moment in de voorgrond gedrongen; het systeem voelde als een werkomgeving, niet als een hindernisbaan.

### Frustration Scenario

Sanne werkt 's middags thuis aan een complexe analyse waarvoor ze tussen vier dossiers moet schakelen. Terwijl ze net de rode draad heeft gevonden, wordt ze onderbroken door een ad-hoc vraag van een collega en een piepende agendaherinnering. Als ze terugkeert naar de beheertool is haar context verdwenen — ze weet nog welke dossiers ze open had, maar niet meer waar ze precies was in elk ervan. Ze moet de denklijn opnieuw opbouwen. Niet de tool faalde, maar de combinatie van onderbrekingen en een omgeving die haar werkcontext niet vasthoudt kostte haar een half uur.

---

## User Story Mapping

Deze persona mapt op user stories met:

- **"Als beleidsmedewerker..."** — rol/titel
- **"Ik wil..."** — afgeleid van haar taken (dossier raadplegen, aantekening toevoegen, filteren, exporteren)
- **"Zodat..."** — afgeleid van haar motivaties (inhoudelijke kwaliteit, zorgvuldigheid met persoonsgegevens, collega's helpen)
- **Technisch niveau informeert** — interfaces die werken zonder handleiding, defaults die kloppen, geen onnodige opties

Voorbeeld:

> Als beleidsmedewerker
> wil ik bij het openen van de beheertool meteen verder kunnen waar ik was,
> zodat ik mijn focus op de inhoud kan houden en niet kwijtraak tussen inloggen en de dossierweergave.

---

## Notes

- Authenticatie is voor Sanne een *non-issue* in deze casus — dat is een bewuste ontwerp-uitkomst, niet een toevalligheid: SSO via Entra ID, Conditional Access met apparaat-compliance op haar Intune-laptop, en een sign-in frequency die past bij een werkdag zorgen ervoor dat ze nauwelijks merkt dat er geverifieerd wordt.
- Haar pain points liggen in context-behoud en informatie-terugvinden, niet in toegang. Bij het schrijven van user stories voor de beheertool is dat een relevante richting: UX rond dossierwissel en zoeken levert voor haar meer waarde dan nog vloeiendere authenticatie.
- Persoonsgegevens-zorgvuldigheid raakt wél aan authenticatie: Sanne verwacht dat elke handeling herleidbaar is naar haar eigen account en logt nooit in op andermans device. Audittrail is voor haar een hygiënevoorwaarde, geen feature.
