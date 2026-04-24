# Vue frontend — Keycloak

De Vue 3 SPA is **identiek** aan die van de Auth0-variant, omdat het BFF-patroon het CIAM volledig wegabstraheert van de browser. Zie `../variant-a-auth0/vue-frontend-stappen.md` voor de volledige frontend-implementatie. Deze pagina noemt alleen de verschillen.

## Verschillen ten opzichte van variant A

### 1. Geen

Letterlijk geen verschil in de Vue-code. De SPA praat met dezelfde BFF-endpoints (`/api/me`, `/api/me/consents`, `/api/me/devices`) en gebruikt dezelfde cookie. De BFF vertaalt naar Keycloak in plaats van Auth0.

### 2. Minor — branding en copy

- Keycloak's Universal-Login-equivalent heet "login theme". Pulso bouwt een eigen theme (FreeMarker + CSS) die visueel overeenkomt met de Auth0-Universal-Login-styling, zodat users geen verschil zien tussen prod (Auth0) en eventuele migratie (Keycloak).

### 3. Minor — redirect URL

- Signin-start URL blijft `/signin/start` (BFF-interne route)
- Onder water redirect de BFF naar `https://auth.pulso.com/realms/pulso-eu/protocol/openid-connect/auth?...` (Keycloak-pad) in plaats van Auth0
- Voor de frontend niet relevant

## Waarom zo?

Het BFF-patroon is bewust gekozen om CIAM-vervangbaarheid mogelijk te maken. Pulso's migratiepad van Auth0 → Keycloak (of omgekeerd) raakt uitsluitend het BFF + de CIAM-tenant, niet de Vue-code. Dit was een ontwerpbeslissing bij het opzetten van de web-stack en sluit aan op Pulso's "open standaarden boven vendor lock-in"-ambitie.

## Conclusie

Zie `../variant-a-auth0/vue-frontend-stappen.md` voor alle concrete stappen. Eén Vue-codebase dekt beide CIAM-varianten.
