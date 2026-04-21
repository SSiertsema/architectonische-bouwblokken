# D1 — Standaarden Compliance Registry

## 1. Wat is dit bouwblok?

Dit bouwblok registreert welke open standaarden op een project van toepassing zijn en of ze daadwerkelijk worden toegepast. Voor elke standaard wordt vastgelegd: wordt deze toegepast ("pas toe"), of wordt er gemotiveerd van afgeweken ("leg uit"). Het vormt de administratieve ruggengraat voor het naleven van verplichte standaarden.

## 2. Waarom is dit nodig?

Overheidsorganisaties zijn verplicht om standaarden van de "pas toe of leg uit"-lijst van Forum Standaardisatie te gebruiken. Zonder een centraal overzicht is niet te achterhalen welke standaarden van toepassing zijn, of ze worden nageleefd, en waar bewust wordt afgeweken. Bij een audit of directiebeoordeling ontbreekt dan het bewijs dat de organisatie haar verplichtingen kent en nakomt. Dit bouwblok voorkomt dat standaarden onbewust worden genegeerd of dat afwijkingen niet worden onderbouwd.

## 3. Wie heeft hiermee te maken?

- **Opdrachtgever** — draagt de eindverantwoordelijkheid dat verplichte standaarden worden toegepast of dat afwijkingen afdoende zijn gemotiveerd
- **Product owner** — zorgt dat standaardencompliance wordt meegenomen in de prioritering en planning
- **Architect** — bepaalt welke standaarden van toepassing zijn op basis van het toepassingsgebied en de context van het project
- **Ontwikkelteam** — implementeert de gekozen standaarden in de applicatie
- **Security officer** — toetst of beveiligingsgerelateerde standaarden correct zijn toegepast
- **Auditor** — beoordeelt of de registratie compleet is en of "leg uit"-motiveringen valide zijn

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit op **organisatie- en procesniveau**. Het is geen technisch component in de applicatie zelf, maar een registratie die buiten de applicatie wordt bijgehouden. De inhoud ervan heeft directe impact op technische keuzes: welke protocollen, formats en interfaces worden gebruikt, wordt bepaald door de standaarden die hier zijn vastgelegd.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — bepalen welke standaarden van toepassing zijn op basis van het type applicatie, het toepassingsgebied en de doelgroep
- **Bij ontwerp** — architectuurkeuzes toetsen aan de vastgestelde standaarden
- **Bij bouw** — standaarden concreet implementeren; afwijkingen documenteren met motivering
- **Bij wijzigingen** — herbeoordelen of de standaardenlijst nog actueel is, bijvoorbeeld wanneer Forum Standaardisatie de verplichte lijst bijwerkt
- **Bij audits** — het register presenteren als bewijs van naleving of onderbouwde afwijking

## 6. Hoe werkt dit?

Bij aanvang van een project wordt de verplichte standaardenlijst van Forum Standaardisatie doorgelopen. Per standaard wordt beoordeeld of deze van toepassing is op het project. Voor elke toepasselijke standaard wordt vastgelegd of deze wordt toegepast, en zo niet, waarom niet. Deze registratie wordt gedurende het project bijgehouden en geactualiseerd wanneer standaarden wijzigen of het project verandert. Bij audits en evaluaties dient het register als referentiedocument.

## 7. Voor de techneut

### Structuur van het register
Per standaard worden minimaal de volgende gegevens vastgelegd:
- **Standaard** — naam en versie (bijv. TLS 1.3, SAML 2.0, DigiD Koppelvlakstandaard, REST-API Design Rules)
- **Bron** — verwijzing naar de verplichte lijst (Forum Standaardisatie) of andere bron (NORA, sectorspecifiek)
- **Toepassingsgebied** — wanneer en waarvoor de standaard verplicht is
- **Status** — "pas toe" (wordt toegepast), "leg uit" (gemotiveerd niet toegepast), of "niet van toepassing" (met toelichting)
- **Motivering bij afwijking** — bij "leg uit": de onderbouwing waarom de standaard niet wordt toegepast, inclusief welke alternatieve maatregel is genomen
- **Eigenaar** — wie verantwoordelijk is voor de beslissing en de actualisatie

### Koppeling met architectuurkeuzes
Het register is niet alleen een checklist maar ook een stuurmiddel. Architecture Decision Records (ADR's) verwijzen naar het register wanneer een standaard de keuze voor een technologie of protocol bepaalt. Andersom verwijst het register naar ADR's die een "leg uit"-beslissing onderbouwen.

### Forum Standaardisatie verplichte lijst
De verplichte lijst bevat standaarden voor o.a.:
- **Interconnectiviteit** — TLS, DNSSEC, IPv6, STARTTLS/DANE
- **Webstandaarden** — HTTPS, CSP, HSTS
- **Gegevensuitwisseling** — REST-API Design Rules, StUF, Digikoppeling
- **Authenticatie** — SAML, OpenID Connect (bij overheidsauthenticatie)
- **Toegankelijkheid** — WCAG (EN 301 549)

De actuele lijst wordt gepubliceerd op forumstandaardisatie.nl en wordt periodiek bijgewerkt.

### NORA-principes
Naast specifieke standaarden worden NORA-architectuurprincipes als referentiekader gehanteerd. Het register kan ook NORA-principes bevatten die van toepassing zijn op het project, zoals hergebruik, openheid en leveranciersonafhankelijkheid.

## 8. Gedekte clausules

### Forum Standaardisatie
| Verplichting | Onderwerp |
|--------------|-----------|
| "Pas toe of leg uit"-regime | Per standaard op de verplichte lijst vastleggen of deze wordt toegepast of gemotiveerd niet wordt toegepast |
| Verplichte standaardenlijst | De actuele lijst van verplichte open standaarden als referentiekader voor het register |

### NORA
| Principe | Onderwerp |
|----------|-----------|
| "Pas toe of leg uit"-standaarden | NORA hanteert dezelfde standaardenlijst als referentiekader voor architectuurkeuzes |
| Architectuurprincipes | NORA-principes als richtinggevend kader voor ontwerp- en technologiekeuzes |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.18.1.1 | Identificatie van toepasselijke wetgeving en contractuele eisen |
| A.18.2.2 | Naleving van beveiligingsbeleid en -normen — toetsen of vastgestelde standaarden worden gevolgd |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **Alle technische bouwblokken** | D1 bepaalt welke standaarden de technische bouwblokken moeten implementeren. Bijvoorbeeld: A1 moet voldoen aan SAML/OIDC-standaarden, B1 aan TLS-standaarden, B4 aan REST-API Design Rules. |
| **D3 — Compliance Evidence & Reporting** | "Pas toe"- en "leg uit"-beslissingen worden als compliance-bewijs opgenomen in D3. Het register zelf is een bewijsstuk bij audits. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie bevoegd is om te besluiten over toepassing of afwijking van standaarden, en wie het register beheert. |
| **D2 — Risk Assessment** | Afwijking van een verplichte standaard kan een beveiligingsrisico introduceren dat in de risicoanalyse moet worden meegenomen. |
