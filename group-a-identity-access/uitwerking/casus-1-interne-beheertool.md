# Casus 1 — Interne beheertool voor één organisatie

## Context

Een applicatie die alleen door medewerkers van de eigen organisatie wordt gebruikt, bijvoorbeeld een intern beheerportaal, een interne dashboardtoepassing of een lijn-of-business-applicatie. De organisatie heeft al een centrale werkplek-identiteit (typisch Microsoft 365 of Google Workspace) en wil geen tweede gebruikersadministratie onderhouden.

## Doelgroep

- **Primair**: medewerkers in loondienst, met een door de IT-afdeling beheerd account
- **Secundair**: externen met een gast-account in dezelfde IdP (inhuur, leveranciers)
- **Buiten scope**: klanten, burgers, anonieme bezoekers

## Eisen die doorwegen

- Single Sign-On met de bestaande werkplek-identiteit — opnieuw inloggen wordt niet geaccepteerd
- MFA wordt centraal afgedwongen (bijvoorbeeld via Conditional Access), niet per applicatie
- Lifecycle van accounts (in/uit dienst, rolwijziging) volgt automatisch uit de HR-bron via de IdP
- Laag beheerprofiel aan applicatiezijde: geen eigen wachtwoordopslag, geen eigen MFA-implementatie
- Auditbaarheid van inlogs via de centrale IdP, niet via applicatielogs

## Randvoorwaarden

- De organisatie heeft een werkende IdP met MFA-beleid en conditional access
- De applicatie kan moderne federatieprotocollen spreken (OIDC of SAML 2.0)
- Groepen/rollen uit de IdP kunnen als claim worden doorgegeven aan de applicatie voor autorisatiedoeleinden (zie A2)

## Relatie met andere bouwblokken

- **A2 — Autorisatie**: rollen en groepen komen mee als claims uit de IdP
- **A3 — Sessiemanagement**: sessielevensduur volgt het IdP-beleid
- **C1 — Logging & Audit Trail**: inlogevents komen primair uit de IdP-logs
