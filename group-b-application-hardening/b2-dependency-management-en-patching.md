# B2 — Dependency Management & Patching

## 1. Wat is dit bouwblok?

Dit bouwblok regelt het beheer van alle externe componenten waarvan de applicatie afhankelijk is: bibliotheken, frameworks en runtime-omgevingen. Het zorgt ervoor dat deze afhankelijkheden bewust worden gekozen, dat bekende kwetsbaarheden tijdig worden opgespoord en verholpen, en dat componenten niet ongemerkt end-of-life raken.

## 2. Waarom is dit nodig?

Moderne applicaties bestaan voor het overgrote deel uit externe code. Eén kwetsbare bibliotheek kan de hele applicatie — en daarmee de organisatie — blootstellen aan aanvallen. Zonder actief beheer weet niemand welke componenten in gebruik zijn, of die nog worden onderhouden, en of er bekende kwetsbaarheden in zitten. Dit bouwblok voorkomt dat de applicatie stilzwijgend afhankelijk wordt van onveilige of verlaten software, en zorgt dat patches tijdig en beheerst worden doorgevoerd.

## 3. Wie heeft hiermee te maken?

- **Ontwikkelteam** — kiest afhankelijkheden, voert updates door en beoordeelt impact van patches
- **Beheerder / Operations** — voert patches door op runtime-omgevingen en bewaakt de patchplanning
- **Security officer** — beoordeelt kwetsbaarheidsrapporten en bewaakt dat kritieke patches tijdig worden doorgevoerd
- **Product owner** — weegt patchurgentie af tegen geplande werkzaamheden en accepteert risico's bij uitstel
- **Architect** — beoordeelt de strategische keuze voor frameworks en componenten op lange termijn

## 4. Waar zit dit in de applicatie?

Dependency management raakt meerdere niveaus. Op **applicatieniveau** gaat het om bibliotheken en frameworks in de broncode. Op **infraniveau** gaat het om runtime-omgevingen, basisimages en besturingssysteemcomponenten. Op **procesniveau** gaat het om het patchbeleid, de scanfrequentie en de escalatieprocedure bij kritieke kwetsbaarheden. Het doorsnijdt daarmee de hele levenscyclus van ontwikkeling tot productie.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bewuste keuze van afhankelijkheden op basis van onderhoudsstatus, licentie en veiligheidsprofiel
- **Bij bouw** — vastleggen van exacte versies en opnemen van scanning in de CI/CD-pipeline
- **Bij testen** — verifiëren dat updates geen bestaande functionaliteit breken
- **Bij uitrol** — bevestigen dat alle afhankelijkheden op ondersteunde versies draaien
- **Doorlopend** — continu scannen op nieuwe kwetsbaarheden en het naderen van end-of-life

## 6. Hoe werkt dit?

De applicatie houdt een actuele inventaris bij van alle externe componenten die worden gebruikt — een soort ingrediëntenlijst. Geautomatiseerde tooling controleert deze lijst doorlopend tegen bekende kwetsbaarheden en signaleert wanneer een component verouderd of onveilig is. Bij een melding wordt de ernst beoordeeld, een patch gepland en doorgevoerd via het reguliere wijzigingsproces. Componenten die het einde van hun levensduur naderen, worden tijdig vervangen. Zo blijft de applicatie gebouwd op een gezonde, actuele basis.

## 7. Voor de techneut

### Software Bill of Materials (SBOM)
De applicatie genereert bij elke build een SBOM in een gestandaardiseerd formaat (CycloneDX of SPDX). Deze SBOM bevat alle directe en transitieve afhankelijkheden met exacte versies, licenties en herkomst. De SBOM wordt opgeslagen als artefact en is de basis voor alle verdere analyses. Bij containerimages wordt ook de SBOM van het basisimage meegenomen.

### Software Composition Analysis (SCA)
Een SCA-tool scant de SBOM en broncode automatisch bij elke commit en build. De tool vergelijkt afhankelijkheden tegen kwetsbaarheidsdatabases (NVD, OSV, GitHub Advisory Database) en rapporteert gevonden CVE's met ernst-classificatie (CVSS). Kritieke en hoge kwetsbaarheden blokkeren de pipeline; lagere worden als technische schuld geregistreerd. Scanning draait ook periodiek op gedeployde applicaties om nieuw ontdekte kwetsbaarheden in bestaande versies te vangen.

