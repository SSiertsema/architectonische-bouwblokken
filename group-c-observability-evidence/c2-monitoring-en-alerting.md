# C2 — Monitoring & Alerting

## 1. Wat is dit bouwblok?

Dit bouwblok zorgt ervoor dat de applicatie continu wordt bewaakt en dat de juiste mensen op tijd worden gewaarschuwd wanneer er iets misgaat. Het detecteert beveiligingsincidenten, storingen en prestatieproblemen voordat ze uitgroeien tot grote verstoringen. Monitoring kijkt mee; alerting trekt aan de bel.

## 2. Waarom is dit nodig?

Zonder monitoring worden problemen pas ontdekt wanneer gebruikers klagen of systemen uitvallen. Een beveiligingsincident kan dan al uren of dagen onopgemerkt zijn. Zonder alerting kan het team niet tijdig ingrijpen, waardoor kleine verstoringen escaleren tot grote incidenten. Monitoring maakt het verschil tussen proactief handelen en achter de feiten aanlopen.

## 3. Wie heeft hiermee te maken?

- **Opdrachtgever** — draagt de verantwoordelijkheid dat het systeem beschikbaar en veilig is, en verwacht tijdige signalering bij problemen
- **Product owner** — prioriteert welke service levels bewaakt moeten worden en welke situaties een melding rechtvaardigen
- **Ontwikkelteam** — bouwt healthchecks en meetpunten in de applicatie, definieert drempelwaarden
- **Beheerder / Operations** — beheert de monitoringinfrastructuur, reageert op alerts en voert escalaties uit
- **Security officer** — gebruikt monitoringgegevens voor het detecteren en onderzoeken van beveiligingsincidenten
- **Manager** — ontvangt rapportages over beschikbaarheid, prestaties en incidenten

## 4. Waar zit dit in de applicatie?

Monitoring zit op **infrastructuur- en applicatieniveau**. Op infrastructuurniveau worden servercapaciteit, netwerkverkeer en systeemgezondheid bewaakt. Op applicatieniveau worden responstijden, foutpercentages en functionele healthchecks gemeten. De monitoringvoorziening zelf staat doorgaans buiten de applicatie, in een apart platform dat onafhankelijk van de bewaakte systemen functioneert.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bepalen welke indicatoren bewaakt worden, welke drempelwaarden acceptabel zijn en welke service level objectives (SLO's) gelden
- **Bij bouw** — meetpunten en healthchecks inbouwen in de applicatie
- **Bij oplevering** — monitoringdashboards en alertregels inrichten, escalatiepaden testen
- **Bij beheer** — continu: bewaking draait zolang het systeem draait, alertregels worden bijgesteld op basis van ervaring
- **Bij incidenten** — monitoringgegevens gebruiken voor snelle diagnose en impactbepaling
- **Bij evaluatie** — beschikbaarheids- en prestatierapporten als input voor verbeterplannen

## 6. Hoe werkt dit?

De applicatie en infrastructuur leveren voortdurend meetgegevens aan een centraal monitoringplatform: hoe snel reageert het systeem, hoeveel fouten treden op, hoeveel capaciteit is beschikbaar. Het platform vergelijkt deze meetgegevens met vooraf afgesproken drempelwaarden. Wanneer een drempelwaarde wordt overschreden — bijvoorbeeld een te hoge foutfrequentie of een verdacht inlogpatroon — wordt automatisch een waarschuwing gestuurd naar de juiste persoon of het juiste team. Bij ernstige situaties volgt automatische escalatie.

## 7. Voor de techneut

### Monitoringtypen
- **Healthchecks** — periodieke controles of services beschikbaar en functioneel zijn (liveness en readiness probes). Geautomatiseerd en onafhankelijk van gebruikersverkeer
- **Metriekenbewaking** — verzamelen en bewaken van kwantitatieve meetpunten: responstijden (p50, p95, p99), foutpercentages, doorvoersnelheid, resourcegebruik (CPU, geheugen, disk, netwerk)
- **SLO-bewaking** — meten van service level objectives en berekenen van error budgets. Wanneer het error budget dreigt op te raken, wordt het team gewaarschuwd voordat de SLA in gevaar komt
- **Anomaliedetectie** — detectie van afwijkend gedrag dat niet door statische drempelwaarden wordt gevangen: ongewone verkeerspatronen, afwijkend gebruikersgedrag, onverklaarbare pieken of dalen

### SIEM-integratie
Beveiligingsrelevante gebeurtenissen worden doorgestuurd naar een Security Information and Event Management (SIEM) systeem. Het SIEM correleert gebeurtenissen uit meerdere bronnen om aanvalspatronen te herkennen die in individuele logstromen niet zichtbaar zijn. Voorbeelden: brute-force pogingen over meerdere accounts, laterale beweging tussen systemen, datalekkagepatronen.

### Alerting en escalatie
- **Alertregels** — gedefinieerd op basis van drempelwaarden, patronen of anomalieen. Elke alert heeft een severity (informational, warning, critical) en een duidelijke eigenaar
- **Onderdrukking en deduplicatie** — voorkomen van alert fatigue door herhalende of samenhangende alerts te groeperen en ruis te onderdrukken
- **Escalatiepaden** — als een alert niet binnen een vastgestelde tijd wordt opgepakt, escaleert het systeem automatisch naar het volgende niveau
- **Runbooks** — bij elke alert hoort een beschrijving van de verwachte actie, zodat ook buiten kantooruren adequaat gehandeld kan worden

### Dashboards en rapportages
- Realtime dashboards voor operationele teams (huidige status, actieve alerts)
- Trenddashboards voor management (beschikbaarheid over tijd, incidentfrequentie)
- Periodieke rapportages voor compliance en directiebeoordeling

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.05 | Logging en monitoring — het monitoringaspect: actief bewaken van gebeurtenissen |
| B/WA.09 | Incidentdetectie — tijdig detecteren van beveiligingsincidenten |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.16.1.1 | Verantwoordelijkheden en procedures voor incidentmanagement |
| A.16.1.2 | Rapportage van beveiligingsgebeurtenissen |
| A.16.1.4 | Beoordeling van en besluitvorming over beveiligingsgebeurtenissen |
| A.12.4.1 | Event logging — het monitoringaspect van het analyseren van vastgelegde gebeurtenissen |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **C1 — Logging & Audit Trail** | Monitoring bouwt voort op logging: zonder vastgelegde gebeurtenissen heeft monitoring geen gegevens om te analyseren. C1 levert de ruwe data, C2 maakt er actie van. |
| **B5 — Error Handling** | Foutpatronen worden door monitoring bewaakt. Herhaaldelijke of onverwachte fouten triggeren alerts en kunnen wijzen op beveiligingsproblemen of systeeminstabiliteit. |
| **D2 — Risk Assessment** | Incidenten die via monitoring worden gedetecteerd, voeden de risicoanalyse. Nieuwe dreigingspatronen leiden tot herbeoordeling van risico's. |
| **D3 — Compliance Evidence & Reporting** | Monitoringrapportages — beschikbaarheid, incidentfrequentie, responstijden — dienen als bewijsvoering bij audits en directiebeoordelingen. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie verantwoordelijk is voor het inrichten van monitoring, het reageren op alerts en het escaleren van incidenten. |
| **A1 — Authenticatie** | Verdachte authenticatiepatronen (brute-force, credential stuffing) worden door monitoring gedetecteerd en geescaleerd. |
