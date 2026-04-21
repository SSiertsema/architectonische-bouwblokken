# D3 — Compliance Evidence & Reporting

## 1. Wat is dit bouwblok?

Dit bouwblok zorgt ervoor dat bewijs wordt verzameld en gepresenteerd dat beveiligingsmaatregelen daadwerkelijk zijn genomen, werken en worden onderhouden. Het maakt de organisatie auditeerbaar: niet alleen is beveiliging ingericht, het is ook aantoonbaar ingericht.

## 2. Waarom is dit nodig?

Beveiligingsmaatregelen die niet aantoonbaar zijn, bestaan voor een auditor niet. Zonder bewijsvoering kan de organisatie niet aantonen dat ze voldoet aan wet- en regelgeving, contractuele eisen of haar eigen beveiligingsbeleid. Bij een audit, incident of directiebeoordeling ontbreekt dan het fundament om te laten zien dat de organisatie haar verantwoordelijkheid neemt. Dit bouwblok voorkomt dat goed werk onzichtbaar blijft.

## 3. Wie heeft hiermee te maken?

- **Opdrachtgever** — moet aan toezichthouders en stakeholders kunnen aantonen dat beveiliging op orde is
- **Product owner** — zorgt dat bewijsverzameling wordt meegenomen in de planning en niet wordt uitgesteld
- **Ontwikkelteam** — levert technisch bewijs: testresultaten, scanrapporten, configuratiedocumentatie
- **Beheerder / Operations** — levert operationeel bewijs: uptimerapporten, patchstatus, loganalyses
- **Security officer** — coordineert de bewijsverzameling, voert maturity-assessments uit en bereidt audits voor
- **Auditor** — beoordeelt of het verzamelde bewijs compleet, actueel en valide is
- **Management** — ontvangt periodieke rapportages over de beveiligingsstatus en neemt besluiten over verbeteringen

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit op **organisatie- en procesniveau**. Het is geen technisch component in de applicatie, maar een proces dat bewijs uit alle lagen verzamelt: technische scanrapporten, operationele loganalyses, procesbeschrijvingen en beleidsdocumenten. De uitkomst is een samenhangend dossier dat de beveiligingsstatus van het systeem onderbouwt.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — bepalen welke bewijsvoering nodig is op basis van de toepasselijke eisen (ISO 27001, NCSC, Forum Standaardisatie)
- **Doorlopend** — bewijs wordt continu verzameld, niet pas vlak voor een audit
- **Bij audits** — het bewijsdossier wordt gepresenteerd aan interne of externe auditors
- **Bij directiebeoordelingen** — periodieke rapportages over de beveiligingsstatus als input voor managementbeslissingen
- **Na incidenten** — evaluatierapporten en corrigerende maatregelen worden vastgelegd als bewijs van leerproces
- **Bij wijzigingen** — herbeoordelen of bestaand bewijs nog actueel is na significante wijzigingen

## 6. Hoe werkt dit?

Vanuit alle bouwblokken wordt bewijs verzameld dat maatregelen zijn ingericht en werken: logs tonen dat er wordt gelogd, scanrapporten tonen dat kwetsbaarheden worden opgespoord, het risicoregister toont dat risico's worden beheerd. Dit bewijs wordt geordend en gepresenteerd in rapportages die aansluiten bij het beoordelingskader — bijvoorbeeld ISO 27001-clausules of NCSC-richtlijnen. Periodiek wordt beoordeeld of het bewijs compleet en actueel is, en waar verbeteringen nodig zijn.

## 7. Voor de techneut

