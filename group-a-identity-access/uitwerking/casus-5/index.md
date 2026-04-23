# Casus 5 — Consumentenproduct (CIAM)

## Context

Een commerciële applicatie voor eindconsumenten, bijvoorbeeld een webshop, een mediadienst, een fitness-app of een fintech-product. Gebruikers registreren zichzelf en zijn geen onderdeel van een organisatie. De leverancier beheert de gehele gebruikerslevenscyclus zelf: registratie, inlog, wachtwoordherstel, accountverwijdering.

## Doelgroep

- **Primair**: zelf-registrerende particulieren, wereldwijd of binnen een bepaald afzetgebied
- **Secundair**: terugkerende gebruikers op meerdere devices (web, iOS, Android)
- **Uitbreiding**: gebruikers die willen inloggen met een bestaand identiteitsaccount (Google, Apple, Facebook, Microsoft)
- **Buiten scope**: zakelijke afnemers met federatie-eisen — die horen bij Casus 2

## Eisen die doorwegen

- **Zelfregistratie**: volledig self-service, zonder handmatige goedkeuring; bounce- en fraudebeperking bij signup
- **Inlogmethoden**: e-mail/wachtwoord, social login, en in toenemende mate passkeys (WebAuthn) als primaire of enige methode
- **Accountherstel**: wachtwoord vergeten, e-mail gewijzigd, device kwijt — must-have flows die veilig én laagdrempelig zijn
- **Progressive profiling**: niet alle gegevens bij registratie uitvragen, maar gespreid in de customer journey
- **Consent en privacy**: AVG-conforme toestemmingsregistratie, recht op inzage, recht op verwijdering
- **Schaal en kosten**: kostenmodel per Monthly Active User is vaak dominant in de total cost of ownership
- **Fraude- en misbruikpreventie**: bot-registraties, credential stuffing, account takeover — hoger volume dan in B2B-casussen
- **Merkbeleving**: de inlogschermen zijn onderdeel van de product-UX en moeten in huisstijl

## Randvoorwaarden

- Geen verplichting tot gebruik van overheidsstandaarden (DigiD/eHerkenning), tenzij het product een gereguleerde dienst is (zorg, financiële sector, gokken)
- Als de dienst onder sectorregulering valt (PSD2, DSA, KYC/AML, NIS2), gelden aanvullende eisen aan authenticatiesterkte en audit
- Mobiele apps vereisen aparte flows (OAuth 2.0 met PKCE, biometrische unlock, refresh tokens)

## Relatie met andere bouwblokken

- **A2 — Autorisatie**: veelal lichte autorisatie (eigenaar van eigen data) plus rolscheiding voor support/beheer
- **A3 — Sessiemanagement**: lange sessies met refresh tokens; step-up voor gevoelige acties
- **B3 — Secrets Management**: wachtwoordhashes en API-keys van social providers veilig opgeslagen
- **C1 — Logging & Audit Trail**: registratie, inlog en accountmutaties worden gelogd voor fraudedetectie en AVG-verantwoording
- **C2 — Monitoring & Alerting**: anomaliedetectie op inlogpatronen (geo, snelheid, device)
