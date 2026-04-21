# B5 — Error Handling

## 1. Wat is dit bouwblok?

Dit bouwblok regelt hoe een applicatie omgaat met fouten en onverwachte situaties. Het zorgt ervoor dat fouten op een gecontroleerde manier worden afgehandeld: de gebruiker krijgt een begrijpelijke melding, de techneut krijgt voldoende informatie om het probleem op te lossen, en er lekt geen gevoelige informatie naar buiten.

## 2. Waarom is dit nodig?

Zonder gestandaardiseerde foutafhandeling kunnen twee dingen misgaan. Ten eerste: technische details (zoals databasestructuren, interne paden of softwareversies) lekken naar de gebruiker of een aanvaller, wat misbruik vergemakkelijkt. Ten tweede: fouten verdwijnen stilzwijgend, waardoor problemen niet worden opgemerkt en niet kunnen worden opgelost. Dit bouwblok voorkomt informatielekken naar buiten en informatieverlies naar binnen.

## 3. Wie heeft hiermee te maken?

- **Eindgebruiker** — ziet een begrijpelijke foutmelding in plaats van een technische dump
- **Ontwikkelteam** — bouwt foutafhandeling in en ontvangt de technische details via logging
- **Beheerder / Operations** — gebruikt foutinformatie om storingen te diagnosticeren en op te lossen
- **Security officer** — controleert dat foutmeldingen geen gevoelige informatie prijsgeven
- **Product owner** — bepaalt hoe foutmeldingen naar de gebruiker worden gecommuniceerd

## 4. Waar zit dit in de applicatie?

Foutafhandeling zit op **applicatieniveau**, verspreid over alle lagen. Van de gebruikersinterface (wat de gebruiker ziet bij een fout), via de applicatielogica (hoe fouten worden opgevangen), tot de communicatie met externe systemen (hoe wordt omgegaan met onbereikbare diensten). Er is typisch een centrale foutafhandelaar die als vangnet fungeert voor alle onvoorziene fouten.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bepalen hoe foutmeldingen eruitzien en welke informatie ze wel en niet bevatten
- **Bij bouw** — foutafhandeling inbouwen in elke laag van de applicatie
- **Bij testen** — verifiëren dat foutpaden geen informatie lekken en dat fouten correct worden gelogd
- **Bij beheer** — foutmeldingen monitoren en trends signaleren
- **Doorlopend** — elke wijziging in de applicatie kan nieuwe foutpaden introduceren

## 6. Hoe werkt dit?

Wanneer er iets misgaat in de applicatie, wordt de fout opgevangen door een centraal mechanisme. Dit mechanisme doet drie dingen: het stuurt de volledige technische details naar de logging (bouwblok C1), het genereert een uniek referentienummer waarmee de fout later kan worden teruggevonden, en het toont de gebruiker een algemene melding met dat referentienummer — zonder technische details. Zo kan de gebruiker het probleem melden, kan de techneut het opzoeken, en kan een aanvaller er niets mee.

## 7. Voor de techneut

### Correlatie-ID's
Elke fout krijgt een uniek correlatie-ID (UUID) dat wordt meegegeven in de gebruikersfoutmelding, de logmelding en eventuele downstream-calls. Dit ID maakt het mogelijk om een enkele gebruikersmelding te herleiden naar alle gerelateerde logregels over meerdere services heen. Het correlatie-ID wordt bij voorkeur al bij binnenkomst van het request aangemaakt, niet pas bij de fout.

### Foutclassificatie
Fouten worden geclassificeerd in categorieën die bepalen hoe ze worden afgehandeld:
- **Client-fouten** (4xx) — ongeldige invoer, onvoldoende rechten. Gebruiker kan actie ondernemen
- **Server-fouten** (5xx) — onverwachte interne fouten. Gebruiker kan niets doen, operations moet acteren
- **Herstelbare fouten** — tijdelijke problemen (externe service onbereikbaar). Retry-logica mogelijk
- **Fatale fouten** — systeemintegriteit in gevaar. Applicatie moet veilig stoppen (fail-secure)

### Informatielekpreventie
In productieomgevingen wordt nooit getoond:
- Stack traces of exception details
- Database query's of connectiestrings
- Interne paden, hostnamen of IP-adressen
- Softwareversies of framework-informatie
- Gebruikersgegevens van andere gebruikers

### Gestructureerde foutresponses
API's gebruiken een gestandaardiseerd foutformaat (RFC 9457 Problem Details) met vaste velden: type, title, status, detail, instance. Dit voorkomt dat elke service een eigen foutformaat hanteert en maakt geautomatiseerde verwerking van fouten mogelijk.

### Fail-secure principe
Bij een onverwachte fout valt de applicatie terug naar een veilige toestand: toegang wordt geweigerd (niet verleend), transacties worden teruggedraaid (niet half uitgevoerd), en gevoelige data wordt niet zichtbaar. De applicatie faalt naar de meest restrictieve staat.

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.03 | Foutafhandeling — voorkomen van informatielekken via foutmeldingen |
| U/WA.04 | Uitvoerbeveiliging — gecontroleerde en veilige uitvoer naar de gebruiker |
| B/WA.07 | Configuratiebeheer — productieomgevingen tonen geen debug-informatie |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.14.2.1 | Beleid voor beveiligd ontwikkelen — foutafhandeling als onderdeel van secure development |
| A.14.1.2 | Beveiligen van applicatieservices — bescherming tegen informatielekken |
| A.12.1.4 | Scheiding van ontwikkel-, test- en productieomgevingen — verschil in foutdetail per omgeving |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **C1 — Logging & Audit Trail** | Foutafhandeling is een van de belangrijkste bronnen van logmeldingen. Elke afgehandelde fout wordt met volledige details naar C1 gestuurd. Het correlatie-ID dat in B5 wordt aangemaakt, is het verbindende element in C1. |
| **C2 — Monitoring & Alerting** | Foutpatronen (frequentie, type, ernst) worden door C2 bewaakt. Een plotselinge toename van fouten kan een incident signaleren. |
| **B1 — Input Validatie & Output Encoding** | Validatiefouten resulteren in gestructureerde foutresponses via B5. B5 bepaalt hoe validatiefouten aan de gebruiker worden gepresenteerd. |
| **B4 — Security Headers** | Headers zoals X-Content-Type-Options en Content-Security-Policy werken samen met foutpagina's om te voorkomen dat foutmeldingen worden misbruikt voor XSS of content-sniffing. |
| **A1 — Authenticatie / A2 — Autorisatie** | Authenticatie- en autorisatiefouten moeten zorgvuldig worden afgehandeld: de foutmelding mag niet onthullen of een account bestaat (user enumeration) of waarom toegang precies is geweigerd. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie verantwoordelijk is voor het definiëren van foutmeldingsbeleid en wie foutpatronen beoordeelt. |
