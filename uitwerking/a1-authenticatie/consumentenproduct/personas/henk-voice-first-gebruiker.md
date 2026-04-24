# Persona: Henk de voice-first-gebruiker

**ID:** `henk-voice-first-gebruiker`
**Created:** 2026-04-24
**Version:** 1.0
**Context:** Casus 5 — Consumentenproduct (CIAM) bij Pulso

---

## Overview

> Henk is een 68-jarige gepensioneerde installatietechnicus die Pulso vooral voor ademhalings- en mobiliteitsoefeningen gebruikt. Hij gebruikt de app liever niet op zijn telefoon — "veel te klein" — maar gaf zijn dochter opdracht "die luidspreker van Google die stemmen kan horen" te installeren. Nu zegt hij dagelijks "Hey Google, laten we met Pulso beginnen" en doet vervolgens tien minuten ademhaling in zijn stoel.

---

## Demographics

| Attribute | Value |
|-----------|-------|
| **Leeftijd** | 68 |
| **Rol/Beroep** | Gepensioneerd |
| **Woonplaats** | Zwolle |
| **Tech-affiniteit** | Laag — gebruikt wat hem uitgelegd is |
| **Gezin** | Getrouwd; één volwassen dochter die op afstand IT-support doet |

---

## Goals & Motivations

### Primary Goals

1. **Dagelijkse ademhalings- en mobiliteitsoefeningen** — aanbevolen door zijn huisarts
2. **Contact houden met lichaamsbewustzijn** — een van zijn nieuwe hobby's na pensioen
3. **Zonder gedoe** — hij wil geen zelf-beheer van accounts of wachtwoorden

### Motivations

- **Gezondheid als eigen verantwoordelijkheid** — hij doet het voor zichzelf, niet voor de dokter
- **Nieuw ritueel in de dag** — Pulso is onderdeel van zijn ochtendstructuur
- **Zelfstandigheid** — hij wil het zelf doen, niet steeds zijn dochter bellen

---

## Pain Points & Frustrations

Voor Henk is bijna elke vorm van tekst-based authenticatie een barrière. Hij werd Pulso-gebruiker **via zijn dochter** die de signup deed; hij is zich niet bewust van accounts, tokens of sessies. Hij merkt alleen *afwezigheid* van de dienst: "Google begrijpt me niet meer".

| Pain Point | Impact | Current Workaround |
|------------|--------|--------------------|
| "Hey Google, start Pulso" werkt niet meer na een update | Hoog | Belt dochter |
| Moet op telefoon iets "bevestigen" dat hij niet snapt | Hoog | Wacht tot dochter langskomt |
| Typen op de telefoon is moeilijk (motorisch en visueel) | Hoog | Vermijdt telefoon; gebruikt enkel stem |
| Nieuwe privacyvoorwaarden-popup in de Home-app | Medium | Dochter doet het |

---

## Behaviors & Characteristics

### Technical Proficiency

**Level:** Laag

Henk heeft een werkmail (tien jaar geleden aangemaakt door zijn dochter) en een Gmail. Hij weet niet welke waar wordt gebruikt. Zijn telefoon is een Android, "omdat de dochter zegt dat die samenwerkt met die luidspreker". Hij kan bellen, WhatsApp lezen (niet typen), en Google Home bedienen met stem.

### Usage Patterns

| Pattern | Value |
|---------|-------|
| **Frequency** | Dagelijks |
| **Session Duration** | 10-15 minuten |
| **Primary Device** | Google Home (luidspreker zonder scherm) in zijn leesstoel |
| **Secondary Devices** | Android-telefoon (nauwelijks gebruikt); TV met Chromecast (incidenteel) |
| **Peak Usage Time** | 09:00 na ontbijt; 21:00 voor slapengaan |

### Decision Making

- **Authority Level:** Beslist over zijn eigen gebruik; dochter doet technisch beheer
- **Risk Tolerance:** Niet bewust van risico's — vertrouwt op zijn dochter
- **Information Needs:** Minimaal — hij wil weten welk commando werkt

---

## Key Tasks & Workflows

### Primary Tasks

| Task | Frequency | Priority | Complexity |
|------|-----------|----------|------------|
| Via stem een sessie starten | Dagelijks | Hoog | Simple (voor hem) |
| Een nieuwe oefening ontdekken | Wekelijks | Medium | Hoog (via stem onduidelijk) |
| Pauzeren en hervatten | Dagelijks | Hoog | Simple |
| Account-toegang herstellen na storing | 2-3× per jaar | Hoog | Extreem hoog |

### Typical Workflow

1. 09:00 — Henk gaat in zijn stoel zitten met koffie
2. Zegt "Hey Google, laten we met Pulso beginnen"
3. Google Assistant antwoordt: "Pulso wenst je een goedemorgen, Henk. Vandaag begint met vijf minuten ademhaling. Ben je er klaar voor?"
4. "Ja"
5. Tien minuten ademhalings- en mobiliteitsoefeningen
6. Google Assistant: "Mooi gedaan. Wil je een notitie?"
7. "Nee"
8. Klaar — tot morgen

