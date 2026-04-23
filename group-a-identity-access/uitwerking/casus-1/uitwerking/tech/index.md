# TECH — technische uitwerking Casus 1

Deze sectie bevat de concrete technische invulling van casus 1: welke componenten er zijn, hoe ze met elkaar praten, en welke stappen een team moet zetten om ze te bouwen en koppelen.

## Stack in deze casus

- **Frontend** — Vue 3 + Vite + TypeScript, gedraaid als SPA in de browser
- **Backend** — Node.js 20 + Fastify + TypeScript op Azure App Service, fungeert als Backend-for-Frontend (BFF) en handelt OIDC-authenticatie af
- **Database** — Azure SQL (Managed Instance of Database), benaderd met Entra-tokens van de ingelogde gebruiker
- **Identity Provider** — Entra ID (tenant `meerwijde.onmicrosoft.com`)
- **Platform** — Azure (App Service, Azure Front Door + WAF, Key Vault, Log Analytics, Managed Identity)

## Pagina's

- [Architectuur & communicatie](./architectuur) — diagrammen met proceslijnen en beschrijving van elke stap
- [Vue-frontend — implementatiestappen](./vue-frontend-stappen) — concrete taken voor het Vue-component
- [Backend (Node.js) — implementatiestappen](./backend-node-stappen) — concrete taken voor het Node.js-component

## Patroon: BFF (Backend-for-Frontend)

De Vue-SPA houdt **geen tokens** vast in de browser. In plaats daarvan wordt de backend de "vertrouwde partij" richting Entra ID: de backend voert de OIDC-flow uit, valideert de tokens, en zet richting de browser een versleutelde, `HttpOnly` sessiecookie. De Vue-app communiceert met het eigen backend-API via die cookie en hoeft zelf niets van MSAL, PKCE of token-refresh te weten. Voordelen: geen token-opslag in JavaScript-bereik (XSS-resistenter), vereenvoudigde frontend, en het hele CA- en sessiebeleid uit `04-conditional-access-en-mfa.md` en `06-sessie-en-tokens.md` blijft één-op-één van toepassing.
