# Organisatieprofiel: Gemeente Meerwijde (fictief)

**ID:** `gemeente-meerwijde`
**Created:** 2026-04-23
**Version:** 1.0
**Context:** Casus 1 — Interne beheertool bij een overheidsinstantie (Azure + AD)

> Gemeente Meerwijde is een fictief profiel, bedoeld om casus 1 en bijbehorende persona's een concrete organisatorische achtergrond te geven. Waar cijfers genoemd worden zijn deze representatief voor een middelgrote Nederlandse gemeente, maar niet gekoppeld aan een bestaande gemeente.

---

## Overview

> Gemeente Meerwijde is een middelgrote Nederlandse gemeente met circa 110.000 inwoners en ongeveer 1.200 medewerkers, verspreid over een hoofdkantoor en enkele wijk- en buitenlocaties. De organisatie voert het volledige gemeentelijke takenpakket uit en heeft haar applicatielandschap grotendeels in Microsoft Azure staan, gekoppeld aan een on-prem Active Directory die fungeert als de identiteitsbron voor medewerkers.

---

## Identiteit

| Kenmerk | Waarde |
|---------|--------|
| **Type** | Nederlandse gemeente |
| **Inwoners** | ~110.000 |
| **Medewerkers** | ~1.200 fte, verdeeld over directies en programma's |
| **Locaties** | Stadhuis (hoofdkantoor), twee wijkservicepunten, gemeentewerf, ondersteunende diensten op externe locatie |
| **Bestuursmodel** | College van B&W, gemeenteraad, griffie; ambtelijke aansturing via gemeentesecretaris en directieteam |
| **Samenwerkingsverbanden** | Gemeenschappelijke regelingen voor belastingen, sociale dienst, omgevingsdienst en veiligheidsregio |

---

## Missie en kerntaken

Gemeente Meerwijde is verantwoordelijk voor het volledige gemeentelijke takenpakket. Voor de context van casus 1 zijn de volgende domeinen het meest relevant:

- **Sociaal domein** — Wmo, Jeugdwet, Participatiewet, schuldhulpverlening
- **Fysieke leefomgeving** — Omgevingswet, ruimtelijke ordening, vergunningen, handhaving
- **Burgerzaken** — BRP, reisdocumenten, burgerlijke stand
- **Belastingen en heffingen** — via samenwerkingsverband uitgevoerd, maar gemeente blijft verantwoordelijk
- **Openbare orde en veiligheid** — APV, toezicht, crisisbeheersing

Beleidsvorming op elk van deze domeinen vindt plaats binnen de gemeente zelf en leunt zwaar op dossier- en casuïstiekinformatie in interne applicaties.

---

## Organisatiestructuur (relevant voor casus 1)

| Onderdeel | Rol t.o.v. casus 1 |
|-----------|--------------------|
| **Directie Beleid & Strategie** | Huisvest beleidsmedewerkers zoals Sanne; primaire eindgebruikers van de beheertool |
| **Directie Dienstverlening** | Uitvoeringsmedewerkers die casuïstiek aanleveren waar beleid op voortbouwt |
| **Afdeling Informatievoorziening / IT** | Beheert Azure-landschap, Entra ID, applicatieportfolio |
| **CISO / Privacy Officer (FG)** | Stelt beleid op voor informatiebeveiliging en AVG; toetser bij wijzigingen |
| **Functioneel beheer per applicatie** | Ingericht per kernsysteem; eerste lijn voor rolwijzigingen en incidenten |

---

## IT- en identiteitslandschap

Meerwijde bevindt zich in de fase **"gevestigd hybride"**: het Azure-landschap staat, de meeste nieuwe applicaties zijn cloud-native, maar er zijn nog aanzienlijke koppelingen met on-prem systemen en legacy-applicaties.

### Kernelementen

- **Active Directory Domain Services** — on-prem, aangesloten op HR-systeem (AFAS of Visma); bron voor medewerkeridentiteiten, werkplekauthenticatie en bestandstoegang
- **Entra ID** — cloud-IdP, gevoed via Entra Connect Sync; IdP voor alle cloud-applicaties
- **Microsoft 365 E3** — Exchange Online, Teams, SharePoint, OneDrive, Intune
- **Conditional Access** — centraal beleid: MFA voor alle gebruikers, device compliance via Intune, legacy auth geblokkeerd
- **Azure Landing Zone** — met platformteam dat subscriptions, netwerk en baseline-policies beheert
- **Hybrid Azure AD Join** — werkplekken zijn zowel AD- als Entra-joined; biedt SSO en device-claims voor CA
- **Key Vault** — geheimen en certificaten per applicatie
- **Log Analytics + Microsoft Sentinel** — centrale logging, SIEM voor security monitoring

### Applicatielandschap (illustratief)

- **Kernregistraties**: BRP, BAG, WOZ, NHR — via landelijke voorzieningen en gespecialiseerde leveranciers
- **Zaaksysteem**: centrale spil voor zaakgericht werken
- **Sociaal domein-suites**: voor Wmo/Jeugd/Participatie-dossiers
- **Omgevingswet-applicaties**: gekoppeld aan het Digitaal Stelsel Omgevingswet (DSO)
- **Interne beheer- en beleidstools** (casus 1) — cloud-native in Azure, voor intern gebruik door beleid en management

---

## Compliance- en beleidskader