### Crisis Workflow (defect)

1. 09:00 — "Hey Google, laten we met Pulso beginnen"
2. "Sorry, ik kan Pulso nu niet bereiken. Probeer het opnieuw."
3. Henk herhaalt; twee keer
4. Hij geeft op, drinkt zijn koffie gefrustreerd
5. 's Middags belt hij zijn dochter
6. Dochter: "Pap, je moet opnieuw inloggen in de Home-app". Henk: "dat kan ik niet"
7. Dochter regelt het in het weekend

---

## Environment & Context

### Tools & Systems

- **Google Home** (oudere versie, geen scherm) in leesstoel
- **Google Home Hub** in de keuken (met klein scherm)
- **Android-telefoon** (Samsung, 3 jaar oud)
- **Smart-TV** met Chromecast (voor tv-kijken, niet Pulso)
- **Google-account** (aangemaakt door dochter)

### Constraints

- **Voice-only primair** — alles wat via stem moet kunnen, moet via stem kunnen
- **Accountlinking verlies = dienstverlies** — als de link tussen Google en Pulso breekt, valt Pulso voor hem weg
- **Toegankelijkheidseisen** — grote letters, hoog contrast, audio-instructies; hij leest geen schermen
- **Privacy-vertrouwen op basis van wie hem de tool gaf** — zijn dochter vertrouwt hij; de dienst krijgt die vertrouwens-overdracht mee
- **Niet zelfredzaam op auth-flows** — als er getypt moet worden, stopt het voor hem

### Stakeholders

| Stakeholder | Relationship | Interaction |
|-------------|--------------|-------------|
| Dochter (40) | Tech-support + proxy-beheerder | Maandelijks; bij storing direct |
| Echtgenote | Medegebruiker? Nee — aparte account? | Geen — alleen Henk gebruikt Pulso |
| Huisarts | Adviseur | Jaarlijks checkup |
| Google Assistant | "Digitale helper" | Dagelijks |

---

## Quotes & Mindset

> "Als Google het snapt, snap ik het ook."

> "Waarom moet ik bevestigen dat ik het ben? Wie anders zou hier zijn?"

> "Mijn dochter regelt dat. Ik begin gewoon als alles werkt."

---

## Scenarios

### Success Scenario

Na zes weken blindelings gebruik gaat Pulso een update uitbrengen die een nieuwe ademhalingsoefening toevoegt. Google Assistant begroet Henk 's ochtends met: "Goedemorgen. Vandaag is er iets nieuws — een tien-minuten-wakker-worden-oefening. Zal ik die laten zien, of doen we onze vaste vijf-minuten-ademhaling?" Henk kiest het bekende; maar hij is nu op de hoogte van de nieuwe optie, zonder dat iemand hem iets hoefde te leren.

### Frustration Scenario

Google Assistant zegt 's ochtends: "Voor Pulso moet je opnieuw inloggen. Open de Home-app op je telefoon." Henk weet niet wat de Home-app is. Hij pakt zijn telefoon, vindt een app met een huisje, opent die, en ziet een knop "Voeg service toe". Hij drukt erop; ziet een lijst van honderden services; tikt op iets random; komt in een inlog-scherm van een andere dienst. Hij sluit de telefoon; drinkt koffie; belt zijn dochter. Van daadwerkelijke ademhaling komt niks die ochtend.

---

## User Story Mapping

> Als voice-first-gebruiker
> wil ik dat Pulso via Google Home blijft werken zonder dat ik mijn telefoon nodig heb voor bevestigingen,
> zodat ik niet elke maand afhankelijk ben van iemand anders.

> Als voice-first-gebruiker
> wil ik dat Pulso mij herkent aan mijn stem zodat verschillende huisgenoten niet ongewenst mijn voortgang kunnen opvragen,
> zodat "Hey Google, hoe is mijn Pulso-voortgang?" privé blijft.

---

## Notes

- Henk is de **toegankelijkheids- en account-linking-persona**. Zijn frustraties wijzen recht op twee ontwerpkeuzes: (1) het Account Linking-token moet zo lang mogelijk geldig blijven, met proactieve re-link-mails naar de beheerder die het deed (zijn dochter) voordat de link breekt, (2) stemherkenning via Google Voice Match moet ingezet worden om onderscheid te maken tussen huisgenoten.
- Zijn profiel ondersteunt de keuze voor **duidelijke fallback-ervaringen** op voice-devices (Google Home kan niet tonen dat een token is verlopen — dat is een zachte fout die goed moet gecommuniceerd worden in een mail naar het e-mailadres dat oorspronkelijk de link heeft gedaan).
- Consent-registratie en privacyvoorwaarden moeten ook in zijn kanaal (voice) passen; dat is non-triviaal en wordt in `06-consent-profielclaims.md` behandeld.
