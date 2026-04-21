# C1 — Logging & Audit Trail

## 1. Wat is dit bouwblok?

Dit bouwblok zorgt ervoor dat een applicatie bijhoudt wat er gebeurt: wie heeft wat gedaan, wanneer, en met welk resultaat. Het legt gebeurtenissen vast op drie niveaus — beveiligingsgebeurtenissen, een controleerbaar spoor van handelingen (audit trail), en operationele informatie voor foutopsporing en prestatiebewaking.

## 2. Waarom is dit nodig?

Zonder logging is een applicatie een zwarte doos. Als er een beveiligingsincident plaatsvindt, is niet te achterhalen wat er is gebeurd, door wie, en wanneer. Bij een audit kan niet worden aangetoond dat beveiligingsmaatregelen werken. Bij een storing ontbreekt de informatie om de oorzaak te vinden. Logging maakt het verschil tussen reageren op basis van feiten en gissen in het donker.

## 3. Wie heeft hiermee te maken?

- **Opdrachtgever** — draagt de verantwoordelijkheid dat het systeem controleerbaar en auditeerbaar is
- **Product owner** — prioriteert welke gebeurtenissen vastgelegd moeten worden op basis van risico en compliance
- **Ontwikkelteam** — bouwt logging in op de juiste plekken in de applicatie
- **Beheerder / Operations** — beheert de loginfrastructuur, bewaakt opslagcapaciteit en bewaartermijnen
- **Security officer** — gebruikt logs voor incidentonderzoek en beveiligingsanalyse
- **Auditor** — beoordeelt of de logging compleet, integer en conform de eisen is
- **Functionaris gegevensbescherming** — toetst of logging geen persoonsgegevens bevat die er niet in horen

## 4. Waar zit dit in de applicatie?

Logging zit op **alle lagen** van de applicatie en infrastructuur. Van de gebruikersinterface (wie logt in), via de applicatielogica (welke acties worden uitgevoerd), tot de infrastructuur (systeemmeldingen, toegangspogingen). De opslag en verwerking van logs vindt doorgaans plaats buiten de applicatie zelf, in een centrale logvoorziening.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bepalen welke gebeurtenissen gelogd moeten worden en welke niet (privacy, relevantie)
- **Bij bouw** — logging inbouwen op de juiste plekken met de juiste detaillering
- **Bij beheer** — logbestanden bewaken, bewaartermijnen handhaven, opslagcapaciteit beheren
- **Bij incidenten** — logs raadplegen voor onderzoek en reconstructie
- **Bij audits** — logs presenteren als bewijs dat maatregelen werken
- **Doorlopend** — logs worden continu gegenereerd zolang het systeem draait

## 6. Hoe werkt dit?

De applicatie genereert bij relevante gebeurtenissen een logmelding met gestandaardiseerde informatie: wat er gebeurde, wie de handeling uitvoerde, wanneer, en of het succesvol was. Deze meldingen worden verstuurd naar een centrale plek waar ze veilig worden opgeslagen, niet achteraf gewijzigd kunnen worden, en gedurende een vastgestelde periode bewaard blijven. Vanuit deze centrale plek kunnen logs doorzocht, geanalyseerd en gerapporteerd worden.

## 7. Voor de techneut

### Drie logcategorieen
- **Security event logging** — inlogpogingen (geslaagd en mislukt), autorisatiefouten, privilege-escalatie, wijzigingen in toegangsrechten, sessie-gebeurtenissen (aanmaken, vernietigen, timeout)
- **Audit trail** — wie heeft welke data ingezien, gewijzigd of verwijderd; beslissingen en goedkeuringen; configuratiewijzigingen. Gericht op accountability en compliance
- **Operationeel** — applicatiefouten, performance-metrieken, systeemstatus, debuginformatie. Gericht op beschikbaarheid en foutopsporing

### Logformaat en structuur
Logs zijn gestructureerd (JSON of vergelijkbaar), niet vrije tekst. Elk logrecord bevat minimaal:
- Tijdstempel (UTC, ISO 8601)
- Gebeurtenistype en severity
- Actor (gebruiker, systeem, service)
- Actie en doelresource
- Resultaat (succes/falen)
- Correlatie-ID (om gerelateerde gebeurtenissen over services te koppelen)

### Integriteit en onweerlegbaarheid
Logs mogen na vastlegging niet gewijzigd of verwijderd kunnen worden door de applicatie of haar beheerders (append-only). Dit wordt afgedwongen door logs buiten de applicatieomgeving op te slaan met aparte toegangsrechten. Voor hoog-risico omgevingen kan cryptografische log-integriteit (hash-chaining) overwogen worden.

### Bewaartermijnen en privacy
- Bewaartermijnen worden bepaald op basis van wet- en regelgeving en risicoanalyse
- Persoonsgegevens in logs worden geminimaliseerd (geen wachtwoorden, BSN, medische gegevens)
- Waar persoonsgegevens noodzakelijk zijn, worden deze gepseudonimiseerd waar mogelijk

### Wat niet te loggen
- Wachtwoorden, tokens of secrets (ook niet gehashed)
- Volledige request/response bodies met gevoelige inhoud
- Persoonsgegevens die niet noodzakelijk zijn voor het doel van de logging

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.05 | Logging en monitoring — vastleggen van relevante gebeurtenissen |
| U/WA.06 | Loganalyse — periodieke beoordeling van loggegevens |
| B/WA.09 | Bescherming van loggegevens — integriteit en beschikbaarheid waarborgen |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.12.4.1 | Gebeurtenissen vastleggen (event logging) |
| A.12.4.2 | Bescherming van informatie in logbestanden |
| A.12.4.3 | Logbestanden van beheerders en operators |
| A.12.4.4 | Kloksynchronisatie |
| 9.1 | Monitoren, meten, analyseren en evalueren — bewijs van werking van het ISMS |

### NCSC ICT-beveiligingsrichtlijnen (aanvullend)
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.05 | Logging en monitoring — vastleggen van relevante gebeurtenissen |
| U/WA.06 | Loganalyse — periodieke beoordeling van loggegevens |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **Alle bouwblokken** | C1 is het meest verwezen bouwblok: vrijwel alle andere blokken genereren gebeurtenissen die gelogd moeten worden. Logging is de gemeenschappelijke basis voor zichtbaarheid en controleerbaarheid. |
| **C2 — Monitoring & Alerting** | Monitoring bouwt voort op logging: het analyseert loggebeurtenissen en genereert waarschuwingen bij afwijkingen. Zonder C1 heeft C2 geen gegevens om op te acteren. |
| **D3 — Compliance Evidence** | Logs vormen een primaire bron van bewijsvoering voor audits. Wat in C1 wordt vastgelegd, wordt in D3 als bewijs gepresenteerd. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie verantwoordelijk is voor het inrichten, beheren en beoordelen van logging. |
| **A1 — Authenticatie** | Inlogpogingen (geslaagd en mislukt) zijn een van de belangrijkste bronnen van beveiligingslogs. |
| **A2 — Autorisatie** | Geweigerde toegangspogingen en privilege-wijzigingen worden vastgelegd als beveiligingsgebeurtenissen. |
| **B5 — Error Handling** | Foutafhandeling genereert operationele logmeldingen en levert het correlatie-ID dat logregels aan elkaar koppelt. |
| **B3 — Secrets Management** | Toegang tot secrets wordt gelogd. Tegelijkertijd mogen secrets zelf nooit in logs verschijnen. |
