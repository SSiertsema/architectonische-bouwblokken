# B4 — Security Headers

## 1. Wat is dit bouwblok?

Dit bouwblok regelt de HTTP-headers waarmee de applicatie browsers en andere clients instrueert om beveiligingsbeleid af te dwingen. Door de juiste headers mee te sturen, vertelt de server aan de browser welke inhoud mag worden geladen, hoe de verbinding moet worden beveiligd en welke interacties zijn toegestaan. Daarnaast omvat dit bouwblok de TLS-configuratie die de transportlaag beschermt.

## 2. Waarom is dit nodig?

Moderne browsers hebben ingebouwde beveiligingsmechanismen, maar deze worden pas geactiveerd wanneer de server de juiste instructies meestuurt. Zonder security headers staat de browser toe dat kwaadaardige scripts worden geladen, dat de pagina in een onzichtbaar frame wordt ingebed (clickjacking), of dat gevoelige data over een onversleutelde verbinding wordt verstuurd. Dit zijn geen theoretische risico's: ze worden actief misbruikt. Security headers zijn een relatief eenvoudige maatregel met een groot beschermend effect.

## 3. Wie heeft hiermee te maken?

- **Eindgebruiker** — profiteert van een veiligere browse-ervaring zonder dit te merken
- **Ontwikkelteam** — configureert headers in de applicatie of webserver en zorgt dat de applicatie correct functioneert binnen het afgedwongen beleid
- **Beheerder / Operations** — configureert TLS en headers op infrastructuurniveau (reverse proxy, load balancer)
- **Security officer** — bepaalt het gewenste headersbeleid en verifieert de naleving ervan
- **Tester / QA** — controleert of alle responses de vereiste headers bevatten en of de TLS-configuratie correct is

## 4. Waar zit dit in de applicatie?

Security headers zitten op het snijvlak van **infrastructuur en applicatie**. TLS-terminatie en basisheaders worden vaak geconfigureerd op infrastructuurniveau (reverse proxy of load balancer). Applicatiespecifieke headers zoals Content-Security-Policy worden in de applicatie zelf geconfigureerd, omdat ze afhankelijk zijn van de functionaliteit van de applicatie. Beide niveaus moeten op elkaar zijn afgestemd.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bepalen welk headerbeleid nodig is op basis van de functionaliteit (gebruikt de applicatie inline scripts, externe bronnen, frames?)
- **Bij bouw** — headers configureren en de applicatie laten werken binnen de beperkingen die het beleid oplegt
- **Bij deployment** — verifiëren dat headers correct worden meegestuurd in de productieomgeving
- **Bij testen** — geautomatiseerd controleren of alle responses de vereiste headers bevatten
- **Doorlopend** — nieuwe browserfuncties en standaarden vereisen periodieke herziening van het headerbeleid

## 6. Hoe werkt dit?

Bij elke response die de server naar de browser stuurt, worden extra instructies meegegeven in de vorm van HTTP-headers. Deze instructies vertellen de browser bijvoorbeeld: "laad alleen scripts van ons eigen domein", "sta niet toe dat deze pagina in een frame wordt getoond", of "gebruik altijd een versleutelde verbinding". De browser dwingt deze instructies vervolgens af. Daarnaast wordt de verbinding zelf beschermd via TLS, zodat data onderweg niet kan worden meegelezen of gemanipuleerd.

## 7. Voor de techneut

### Content-Security-Policy (CSP)
CSP is de krachtigste maar ook meest complexe security header. Het definieert per resourcetype (scripts, stijlen, afbeeldingen, fonts, frames) welke bronnen mogen worden geladen. Begin met een strikt beleid en verruim waar nodig:
- Vermijd `unsafe-inline` en `unsafe-eval` — gebruik nonce-based of hash-based CSP voor inline scripts
- Definieer `default-src 'none'` als basis en voeg per resourcetype expliciete bronnen toe
- Gebruik `report-uri` of `report-to` om schendingen te monitoren zonder direct te blokkeren (report-only modus)
- Implementeer CSP incrementeel: begin in report-only en schakel om naar enforce wanneer het beleid stabiel is