### End-of-Life tracking
Alle componenten worden gemonitord op hun ondersteuningsstatus. Wanneer een component binnen een gedefinieerde horizon (bijvoorbeeld zes maanden) end-of-life bereikt, wordt automatisch een migratie-issue aangemaakt. Componenten die al end-of-life zijn, worden als kritiek risico gerapporteerd. Dit geldt voor taalversies, frameworks, besturingssystemen en database-engines.

### Patchbeleid en SLA's
Patches worden geprioriteerd op basis van CVSS-score en exploiteerbaarheid:
- **Kritiek (CVSS 9.0+)** — binnen 24-48 uur gepatcht of gemitigeerd
- **Hoog (CVSS 7.0-8.9)** — binnen een week gepatcht
- **Midden (CVSS 4.0-6.9)** — binnen 30 dagen gepatcht
- **Laag (CVSS < 4.0)** — meegenomen in reguliere updatecycli

Bij uitstel wordt het restrisico expliciet geaccepteerd en gedocumenteerd door de verantwoordelijke rol.

### Versiepinning en reproduceerbaarheid
Alle afhankelijkheden worden vastgezet op exacte versies via lockfiles. Builds zijn reproduceerbaar: dezelfde broncode levert altijd dezelfde set afhankelijkheden op. Automatische versie-updates (via tooling zoals Dependabot of Renovate) worden als merge requests aangeboden, nooit stilzwijgend doorgevoerd.

### Licentiecompliance
De SCA-tool controleert ook de licenties van alle afhankelijkheden tegen een goedgekeurde lijst. Onverenigbare licenties (bijvoorbeeld copyleft-licenties in proprietary software) worden geblokkeerd. Licentiewijzigingen bij updates worden gesignaleerd.

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.09 | Patchmanagement — tijdig doorvoeren van beveiligingsupdates |
| B/WA.12 | Lifecycle management — beheer van de levenscyclus van componenten |
| B/WA.06 | Kwetsbaarheidsbeheer — identificeren en verhelpen van kwetsbaarheden |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.12.6.1 | Beheer van technische kwetsbaarheden — identificatie en tijdig verhelpen |
| A.12.6.2 | Beperking van software-installatie — beheerst toevoegen van componenten |
| A.14.2.2 | Wijzigingsbeheerprocedures — gecontroleerd doorvoeren van patches |
| A.15.2.1 | Monitoring en beoordeling van leveranciersdiensten — bewaken van externe componenten |

### Forum Standaardisatie
| Aspect | Onderwerp |
|--------|-----------|
| Vendor-neutraliteit | Bewuste keuze voor componenten die open standaarden ondersteunen, ter voorkoming van vendor lock-in |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **C1 — Logging & Audit Trail** | Scanresultaten, patchacties en versiewijzigingen worden gelogd in C1. Dit levert een auditspoor op van wanneer kwetsbaarheden zijn ontdekt en wanneer ze zijn verholpen. |
| **D2 — Risicoanalyse** | Gevonden kwetsbaarheden en end-of-life componenten voeden de risicoanalyse in D2. De CVSS-score en exploiteerbaarheid bepalen de risico-inschatting. |
| **D3 — Compliance & Bewijsvoering** | SBOM's, scanrapporten en patchhistorie dienen als bewijsvoering voor D3. Ze tonen aan dat de organisatie actief kwetsbaarheden beheert. |
| **D4 — Rollen & Verantwoordelijkheden** | D4 bepaalt wie beslist over patchprioriteit, wie uitstel mag accorderen en wie verantwoordelijk is voor de tijdigheid van patches. |
| **B3 — Secrets Management** | Dependency-configuratie (package registries, private repositories) bevat vaak credentials die via B3 worden beheerd. Secrets mogen nooit in lockfiles of configuratiebestanden terechtkomen. |
| **D1 — Standaarden & Richtlijnen** | D1 definieert welke open standaarden worden gehanteerd bij de keuze van componenten en voorkomt onnodige afhankelijkheid van gesloten ecosystemen. |
