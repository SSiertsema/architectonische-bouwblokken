# A1 — Authenticatie

## 1. Wat is dit bouwblok?

Dit bouwblok regelt de identiteitsverificatie: het vaststellen wie er toegang vraagt tot de applicatie. Het omvat alle mechanismen waarmee een gebruiker bewijst dat hij is wie hij zegt te zijn — van wachtwoorden en multi-factor authenticatie tot federatieve inlog via organisatie-eigen identiteitssystemen.

## 2. Waarom is dit nodig?

Zonder betrouwbare authenticatie kan iedereen zich voordoen als iemand anders. Een aanvaller die toegang krijgt zonder identiteitscontrole kan gegevens inzien, wijzigen of verwijderen zonder dat te herleiden is naar een persoon. Dit bouwblok is de voordeur van de applicatie: als die niet op slot zit, zijn alle andere beveiligingsmaatregelen zinloos.

## 3. Wie heeft hiermee te maken?

- **Eindgebruiker** — logt in en moet omgaan met wachtwoordeisen, MFA en eventueel federatieve inlog
- **Product owner** — weegt gebruiksgemak af tegen beveiligingseisen bij het inlogproces
- **Ontwikkelteam** — implementeert authenticatiemechanismen en integreert met identiteitsproviders
- **Beheerder / Operations** — beheert de identity provider, monitort mislukte inlogpogingen en blokkeert verdachte accounts
- **Security officer** — stelt het authenticatiebeleid vast (wachtwoordlengte, MFA-vereisten, lockout-drempels)
- **Auditor** — controleert of authenticatiemechanismen voldoen aan de gestelde eisen en standaarden

## 4. Waar zit dit in de applicatie?

Dit bouwblok zit op **applicatie- en infraniveau**. De inlogpagina en authenticatielogica zitten in de applicatie zelf, maar de identiteitsprovider (IdP) en federatieve koppelingen zijn infrastructuurcomponenten. Het authenticatiebeleid (wachtwoordeisen, MFA-verplichting) is een organisatorische beslissing.

## 5. Wanneer is dit relevant?

- **Bij projectstart** — keuze maken voor authenticatiemechanisme en identiteitsprovider
- **Bij ontwikkeling** — inlogflow implementeren inclusief foutafhandeling en brute-force bescherming
- **Bij ingebruikname** — configuratie van wachtwoordbeleid, MFA en eventuele federatieve koppelingen
- **Bij wijzigingen** — als gebruikersgroepen, authenticatie-eisen of identiteitsproviders veranderen
- **Doorlopend** — monitoren van mislukte inlogpogingen, bijwerken van beleid bij nieuwe dreigingen

## 6. Hoe werkt dit?

Een gebruiker identificeert zich (bijvoorbeeld met een e-mailadres) en bewijst vervolgens zijn identiteit met een of meer factoren: iets dat hij weet (wachtwoord), iets dat hij heeft (telefoon, hardware-token) of iets dat hij is (biometrie). Bij federatieve authenticatie wordt dit bewijs niet door de applicatie zelf gecontroleerd, maar door een vertrouwde externe partij (de identiteitsprovider van de organisatie). Na succesvolle authenticatie wordt een sessie aangemaakt en kan autorisatie plaatsvinden.

## 7. Voor de techneut

### Multi-factor authenticatie (MFA)
MFA wordt afgedwongen voor alle gebruikers met toegang tot gevoelige gegevens of beheerfuncties. Ondersteunde tweede factoren zijn minimaal TOTP (tijdsgebaseerde eenmalige codes) en WebAuthn/FIDO2 (hardware-tokens). SMS als tweede factor wordt afgeraden vanwege bekende kwetsbaarheden (SIM-swapping).

### Federatieve authenticatie
Voor organisatiegebruikers wordt federatieve authenticatie via SAML 2.0 of OpenID Connect (OIDC) ondersteund. De applicatie fungeert als Service Provider (SP) of Relying Party (RP) en vertrouwt op de Identity Provider (IdP) van de organisatie. Claims/attributen worden gevalideerd bij elke inlogsessie.

### Brute-force bescherming
Mislukte inlogpogingen worden bijgehouden per account en per IP-adres. Na een configureerbaar aantal mislukte pogingen wordt het account tijdelijk vergrendeld (progressive delay/lockout). Rate limiting op het inlog-endpoint voorkomt geautomatiseerde aanvallen. Alle mislukte pogingen worden gelogd voor detectie.

### Wachtwoordbeleid
Wachtwoorden worden gehashed opgeslagen met een modern algoritme (bcrypt, scrypt of Argon2) met voldoende work factor. Het beleid volgt actuele NCSC-richtlijnen: minimale lengte, geen verplichte complexiteitsregels die tot voorspelbare patronen leiden, en controle tegen lijsten van veelgebruikte en gelekte wachtwoorden.

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| U/WA.01 | Authenticatie — eisen aan het authenticatiemechanisme van de webapplicatie |
| B/WA.03 | Authenticatiemechanismen — beheer en configuratie van authenticatiemiddelen |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.9.2.1 | Registratie en afmelding van gebruikers |
| A.9.2.4 | Beheer van geheime authenticatie-informatie van gebruikers |
| A.9.4.2 | Beveiligde inlogprocedures |
| A.9.4.3 | Systeem voor wachtwoordbeheer |

### Forum Standaardisatie
| Standaard | Onderwerp |
|-----------|-----------|
| SAML 2.0 | Verplichte open standaard voor federatieve authenticatie waar van toepassing |
| OpenID Connect (OIDC) | Verplichte open standaard voor federatieve authenticatie waar van toepassing |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **A2 — Autorisatie** | Na authenticatie volgt autorisatie: pas als de identiteit vaststaat, kan bepaald worden wat de gebruiker mag doen. |
| **A3 — Sessiemanagement** | Na succesvolle authenticatie wordt een sessie aangemaakt. De sessie is het bewijs dat authenticatie heeft plaatsgevonden. |
| **B3 — Secrets Management** | Credentials (wachtwoordhashes, API-keys van IdP-koppelingen) worden veilig opgeslagen conform B3. |
| **C1 — Logging & Audit Trail** | Alle inlogpogingen (geslaagd en mislukt) worden gelogd voor detectie en auditdoeleinden. |
| **D4 — Rollen & Verantwoordelijkheden** | Bepaalt wie het authenticatiebeleid vaststelt, wie de IdP beheert en wie toegangsverzoeken beoordeelt. |
