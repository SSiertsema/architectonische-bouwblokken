# Casus 2 — B2B SaaS met federatie naar klant-IdP's

## Context

Een SaaS-product dat wordt verkocht aan zakelijke afnemers. Elke klantorganisatie wil haar eigen medewerkers laten inloggen via haar eigen identiteitsprovider (Entra ID, Okta, Google Workspace, Ping, ADFS). De SaaS-leverancier onderhoudt zelf geen wachtwoorden voor deze gebruikers en fungeert voor iedere klant als Service Provider / Relying Party.

## Doelgroep

- **Primair**: medewerkers van klantorganisaties, beheerd in de IdP van die klant
- **Secundair**: beheerders aan leverancierszijde (support, onboarding) — dezen gebruiken een aparte, strenger beveiligde inlogroute
- **Buiten scope**: eindconsumenten

## Eisen die doorwegen

- Ondersteuning voor meerdere IdP-typen en meerdere instanties per tenant (SAML 2.0 én OIDC)
- Per klant een eigen federatieconfiguratie (metadata, certificaten, claim-mapping)
- SCIM 2.0-provisioning voor geautomatiseerde user lifecycle (aanmaken, muteren, deactiveren)
- "Enterprise SSO" is vaak een contractuele voorwaarde en soms een prijsplan-gate
- Tenant-isolatie: gebruikers van klant A kunnen nooit terechtkomen in de omgeving van klant B
- Hersteltijd bij verlopen certificaten of IdP-wijzigingen moet laag zijn (self-service door klantbeheerder)

## Randvoorwaarden

- Elk tenant heeft een aanwijsbare klantbeheerder die de federatie aan klantzijde kan configureren
- Certificaatrotatie en metadata-refresh zijn geautomatiseerd of self-service
- Just-in-time provisioning is acceptabel als SCIM nog niet beschikbaar is bij een klant

## Relatie met andere bouwblokken

- **A2 — Autorisatie**: rol- en groep-claims uit de klant-IdP worden gemapt op applicatierollen per tenant
- **A3 — Sessiemanagement**: sessies zijn tenant-gebonden; Single Logout propageert naar de juiste IdP
- **B3 — Secrets Management**: federatie-certificaten en client secrets per tenant apart beheerd
- **C1 — Logging & Audit Trail**: auditlogs bevatten tenant-identifier bij elk inlogevent