### Bewijsverzameling
Bewijs wordt uit meerdere bronnen verzameld en centraal geordend:
- **Geautomatiseerd bewijs** — scanrapporten (SAST, DAST, SCA), testresultaten, monitoringrapporten, compliance-as-code checks. Dit bewijs wordt bij voorkeur automatisch gegenereerd en opgeslagen
- **Operationeel bewijs** — loganalyses, uptimerapporten, patchstatusoverzichten, back-upverificaties
- **Procesbewijs** — notulen van risico-overleggen, goedkeuringen van restrisico's, change-adviezen, incidentevaluaties
- **Beleidsbewijs** — vastgesteld beveiligingsbeleid, rolbeschrijvingen, procedures voor incidentafhandeling

### Maturity-assessment
Periodiek wordt beoordeeld hoe volwassen de beveiligingsmaatregelen zijn. Per maatregel of bouwblok wordt het niveau vastgesteld:
- **Niet ingericht** — de maatregel bestaat niet
- **Ad hoc** — de maatregel is informeel en persoongebonden
- **Herhaalbaar** — de maatregel is beschreven en wordt consistent uitgevoerd
- **Geoptimaliseerd** — de maatregel wordt gemeten, geevalueerd en continu verbeterd

### Auditvoorbereiding
- Mapping van bewijsstukken naar specifieke clausules (ISO 27001, NCSC, Forum Standaardisatie)
- Gap-analyse: voor welke clausules ontbreekt bewijs of is het bewijs verouderd?
- Remediation planning: welke acties zijn nodig om ontbrekend bewijs te leveren?

### Periodieke evaluatie en continue verbetering
- Minimaal halfjaarlijks wordt het bewijsdossier beoordeeld op compleetheid en actualiteit
- Afwijkingen worden geregistreerd met corrigerende maatregelen en een deadline
- Trends worden bijgehouden: verbetert of verslechtert de beveiligingsstatus over tijd?

### "Leg uit"-documentatie
Wanneer een verplichte standaard van Forum Standaardisatie niet wordt toegepast, wordt de motivering als bewijs vastgelegd. Deze documentatie bevat: welke standaard het betreft, waarom deze niet wordt toegepast, welke alternatieve maatregel is genomen, en wie de beslissing heeft genomen.

## 8. Gedekte clausules

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| 9.1 | Monitoren, meten, analyseren en evalueren — bewijs dat het ISMS werkt |
| 9.2 | Interne audit — periodieke beoordeling van het ISMS |
| 9.3 | Directiebeoordeling — managementreview van de beveiligingsstatus |
| 10.1 | Afwijkingen en corrigerende maatregelen |
| 10.2 | Continue verbetering |

### Forum Standaardisatie
| Verplichting | Onderwerp |
|--------------|-----------|
| "Leg uit"-documentatie | Gedocumenteerde motivering bij afwijking van verplichte standaarden als bewijsstuk |

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| B/WA.11 | Periodieke review en assessment — structureel evalueren of beveiligingsmaatregelen nog toereikend zijn |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **C1 — Logging & Audit Trail** | Logs zijn een primaire bron van bewijs. Wat in C1 wordt vastgelegd — beveiligingsgebeurtenissen, audittrail, operationele logs — wordt in D3 als bewijs gepresenteerd. |
| **D1 — Standaarden Compliance Registry** | "Pas toe"- en "leg uit"-beslissingen uit het standaardenregister zijn directe bewijsstukken voor naleving van Forum Standaardisatie-verplichtingen. |
| **D2 — Risk Assessment** | Het risicoregister, behandelplannen en acceptatiebeslissingen zijn bewijsstukken die aantonen dat risicomanagement structureel plaatsvindt. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie verantwoordelijk is voor het verzamelen, ordenen en presenteren van bewijs, en wie de bewijsvoering beoordeelt. |
| **B2 — Dependency & Vulnerability Management** | Scanrapporten van kwetsbaarheidsscans zijn geautomatiseerd bewijs dat kwetsbaarheden actief worden opgespoord en behandeld. |
| **C2 — Monitoring & Alerting** | Monitoringrapportages over beschikbaarheid, incidentfrequentie en responstijden dienen als operationeel bewijs bij audits. |