| Kader | Relevantie |
|-------|------------|
| **BIO — Baseline Informatiebeveiliging Overheid** | Verplichte baseline; jaarlijks ENSIA-verantwoording |
| **AVG / UAVG** | Dominant door hoeveelheid persoonsgegevens (BSN bij vrijwel elk dossier) |
| **Archiefwet** | Bewaartermijnen voor zaken en beleidsdocumenten |
| **Wet digitale overheid (Wdo)** | Eisen aan digitale dienstverlening richting inwoners |
| **Wet open overheid (Woo)** | Actieve openbaarmaking, gevolgen voor documentbeheer |
| **GGU — Gezamenlijke Gemeentelijke Uitvoering** | Koepelkader voor gezamenlijke voorzieningen via VNG Realisatie |
| **NIS2** | Relevant voor de als "essentieel" aangewezen onderdelen (waterveiligheid, crisiszorg) |

Verantwoording verloopt primair via **ENSIA** (jaarlijkse zelfevaluatie informatiebeveiliging) en interne audits door de concerncontroller.

---

## Risicoprofiel

- **Persoonsgegevens en BSN** — nagenoeg alle dossiers bevatten persoonsgegevens; impact van een datalek is groot voor inwoners én politiek
- **Ransomware-doelwit** — gemeenten zijn herhaaldelijk doelwit geweest; continuïteit van dienstverlening aan kwetsbare inwoners staat op het spel
- **Maatschappelijke zichtbaarheid** — incidenten halen lokale en landelijke pers; reputatieschade is direct
- **Ketenafhankelijkheden** — uitval van landelijke voorzieningen (DigiD, BRP, DSO) heeft directe doorwerking
- **Insider-risico** — grote medewerkersgroep met toegang tot gevoelige gegevens vraagt strikte rolscheiding en audittrail

---

## Stakeholders en ketenpartners

| Stakeholder | Relatie |
|-------------|---------|
| **Inwoners en ondernemers** | Eindafnemers van de dienstverlening |
| **Gemeenteraad en college** | Politieke sturing, kaderstelling, controle |
| **VNG / VNG Realisatie** | Koepel, gezamenlijke voorzieningen, kennisdeling |
| **Ministerie van BZK, SZW, JenV** | Beleidskaders, specifieke uitkeringen |
| **Logius** | DigiD, Digipoort, eHerkenning-aansluitingen |
| **Ketenpartners sociaal domein** | Zorg- en welzijnsaanbieders, onderwijs, politie |
| **Omgevingsdienst / GGD / Veiligheidsregio** | Gemeenschappelijke regelingen |
| **Softwareleveranciers** | Strategische afhankelijkheden voor kernapplicaties |
| **IBD — Informatiebeveiligingsdienst voor gemeenten** | Sectorale CERT, richtlijnen, incident-ondersteuning |

---

## Constraints en randvoorwaarden

- **Aanbestedingsrecht** — software- en dienstverlenersselectie verloopt via Europese aanbestedingen; doorlooptijd en leveranciersbinding zijn langdurig
- **Politieke cyclus** — vierjaarlijkse raadsperiode beïnvloedt prioriteiten en budget
- **Budget** — gemeentefinanciën staan onder druk; IT concurreert met sociaal domein
- **Arbeidsmarkt** — krapte op IT- en beveiligingsprofielen; deel van het werk via externe inhuur
- **Data-residency** — voorkeur voor EU-hosting (doorgaans West/North Europe); toename van eisen rond soevereiniteit
- **Leveranciersafhankelijkheid** — Microsoft-ecosysteem is dominant; bewustzijn van lock-in maar geen actieve migratie

---

## Digitale strategie en ambitie

- **Cloud-first voor nieuwe applicaties** — on-prem alleen waar functioneel of juridisch noodzakelijk
- **Gefaseerde ontmanteling van legacy** — via natuurlijke contractmomenten
- **Data-gedreven sturing** — centraal datawarehouse/lakehouse voor raad-rapportages en beleidsonderbouwing
- **Zaakgericht werken** — alle klantcontact via één zaaksysteem
- **Informatieveiligheid als doorlopend programma** — niet als project, maar als vast onderdeel van de bedrijfsvoering
- **Zero trust-richting** — identiteit als primaire controle, apparaat- en context-afhankelijke toegang

---

## Relevantie voor casus 1

Meerwijde is een typische Meerwijde-achtige organisatie: groot genoeg om volwassen Azure-governance en CA-beleid te rechtvaardigen, klein genoeg om een beheertool voor een specifieke beleidsgroep met verantwoorde inspanning te bouwen. De combinatie van BIO-plicht, veel persoonsgegevens en een hybride identiteitslandschap maakt dat de invulling uit casus 1 — OIDC naar Entra ID, gesyncte AD-groepen als bron voor identiteitsclaims, Conditional Access met device compliance — hier natuurlijk past.

Concreet voor de interne beheertool:

- Sanne en haar ~40 collega-beleidsmedewerkers horen tot de primaire gebruikersgroep
- De afdeling Informatievoorziening is zowel eigenaar van het Azure-platform als opdrachtgever voor de beheertool
- Functioneel beheer ligt bij één of twee FB'ers binnen de beleidsdirectie
- ENSIA-verantwoording vraagt expliciete bewijslast voor toegangsbeheer — logging uit Entra en de applicatie moet daarvoor aansluiten op C1 en D3
- Privacy Officer toetst nieuwe applicaties vooraf; betrokkenheid bij ontwerp van autorisatie en audittrail is standaard

---

## Notes

- Dit profiel is **fictief en illustratief**. Wanneer de casus op een concrete opdrachtgever wordt toegepast, moet het worden bijgewerkt met werkelijke cijfers, organisatiestructuur en bestaand beleid.
- Cijfers (inwoners, medewerkers) zijn gekozen voor plausibiliteit in de categorie "middelgrote gemeente, 500–2.000 medewerkers".
- Naar verwachting komen er meer persona's bij (bijv. functioneel beheerder, privacy officer, CISO) die allemaal in deze organisatiecontext opereren.
