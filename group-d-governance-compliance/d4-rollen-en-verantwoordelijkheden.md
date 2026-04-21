# D4 — Rollen & Verantwoordelijkheden

## 1. Wat is dit bouwblok?

Dit bouwblok legt vast wie waarvoor verantwoordelijk is op het gebied van informatiebeveiliging, beheer en naleving van standaarden. Het zorgt ervoor dat voor elke beveiligingsmaatregel, elk systeem en elk proces duidelijk is wie eigenaar is, wie uitvoert, wie controleert en wie aanspreekbaar is.

## 2. Waarom is dit nodig?

Zonder heldere rollen en verantwoordelijkheden ontstaat onduidelijkheid: beveiligingstaken worden overgeslagen omdat niemand zich eigenaar voelt, incidenten escaleren niet naar de juiste persoon, en bij audits is niet aantoonbaar wie waarvoor verantwoordelijk is. Dit blok voorkomt dat beveiliging "van iedereen en dus van niemand" is.

## 3. Wie heeft hiermee te maken?

- **Opdrachtgever** — is eindverantwoordelijk voor de informatiebeveiliging van het systeem
- **Product owner** — vertaalt beveiligingseisen naar het backlog en prioriteert deze
- **Ontwikkelteam** — implementeert beveiligingsmaatregelen conform de afgesproken standaarden
- **Beheerder / Operations** — bewaakt de operationele beveiliging (patching, monitoring, toegangsbeheer)
- **Security officer** — adviseert, toetst en rapporteert over de beveiligingsstatus
- **Leverancier** — draagt verantwoordelijkheid voor de beveiliging van geleverde componenten of diensten
- **Auditor** — controleert of rollen en verantwoordelijkheden zijn vastgelegd en worden nageleefd

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit niet in de applicatie zelf, maar op **organisatie- en procesniveau**. Het is het kader dat bepaalt wie welke beslissingen neemt en wie aanspreekbaar is. Het raakt de projectorganisatie, contractafspraken met leveranciers en de interne governance-structuur.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — rollen en verantwoordelijkheden vastleggen voordat ontwikkeling begint
- **Bij wijzigingen** — als teamsamenstelling, leveranciers of systeemgrenzen veranderen
- **Bij incidenten** — om te weten wie escaleert, wie beslist, wie herstelt
- **Bij audits** — om aan te tonen dat verantwoordelijkheden zijn belegd en worden nageleefd
- **Doorlopend** — periodieke evaluatie of de belegde rollen nog actueel en effectief zijn

## 6. Hoe werkt dit?

Bij de start van een project worden alle relevante rollen geidentificeerd en wordt per rol vastgelegd wat de verantwoordelijkheden zijn. Dit wordt typisch gedaan met een RACI-matrix (Responsible, Accountable, Consulted, Informed). Bij elke beveiligingsmaatregel uit de andere bouwblokken is dan helder wie deze implementeert, wie de eigenaar is, en wie toezicht houdt. Bij leveranciers worden deze verantwoordelijkheden contractueel vastgelegd.

## 7. Voor de techneut

### RACI per beveiligingsdomein
Voor elk bouwblok in deze architectuur wordt een RACI-toewijzing gemaakt. Dit omvat minimaal:
- **Data-eigenaarschap**: wie is eigenaar van welke gegevensverzamelingen en classificeert deze
- **Toegangsbeheer**: wie beslist over toegangsrechten, wie voert mutaties door, wie controleert
- **Wijzigingsbeheer**: wie keurt changes goed (CAB-rol), wie voert uit, wie verifieert
- **Incidentrespons**: wie detecteert, wie escaleert, wie beslist over maatregelen, wie communiceert
- **Leveranciersmanagement**: wie beoordeelt leveranciers op security, welke eisen staan in contracten (SLA, right-to-audit)

### Scheiding van taken (Separation of Duties)
Kritieke combinaties van taken worden gescheiden om misbruik of fouten te voorkomen. Bijvoorbeeld: wie code schrijft mag niet dezelfde persoon zijn die naar productie deployt. Wie toegangsrechten aanvraagt is niet dezelfde als wie ze toekent.

### Security champion model
Binnen ontwikkelteams wordt een security champion aangewezen — een teamlid dat als aanspreekpunt fungeert voor beveiligingsvraagstukken, de Definition of Done op security-aspecten bewaakt, en de schakel vormt met de security officer.

## 8. Gedekte clausules

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| 5.1 | Leiderschap en betrokkenheid — managementcommitment aan informatiebeveiliging |
| 5.3 | Organisatorische rollen, verantwoordelijkheden en bevoegdheden |
| A.6.1 | Interne organisatie — rollen en verantwoordelijkheden voor informatiebeveiliging |
| A.6.1.1 | Rollen en verantwoordelijkheden voor informatiebeveiliging |
| A.6.1.2 | Scheiding van taken |
| A.15.1 | Informatiebeveiliging in leveranciersrelaties |
| A.15.1.1 | Informatiebeveiligingsbeleid voor leveranciersrelaties |
| A.15.1.2 | Opnemen van beveiligingsaspecten in leveranciersovereenkomsten |

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| B/WA.01 | Beleid en organisatie — toewijzing van verantwoordelijkheden voor webapplicatiebeveiliging |
| B/WA.02 | Risicomanagement — eigenaarschap van risico's beleggen |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **Alle bouwblokken** | D4 is het fundament: elk bouwblok heeft een eigenaar, uitvoerder en controleur nodig. Zonder D4 is niet vast te stellen wie verantwoordelijk is voor de maatregelen in de overige blokken. |
| **D2 — Risk Assessment** | Risico-eigenaarschap wordt hier belegd: wie beslist over acceptatie of mitigatie van risico's. |
| **D3 — Compliance Evidence** | Vastleggen wie verantwoordelijk is voor het verzamelen en bewaren van bewijsvoering. |
| **C1 — Logging & Audit Trail** | Bepaalt wie toegang heeft tot logs, wie deze beoordeelt, en wie actie onderneemt bij bevindingen. |
| **B3 — Secrets Management** | Bepaalt wie secrets mag aanmaken, roteren en inzien. |
| **A1 — Authenticatie / A2 — Autorisatie** | Bepaalt wie beslissingsbevoegd is over toegangsbeleid en wie dit operationeel beheert. |
