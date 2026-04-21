# B1 — Input Validatie & Output Encoding

## 1. Wat is dit bouwblok?

Dit bouwblok beschermt de applicatie tegen aanvallen die via invoer binnenkomen en via uitvoer schade aanrichten. Alle data die de applicatie ontvangt — van gebruikers, externe systemen of bestanden — wordt gecontroleerd voordat deze wordt verwerkt. Alle data die de applicatie teruggeeft wordt veilig gecodeerd zodat deze niet onbedoeld als programmacode kan worden uitgevoerd.

## 2. Waarom is dit nodig?

Injectie-aanvallen (zoals SQL-injectie en cross-site scripting) behoren al jaren tot de meest voorkomende en meest schadelijke kwetsbaarheden in webapplicaties. Zonder invoervalidatie kan een aanvaller kwaadaardige code meesturen in een formulierveld, URL of API-aanroep. Zonder uitvoercodering kan die code vervolgens worden uitgevoerd in de browser van een andere gebruiker of in de database van de organisatie. Dit bouwblok vormt de eerste verdedigingslinie: het voorkomt dat onbetrouwbare data de applicatie kan misbruiken.

## 3. Wie heeft hiermee te maken?

- **Eindgebruiker** — merkt dit als duidelijke foutmeldingen bij ongeldige invoer, in plaats van onverklaarbaar gedrag
- **Ontwikkelteam** — implementeert validatie- en encodingregels in elke laag waar data binnenkomt of uitgaat
- **Security officer** — verifieert dat validatieregels volledig zijn en dat bekende aanvalsvectoren worden afgedekt
- **Product owner** — bepaalt welke invoer acceptabel is vanuit functioneel perspectief (welke tekens, lengtes, formaten)
- **Tester / QA** — test expliciet met ongeldige, kwaadaardige en grensgevallen van invoer

## 4. Waar zit dit in de applicatie?

Input validatie en output encoding zitten op **applicatieniveau**, op elke plek waar data de grens van de applicatie passeert. Aan de invoerkant: formulieren, API-endpoints, bestandsuploads, URL-parameters en headers. Aan de uitvoerkant: HTML-pagina's, API-responses, e-mails en exports. Validatie vindt plaats zo dicht mogelijk bij het punt van binnenkomst; encoding zo dicht mogelijk bij het punt van uitvoer.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bepalen welke invoer per veld en per API-endpoint geldig is (whitelisting boven blacklisting)
- **Bij bouw** — validatie- en encodingmechanismen implementeren in elke laag
- **Bij testen** — gericht testen op injectie-aanvallen, grenswaarden en onverwachte invoer
- **Bij wijzigingen** — elk nieuw invoerveld of nieuwe API-endpoint vereist nieuwe validatieregels
- **Doorlopend** — nieuwe aanvalstechnieken vereisen periodieke herziening van validatieregels

## 6. Hoe werkt dit?

Wanneer data de applicatie binnenkomt, wordt deze gecontroleerd tegen een set regels: klopt het formaat, de lengte, het type en de inhoud? Data die niet aan de regels voldoet, wordt geweigerd met een duidelijke foutmelding (via bouwblok B5). Data die wel geldig is, wordt verwerkt. Wanneer de applicatie vervolgens data teruggeeft — bijvoorbeeld op een webpagina of in een API-response — wordt deze gecodeerd op een manier die past bij de context. Zo wordt voorkomen dat data die eruitziet als code, ook als code wordt uitgevoerd.

## 7. Voor de techneut

### Schema-validatie
Gebruik schema-validatie (JSON Schema, XML Schema, OpenAPI) om de structuur van binnenkomende data af te dwingen. Valideer niet alleen individuele velden, maar ook de structuur als geheel: onverwachte velden worden geweigerd (strict mode), verplichte velden worden afgedwongen, en nesting-diepte wordt beperkt om denial-of-service te voorkomen.

### Invoervalidatie-strategie
Hanteer een whitelist-benadering: definieer wat geldig is, en wijs al het andere af. Valideer op meerdere niveaus:
- **Syntactisch** — voldoet de data aan het verwachte formaat (regex, type, lengte)?
- **Semantisch** — is de waarde logisch in de context (is het e-mailadres geldig, bestaat de verwijzing)?
- **Bedrijfsregels** — is de waarde toegestaan volgens de bedrijfslogica (is het bedrag binnen de limiet)?

### Contextafhankelijke output encoding
Gebruik de juiste encodingmethode afhankelijk van de context waarin de data wordt geplaatst:
- **HTML-context** — HTML entity encoding (`<` wordt `&lt;`)
- **JavaScript-context** — JavaScript string escaping
- **URL-context** — percent encoding
- **CSS-context** — CSS escaping
- **SQL-context** — geparametriseerde queries (geen string-concatenatie)

### Bestandsupload-validatie
Valideer uploads op meerdere kenmerken:
- Controleer het daadwerkelijke bestandstype (magic bytes), niet alleen de extensie
- Beperk bestandsgrootte en aantal uploads
- Sla uploads op buiten de webroot met een gegenereerde bestandsnaam
- Scan op malware voordat het bestand beschikbaar wordt gesteld
- Strip metadata (EXIF) waar mogelijk

### API request/response validatie
Valideer zowel inkomende requests als uitgaande responses tegen het API-schema. Response-validatie voorkomt dat de applicatie onbedoeld interne data lekt die niet in het schema is gedefinieerd. Gebruik content-type validatie om te voorkomen dat de applicatie onverwachte dataformaten verwerkt.

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.02 | Invoervalidatie — controleren en valideren van alle invoer |
| U/WA.04 | Uitvoerbeveiliging — veilige codering van alle uitvoer naar de gebruiker |
| B/WA.06 | Invoer- en uitvoerbehandeling — organisatorische richtlijnen voor omgang met data |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.14.2.5 | Beveiligde systeemontwikkelprincipes — validatie als onderdeel van secure-by-design |
| A.14.1.2 | Beveiligen van applicatieservices — bescherming tegen ongeautoriseerde wijziging van data |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **B5 — Error Handling** | Validatiefouten resulteren in gestructureerde foutresponses via B5. B5 bepaalt hoe ongeldige invoer aan de gebruiker wordt gecommuniceerd, inclusief welke details wel en niet worden getoond. |
| **C1 — Logging & Audit Trail** | Validatiefouten worden gelogd via C1, inclusief welke validatieregel is overtreden en vanuit welk IP-adres. Herhaalde validatiefouten kunnen wijzen op een aanvalspoging. |
| **A2 — Autorisatie** | Bestandsuploads en resources vereisen zowel validatie (B1) als autorisatiecontroles (A2). A2 bepaalt of de gebruiker het recht heeft om een bestand te uploaden; B1 bepaalt of het bestand zelf veilig is. |