### HTTP Strict Transport Security (HSTS)
Verplicht browsers om uitsluitend via HTTPS te verbinden:
- Stel `max-age` in op minimaal één jaar (31536000 seconden)
- Voeg `includeSubDomains` toe om alle subdomeinen te dekken
- Overweeg HSTS preload-registratie voor bescherming bij het allereerste bezoek
- Zorg dat alle HTTP-endpoints redirecten naar HTTPS voordat HSTS wordt ingeschakeld

### Overige essentiële headers
| Header | Doel |
|--------|------|
| `X-Content-Type-Options: nosniff` | Voorkomt dat browsers het MIME-type raden, wat content-sniffing aanvallen blokkeert |
| `X-Frame-Options: DENY` | Voorkomt dat de pagina in een frame wordt geladen (clickjacking-bescherming) |
| `Referrer-Policy: strict-origin-when-cross-origin` | Beperkt welke referrer-informatie wordt gedeeld met externe sites |
| `Permissions-Policy` | Beperkt toegang tot browserfuncties (camera, microfoon, geolocatie) |
| `X-XSS-Protection: 0` | Schakelt de onbetrouwbare XSS-filter van oudere browsers uit (CSP is de vervanging) |

### Cross-Origin Resource Sharing (CORS)
Configureer CORS zo restrictief mogelijk:
- Definieer een expliciete allowlist van toegestane origins — gebruik nooit een wildcard (`*`) voor geauthenticeerde endpoints
- Beperk toegestane methoden en headers tot wat daadwerkelijk nodig is
- Stel `Access-Control-Max-Age` in om preflight-requests te cachen
- Sta `Access-Control-Allow-Credentials` alleen toe in combinatie met specifieke origins

### TLS-configuratie
Configureer TLS volgens de richtlijnen van het NCSC en Forum Standaardisatie:
- Ondersteun uitsluitend TLS 1.2 en 1.3 — schakel oudere versies uit
- Gebruik sterke cipher suites met forward secrecy
- Configureer OCSP stapling voor efficiënte certificaatvalidatie
- Implementeer CAA DNS-records om te beperken welke certificaatautoriteiten certificaten mogen uitgeven

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.08 | HTTP-headers — beveiligingsheaders toepassen op alle responses |
| B/WA.10 | Transportbeveiliging/TLS — versleutelde communicatie tussen client en server |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.13.1.1 | Beheersmaatregelen voor netwerken — bescherming van informatie in netwerken en netwerkdiensten |
| A.14.1.2 | Beveiligen van applicatieservices — bescherming van data in transit en tegen ongeautoriseerde toegang |

### Forum Standaardisatie
| Standaard | Status | Toelichting |
|-----------|--------|-------------|
| TLS | Verplicht (pas-toe-of-leg-uit) | Minimaal TLS 1.2, bij voorkeur TLS 1.3 voor alle webverkeer |
| HTTPS | Verplicht (pas-toe-of-leg-uit) | Alle webapplicaties moeten uitsluitend via HTTPS beschikbaar zijn |
| DNSSEC | Aanbevolen | Bescherming tegen DNS-manipulatie; ondersteunt de integriteit van HTTPS |
| DMARC/DKIM/SPF | Waar van toepassing | E-mailauthenticatie wanneer de applicatie e-mail verstuurt vanuit het domein |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **A3 — Sessie- en Cookiebeheer** | Security headers en cookiebeleid versterken elkaar. Cookie-attributen zoals `Secure`, `HttpOnly` en `SameSite` zorgen dat sessiecookies alleen via HTTPS worden verstuurd en niet via JavaScript toegankelijk zijn. HSTS ondersteunt het `Secure`-attribuut door HTTPS af te dwingen. |
| **B5 — Error Handling** | Foutpagina's moeten dezelfde security headers bevatten als reguliere responses. Een foutpagina zonder CSP of X-Content-Type-Options kan een aanvalsvector worden, zelfs als alle andere pagina's correct zijn geconfigureerd. |
| **D1 — Standaarden & Richtlijnen** | D1 bepaalt welke TLS-versies en cryptografische standaarden van toepassing zijn op de organisatie. Security headers en TLS-configuratie worden geconfigureerd conform de in D1 vastgestelde standaarden, waaronder de eisen van Forum Standaardisatie. |
