# A2 — Autorisatie

## 1. Wat is dit bouwblok?

Dit bouwblok regelt de toegangscontrole: het bepalen wat een geauthenticeerde gebruiker mag doen binnen de applicatie. Het omvat de regels, mechanismen en besluitvorming waarmee per gebruiker of rol wordt vastgelegd welke gegevens en functies toegankelijk zijn — en welke niet.

## 2. Waarom is dit nodig?

Zonder autorisatie heeft elke ingelogde gebruiker toegang tot alles. Een medewerker zou dan klantgegevens van andere afdelingen kunnen inzien, een gewone gebruiker zou beheerfuncties kunnen uitvoeren, en een externe partij zou bij vertrouwelijke documenten kunnen. Dit bouwblok zorgt ervoor dat mensen alleen kunnen doen waarvoor ze bevoegd zijn — niet meer en niet minder.

## 3. Wie heeft hiermee te maken?

- **Eindgebruiker** — ervaart welke functies en gegevens beschikbaar zijn op basis van zijn rol
- **Product owner** — definieert welke rollen en rechten nodig zijn vanuit de gebruikersbehoeften
- **Ontwikkelteam** — implementeert autorisatiecontroles in de applicatie en API's
- **Beheerder / Operations** — beheert roltoewijzingen, voert periodieke reviews uit op toegangsrechten
- **Security officer** — stelt het autorisatiebeleid vast en toetst of het principe van least privilege wordt nageleefd
- **Data-eigenaar** — beslist wie toegang krijgt tot welke gegevensverzamelingen
- **Auditor** — controleert of toegangsrechten actueel, passend en aantoonbaar zijn

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit primair op **applicatieniveau**: de autorisatielogica is onderdeel van de applicatiecode en API-laag. Daarnaast heeft het een **organisatorisch** component — het beleid dat bepaalt welke rollen bestaan en welke rechten daarbij horen, wordt vastgesteld door de organisatie. Op **infraniveau** kan autorisatie worden afgedwongen via API-gateways of netwerkregels.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — rollenmodel en autorisatiemodel ontwerpen (RBAC, ABAC of hybride)
- **Bij ontwikkeling** — autorisatiecontroles implementeren op elke API-endpoint en functie
- **Bij ingebruikname** — rollen toewijzen aan gebruikers, initiële rechten configureren
- **Bij wijzigingen** — als functies, gegevensstructuren of organisatierollen veranderen
- **Doorlopend** — periodieke review van toegangsrechten om rechtenophoping te voorkomen

## 6. Hoe werkt dit?

Na authenticatie krijgt een gebruiker een set rechten op basis van zijn rol of attributen. Bij elke handeling in de applicatie — een pagina openen, gegevens opvragen, een actie uitvoeren — wordt gecontroleerd of de gebruiker daarvoor bevoegd is. Dit gebeurt centraal: de regels staan op één plek, zodat ze consistent worden toegepast en eenvoudig zijn aan te passen. Het uitgangspunt is "least privilege": een gebruiker krijgt alleen de minimale rechten die nodig zijn voor zijn taak.

## 7. Voor de techneut

### Autorisatiemodellen
De applicatie hanteert Role-Based Access Control (RBAC), eventueel uitgebreid met Attribute-Based Access Control (ABAC) voor fijnmazige controle. Bij RBAC worden rechten gekoppeld aan rollen, en rollen aan gebruikers. Bij ABAC worden daarnaast attributen van de gebruiker, de resource en de context (tijd, locatie, apparaat) meegewogen in de beslissing.

### Policy Decision en Policy Enforcement
De autorisatiearchitectuur scheidt de beslissing (Policy Decision Point, PDP) van de afdwinging (Policy Enforcement Point, PEP). De PDP evalueert autorisatieregels; de PEP blokkeert of staat de actie toe. Deze scheiding maakt het mogelijk om autorisatieregels centraal te beheren zonder de applicatielogica te wijzigen.

### Privilege escalation preventie
De applicatie voorkomt dat gebruikers hun eigen rechten kunnen verhogen. Dit omvat: server-side validatie van elke autorisatiebeslissing (nooit alleen client-side), bescherming tegen Insecure Direct Object References (IDOR), en controle dat horizontale en verticale privilege escalation niet mogelijk is via manipulatie van requests of parameters.

### Toegangsrechten lifecycle
Toegangsrechten worden toegekend via een geformaliseerd proces (aanvraag, goedkeuring, toekenning) en periodiek gereviewed. Bij functiewijziging of vertrek worden rechten direct aangepast of ingetrokken. Rechtenophoping ("privilege creep") wordt actief bestreden door periodieke attestatie van alle toegewezen rechten.

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.02 | Autorisatie — eisen aan de autorisatie binnen de webapplicatie |
| B/WA.04 | Toegangscontrole — beheer en afdwinging van toegangsrechten |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.9.1.1 | Toegangsbeheerbeleid |
| A.9.1.2 | Toegang tot netwerken en netwerkdiensten |
| A.9.2.2 | Gebruikerstoegang verlenen |
| A.9.2.3 | Beheer van speciale toegangsrechten (privileged access) |
| A.9.2.5 | Beoordeling van toegangsrechten van gebruikers |
| A.9.4.1 | Beperking van toegang tot informatie |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **A1 — Authenticatie** | Authenticatie gaat vooraf aan autorisatie: eerst wordt vastgesteld wie de gebruiker is, daarna wat hij mag. |
| **B3 — Secrets Management** | Bepaalt wie secrets mag aanmaken, inzien en roteren — autorisatie op het niveau van geheime configuratie. |
| **C1 — Logging & Audit Trail** | Autorisatiefouten (geweigerde toegang) worden gelogd voor detectie van ongeautoriseerde toegangspogingen. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie beslissingsbevoegd is over het autorisatiebeleid en wie roltoewijzingen beheert. |
