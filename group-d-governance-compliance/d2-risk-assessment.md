# D2 — Risk Assessment

## 1. Wat is dit bouwblok?

Dit bouwblok zorgt voor een systematische aanpak van beveiligingsrisico's: welke dreigingen bestaan er, hoe waarschijnlijk zijn ze, wat is de mogelijke schade, en welke maatregelen zijn nodig om het risico tot een acceptabel niveau terug te brengen. Het voorkomt dat beveiliging op gevoel of ad hoc wordt ingevuld.

## 2. Waarom is dit nodig?

Zonder risicoanalyse wordt beveiliging een kwestie van aannames en willekeur. Sommige risico's worden overdreven beveiligd terwijl andere over het hoofd worden gezien. Budget en aandacht gaan naar maatregelen die weinig toevoegen, terwijl de grootste risico's open blijven. Een systematische risicobeoordeling zorgt ervoor dat beveiligingsmaatregelen in verhouding staan tot de werkelijke dreigingen en dat bewust wordt gekozen welke restrisico's worden geaccepteerd.

## 3. Wie heeft hiermee te maken?

- **Opdrachtgever** — is risico-eigenaar en beslist welke restrisico's worden geaccepteerd
- **Product owner** — vertaalt risico's naar prioriteiten in de backlog en zorgt dat maatregelen worden gepland
- **Architect** — identificeert dreigingen op basis van de systeemarchitectuur en ontwerpt mitigerende maatregelen
- **Ontwikkelteam** — implementeert de beveiligingsmaatregelen die uit de risicoanalyse voortkomen
- **Security officer** — begeleidt het risicoanalyseproces, bewaakt de kwaliteit van de analyse en volgt restrisico's
- **Beheerder / Operations** — signaleert operationele risico's en voert operationele maatregelen uit

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit op **procesniveau**. Het is geen technisch component maar een gestructureerd proces dat leidt tot beslissingen over welke technische en organisatorische maatregelen nodig zijn. De uitkomsten bepalen wat de andere bouwblokken moeten inrichten: welke authenticatie-eisen gelden, hoe streng de inputvalidatie moet zijn, welke monitoringregels nodig zijn.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — een initiele risicoanalyse bepaalt de beveiligingsscope en de benodigde maatregelen
- **Bij ontwerp** — threat modeling op de voorgestelde architectuur identificeert ontwerprisico's voordat ze worden ingebouwd
- **Bij wijzigingen** — significante functionele of technische wijzigingen vragen om herbeoordeling van de risico's
- **Na incidenten** — beveiligingsincidenten leiden tot herbeoordeling: was het risico bekend? Waren de maatregelen toereikend?
- **Periodiek** — minimaal jaarlijks worden risico's herbeoordeeld, ongeacht of er wijzigingen zijn geweest

## 6. Hoe werkt dit?

Het team inventariseert welke dreigingen het systeem kan treffen: wat kan er misgaan, hoe waarschijnlijk is dat, en wat is de impact? Per dreiging wordt beoordeeld of er al maatregelen zijn en of die voldoende zijn. Waar het risico te hoog is, worden aanvullende maatregelen bepaald. Na het treffen van maatregelen wordt het restrisico vastgesteld — het risico dat overblijft. De opdrachtgever beslist of dat restrisico acceptabel is. Alle bevindingen worden vastgelegd in een risicoregister dat gedurende het project wordt bijgehouden.

## 7. Voor de techneut

### Threat modeling
Bij het ontwerp van de applicatie wordt systematisch geanalyseerd welke dreigingen bestaan. Veelgebruikte methoden:
- **STRIDE** — classificatie van dreigingen naar type: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
- **Aanvalsoppervlak-analyse** — inventarisatie van alle ingangspunten (API's, interfaces, datastromen) en beoordeling van de blootstelling
- **Misuse cases** — scenario's die beschrijven hoe een kwaadwillende het systeem kan misbruiken

### Risicoregister
Een centraal register waarin per risico wordt vastgelegd:
- **Dreiging** — wat kan er misgaan
- **Waarschijnlijkheid** — hoe groot is de kans (schaal of kwalitatieve inschatting)
- **Impact** — wat is de schade bij optreden (financieel, reputatie, operationeel, juridisch)
- **Huidige maatregelen** — welke beveiligingsmaatregelen zijn al getroffen
- **Risicoscore** — waarschijnlijkheid x impact, voor en na maatregelen
- **Risico-eigenaar** — wie is verantwoordelijk voor het managen van dit risico
- **Status** — open, gemitigeerd, geaccepteerd, overgedragen

### Risk-to-control mapping
Elk risico wordt gekoppeld aan een of meer maatregelen (controls). Per maatregel wordt vastgelegd welk risico het adresseert en hoe effectief het is. Dit maakt zichtbaar of er risico's zijn waarvoor geen maatregel bestaat, en of maatregelen bestaan die geen risico afdekken.

### Residual risk tracking
Na het treffen van maatregelen resteert een restrisico. Dit wordt expliciet vastgesteld en voorgelegd aan de risico-eigenaar voor acceptatie. Geaccepteerde restrisico's worden periodiek herbeoordeeld, omdat dreigingen en omstandigheden veranderen.

### Integratie met ontwikkelproces
- Bij elke significante wijziging (nieuwe functionaliteit, architectuurwijziging, nieuwe integratie) wordt een delta-risicoanalyse uitgevoerd
- Beveiligingsrisico's worden als items in de backlog opgenomen met een prioriteit die volgt uit de risicoscore
- Threat modeling wordt bij voorkeur uitgevoerd op ontwerpniveau, voordat code wordt geschreven

## 8. Gedekte clausules

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| 6.1.1 | Algemeen — acties om risico's en kansen te behandelen |
| 6.1.2 | Risicobeoordeling van informatiebeveiliging |
| 6.1.3 | Risicobehandeling van informatiebeveiliging |
| 8.2 | Risicobeoordeling van informatiebeveiliging uitvoeren |
| 8.3 | Risicobehandeling van informatiebeveiliging uitvoeren |

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| B/WA.02 | Risicomanagement voor webapplicaties — structurele aanpak van risico's |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie risico-eigenaar is, wie de risicoanalyse uitvoert en wie restrisico's accepteert. |
| **D3 — Compliance Evidence & Reporting** | Het risicoregister en de behandelplannen zijn bewijsstukken bij audits. De voortgang van risicobehandeling wordt gerapporteerd. |
| **B2 — Dependency & Vulnerability Management** | Kwetsbaarheden in afhankelijkheden zijn een directe input voor de risicoanalyse. Nieuwe kwetsbaarheden kunnen leiden tot herbeoordeling van risico's. |
| **C2 — Monitoring & Alerting** | Incidenten die via monitoring worden gedetecteerd, voeden de risicoanalyse: een opgetreden incident kan wijzen op een onderschat risico. |
| **D1 — Standaarden Compliance Registry** | Afwijking van verplichte standaarden introduceert risico's die in de risicoanalyse moeten worden meegenomen. |
| **Alle bouwblokken** | De risicoanalyse bepaalt welke maatregelen nodig zijn en daarmee wat de andere bouwblokken moeten inrichten. Een hoog risico op datalekkage leidt tot strengere eisen aan authenticatie (A1), autorisatie (A2) en encryptie (B1). |
