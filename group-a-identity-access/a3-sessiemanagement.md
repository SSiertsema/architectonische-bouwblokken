# A3 — Sessiemanagement

## 1. Wat is dit bouwblok?

Dit bouwblok regelt het beheer van gebruikerssessies na het inloggen: hoe lang een sessie geldig blijft, hoe de sessie wordt beschermd tegen misbruik en hoe deze correct wordt beëindigd. Het zorgt ervoor dat de "ingelogde staat" van een gebruiker veilig en beheersbaar is gedurende het gebruik van de applicatie.

## 2. Waarom is dit nodig?

Zonder goed sessiemanagement kan een aanvaller een actieve sessie overnemen en zich voordoen als de ingelogde gebruiker — zonder het wachtwoord te kennen. Sessies die niet verlopen blijven bruikbaar op onbeheerde werkplekken. Slecht beveiligde sessietokens kunnen worden onderschept of voorspeld. Dit bouwblok beschermt de verbinding tussen de gebruiker en de applicatie nadat authenticatie heeft plaatsgevonden.

## 3. Wie heeft hiermee te maken?

- **Eindgebruiker** — ervaart sessietimeouts, herauthenticatie en uitlogfunctionaliteit
- **Product owner** — weegt gebruiksgemak (sessieduur) af tegen beveiligingsrisico's
- **Ontwikkelteam** — implementeert sessiebeheer, cookie-configuratie en tokenafhandeling
- **Beheerder / Operations** — configureert sessietimeouts en monitort actieve sessies
- **Security officer** — stelt eisen aan sessieduur, cookie-attributen en tokenbeveiliging
- **Auditor** — controleert of sessiemechanismen voldoen aan de gestelde beveiligingseisen

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit primair op **applicatieniveau**: de sessielogica, tokenuitgifte en cookie-instellingen zijn onderdeel van de applicatie of het applicatieframework. Op **infraniveau** spelen load balancers en reverse proxies een rol bij het correct doorsturen van sessies. Het sessiebeleid (maximale duur, herauthenticatie-eisen) is een **organisatorische** beslissing.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — keuze maken voor sessiemechanisme (server-side sessies, JWT, of hybride)
- **Bij ontwikkeling** — implementatie van sessiecreatie, -validatie, -vernieuwing en -beëindiging
- **Bij ingebruikname** — configuratie van sessietimeouts, cookie-attributen en tokenlevensduur
- **Bij wijzigingen** — als de applicatiearchitectuur wijzigt (bijvoorbeeld overgang naar microservices)
- **Doorlopend** — monitoren van sessie-gerelateerde incidenten en bijstellen van beleid

## 6. Hoe werkt dit?

Na succesvolle authenticatie maakt de applicatie een sessie aan: een uniek, onvoorspelbaar token dat de gebruiker identificeert bij vervolgverzoeken. Dit token wordt veilig opgeslagen in de browser (als cookie met beveiligingsattributen) en bij elk verzoek meegestuurd. De applicatie controleert bij elk verzoek of de sessie nog geldig is. Na een periode van inactiviteit of na een maximale sessieduur verloopt de sessie en moet de gebruiker opnieuw inloggen. Bij uitloggen wordt de sessie direct ongeldig gemaakt.

## 7. Voor de techneut

### Token lifecycle
Sessietokens worden gegenereerd met een cryptografisch veilige random generator (minimaal 128 bits entropie). Tokens hebben een beperkte levensduur: een idle timeout (na inactiviteit) en een absolute timeout (maximale sessieduur ongeacht activiteit). Bij gevoelige acties (wachtwoord wijzigen, betalingen) wordt herauthenticatie afgedwongen, ook binnen een actieve sessie.

### Cookie-attributen
Sessiecookies worden geconfigureerd met de volgende attributen:
- **Secure** — cookie wordt alleen via HTTPS verstuurd
- **HttpOnly** — cookie is niet toegankelijk via JavaScript (bescherming tegen XSS)
- **SameSite=Strict of Lax** — bescherming tegen Cross-Site Request Forgery (CSRF)
- **Path** — beperkt tot het relevante applicatiepad
- **Domein** — zo restrictief mogelijk ingesteld

### Session fixation preventie
Bij elke succesvolle authenticatie wordt een nieuw sessietoken gegenereerd en het oude ongeldig gemaakt. Dit voorkomt session fixation-aanvallen waarbij een aanvaller vooraf een sessie-ID injecteert en wacht tot het slachtoffer hierop inlogt.

### Server-side sessieopslag
Sessiegegevens worden server-side opgeslagen (in-memory, database of gedistribueerde cache). Het sessietoken aan de client-zijde is slechts een referentie, geen drager van sessiedata. Bij gebruik van JWT's als sessietoken wordt een denylist bijgehouden voor vroegtijdige invalidatie (uitloggen, account blokkade).

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.01 | Sessies — eisen aan sessiebeheer binnen de webapplicatie |
| B/WA.05 | Sessiebeheer — beheer en configuratie van sessiebeveiliging |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.9.4.2 | Beveiligde inlogprocedures — het sessie-aspect van inloggen en sessiebeëindiging |
| A.14.1.2 | Beveiligen van applicatieservices op openbare netwerken — bescherming van sessiegegevens in transit |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **A1 — Authenticatie** | Een sessie wordt aangemaakt na succesvolle authenticatie. De sessie is het bewijs dat de gebruiker zich heeft geïdentificeerd. |
| **B4 — Security Headers** | Cookie-attributen (Secure, HttpOnly, SameSite) worden mede afgedwongen via security headers in de HTTP-respons. |
| **C1 — Logging & Audit Trail** | Sessie-events (aanmaken, verlopen, uitloggen, ongeldig verklaren) worden gelogd voor detectie en audit. |
| **B5 — Foutafhandeling** | Bij sessie-expiry wordt de gebruiker correct geïnformeerd en doorgestuurd naar het inlogscherm, zonder technische details prijs te geven. |
