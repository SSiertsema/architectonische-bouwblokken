# Backend (Node.js) — implementatiestappen

Stappenplan voor de backend in het BFF-patroon uit casus 1. Uitgangspunt: Node.js fungeert als Backend-for-Frontend. De backend handelt de OIDC-flow met Entra ID af, beheert server-side sessies voor de Vue-SPA, en verzorgt toegang tot Azure SQL door het access token van de ingelogde gebruiker rechtstreeks mee te geven aan de database-verbinding. Daardoor ziet Azure SQL de werkelijke Entra-identiteit.

> **Scope.** Dit bestand beschrijft uitsluitend het authenticatie-aspect van de backend: hoe de OIDC-flow verloopt, hoe de sessie wordt vastgelegd, hoe de user-identity richting Azure SQL wordt doorgegeven. Wat de database of de applicatie vervolgens doet met die identiteit — welke rijen zichtbaar zijn, welke acties zijn toegestaan — valt onder **A2 — Autorisatie** en wordt daar uitgewerkt.

## 0. Voorwaarden aan de omgeving

Voordat het backend-werk start moeten deze zaken in Azure staan:

| Onderdeel | Eis |
|-----------|-----|
| Entra-app-registratie | Single-tenant, redirect-URI `/signin-oidc`, clientcertificaat via Key Vault |
| API permissions (delegated) | `Microsoft Graph → User.Read` **en** `Azure SQL Database → user_impersonation`, beide met admin consent |
| Key Vault | Bevat `beheertool-client-cert` (OIDC-clientauth) en `session-encryption-key` (32 bytes) |
| App Service | Linux, Node 20, system-assigned managed identity |
| Key Vault-rollen voor de MI | `Key Vault Certificate User` + `Key Vault Secrets User` |
| Azure SQL | Entra admin ingesteld, database bereikbaar voor Entra-principals |
| Netwerken | Private endpoint van App Service → SQL; Front Door + WAF voor inkomend verkeer |

## 1. Projectopzet

```bash
mkdir beheertool-backend && cd beheertool-backend
npm init -y
npm install fastify @fastify/secure-session \
            openid-client mssql pino \
            @azure/identity @azure/keyvault-certificates @azure/keyvault-secrets
npm install -D typescript tsx vitest @types/node
npx tsc --init --target es2022 --module nodenext --moduleResolution nodenext --strict
```

Folder-indeling:

```
src/
├── index.ts              # Fastify bootstrap
├── config.ts             # env + Key Vault loading
├── plugins/
│   ├── oidc.ts           # openid-client + signin-routes
│   ├── session.ts        # secure-session
│   └── sql.ts            # per-request Azure SQL-verbinding
├── auth/
│   ├── tokens.ts         # SQL-token refresh-logica
│   └── keyvault.ts       # certificaat + sleutel ophalen
└── routes/
    └── me.ts
```

## 2. Configuratie en Key Vault

Niets geheims in app-settings. Alles komt uit Key Vault via de system-assigned managed identity.

```ts
// src/auth/keyvault.ts
import { DefaultAzureCredential } from '@azure/identity'
import { CertificateClient } from '@azure/keyvault-certificates'
import { SecretClient } from '@azure/keyvault-secrets'

const cred = new DefaultAzureCredential()
const vaultUri = process.env.KEY_VAULT_URI!

export const certClient = new CertificateClient(vaultUri, cred)
export const secretClient = new SecretClient(vaultUri, cred)

export async function loadClientCertificate() {
  const pem = await secretClient.getSecret('beheertool-client-cert')
  return pem.value! // PEM-string met cert + key
}

export async function loadSessionKey(): Promise<Buffer> {
  const secret = await secretClient.getSecret('session-encryption-key')
  return Buffer.from(secret.value!, 'base64')
}
```

```ts
// src/config.ts
export const config = {
  tenantId:      process.env.AZURE_TENANT_ID!,
  clientId:      process.env.AZURE_CLIENT_ID!,
  redirectUri:   process.env.OIDC_REDIRECT_URI!,      // https://beheer.meerwijde.nl/signin-oidc
  postLogoutUri: process.env.OIDC_POST_LOGOUT_URI!,
  sqlServer:     process.env.SQL_SERVER!,             // meerwijde-sql.database.windows.net
  sqlDatabase:   process.env.SQL_DATABASE!,           // beheertool
}
```

## 3. Fastify-server opzetten

`src/index.ts`:

```ts
import Fastify from 'fastify'
import sessionPlugin from './plugins/session.js'
import oidcPlugin from './plugins/oidc.js'
import meRoutes from './routes/me.js'

const app = Fastify({
  logger: { level: 'info' },
  trustProxy: true, // App Service zit achter Front Door
})

await app.register(sessionPlugin)
await app.register(oidcPlugin)
await app.register(meRoutes, { prefix: '/api' })

await app.listen({ port: Number(process.env.PORT) || 5000, host: '0.0.0.0' })
```

Logs gaan in JSON via `pino` → stdout → Log Analytics (configureren via App Service diagnostic settings, zie `../07-compliance-en-auditlogging.md`).

## 4. OIDC-client initialiseren

```ts
// src/plugins/oidc.ts (deel 1 — client opzetten)
import { Issuer, generators } from 'openid-client'
import { config } from '../config.js'
import { loadClientCertificate } from '../auth/keyvault.js'

const issuer = await Issuer.discover(
  `https://login.microsoftonline.com/${config.tenantId}/v2.0`
)

const clientCertPem = await loadClientCertificate()

export const oidcClient = new issuer.Client(
  {
    client_id: config.clientId,
    redirect_uris: [config.redirectUri],
    post_logout_redirect_uris: [config.postLogoutUri],
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'RS256',
    response_types: ['code'],
  },
  { keys: [pemToJwk(clientCertPem)] } // eigen helper met 'jose' of 'node-jose'
)
```

`private_key_jwt` betekent dat de backend bij elke token-request een JWT ondertekent met het certificaat. Geen shared secret, geen geheim in runtime.

## 5. Sessie

```ts
// src/plugins/session.ts
import fp from 'fastify-plugin'
import secureSession from '@fastify/secure-session'
import { loadSessionKey } from '../auth/keyvault.js'

export default fp(async (app) => {
  await app.register(secureSession, {
    key: await loadSessionKey(),
    cookieName: '__Host-beheer_session',
    cookie: {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 uur — gelijk aan sign-in frequency in CA
    },
  })
})
```

Waarom deze attributen: `__Host-` bindt de cookie aan exact deze origin over HTTPS zonder `Domain`; `HttpOnly` weert JavaScript-inzage; de max-age koppelt de cookie-levensduur aan het Conditional Access-beleid uit `../04-conditional-access-en-mfa.md`.

## 6. Sign-in, callback en sign-out

```ts
// src/plugins/oidc.ts (deel 2 — routes)
export const oidcRoutes: FastifyPluginAsync = async (app) => {
  app.get('/signin', async (req, reply) => {
    const code_verifier = generators.codeVerifier()
    const state = generators.state()
    const nonce = generators.nonce()
    const returnUrl = (req.query as any).returnUrl ?? '/'

    req.session.set('pkce', { code_verifier, state, nonce, returnUrl })

    const url = oidcClient.authorizationUrl({
      scope: 'openid profile email offline_access https://database.windows.net/user_impersonation',
      code_challenge: generators.codeChallenge(code_verifier),
      code_challenge_method: 'S256',
      state,
      nonce,
    })
    return reply.redirect(url)
  })

  app.get('/signin-oidc', async (req, reply) => {
    const stored = req.session.get('pkce') as any
    const params = oidcClient.callbackParams(req.raw)
    const tokenSet = await oidcClient.callback(config.redirectUri, params, {
      code_verifier: stored.code_verifier,
      state: stored.state,
      nonce: stored.nonce,
    })

    const claims = tokenSet.claims()
    req.session.set('user', {
      oid: claims.oid,
      name: claims.name,
      preferredUsername: claims.preferred_username,
    })
    req.session.set('tokens', {
      accessToken:  tokenSet.access_token,   // audience = Azure SQL
      refreshToken: tokenSet.refresh_token,
      expiresAt:    tokenSet.expires_at! * 1000,
    })
    return reply.redirect(stored.returnUrl ?? '/')
  })

  app.get('/signout', async (req, reply) => {
    req.session.delete()
    return reply.redirect(oidcClient.endSessionUrl({
      post_logout_redirect_uri: config.postLogoutUri,
    }))
  })
}
```

De extra scope `https://database.windows.net/user_impersonation` is de sleutel: Entra levert in dezelfde token-response al een access token met audience SQL. Geen aparte flow nodig.

## 7. Access token voor SQL — levenscyclus

Het SQL-token heeft een levensduur van ±1 uur. Voor langere sessies (tot 8 uur) moet de backend vernieuwen:

```ts
// src/auth/tokens.ts
export async function getSqlAccessToken(req: FastifyRequest): Promise<string> {
  const tokens = req.session.get('tokens') as TokenSet
  if (!tokens) throw new Error('no_session')

  const margin = 60_000 // 1 minuut marge
  if (tokens.expiresAt - Date.now() > margin) return tokens.accessToken

  try {
    const refreshed = await oidcClient.refresh(tokens.refreshToken, {
      exchangeBody: {
        scope: 'https://database.windows.net/user_impersonation offline_access',
      },
    })
    req.session.set('tokens', {
      accessToken:  refreshed.access_token!,
      refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
      expiresAt:    refreshed.expires_at! * 1000,
    })
    return refreshed.access_token!
  } catch (err) {
    // CAE, wachtwoordwijziging, deactivatie — sessie is dood
    req.session.delete()
    throw err
  }
}
```

## 8. Databaseverbinding met het user-token

```ts
// src/plugins/sql.ts
import sql from 'mssql'
import { config } from '../config.js'
import { getSqlAccessToken } from '../auth/tokens.js'

export async function getConnection(req: FastifyRequest): Promise<sql.ConnectionPool> {
  const token = await getSqlAccessToken(req)
  return new sql.ConnectionPool({
    server:   config.sqlServer,
    database: config.sqlDatabase,
    options:  { encrypt: true, trustServerCertificate: false },
    authentication: {
      type: 'azure-active-directory-access-token',
      options: { token },
    },
    pool: { min: 0, max: 4, idleTimeoutMillis: 30_000 },
  }).connect()
}
```

Met deze verbinding authenticeert de **gebruiker** bij Azure SQL — niet de backend. SQL kent de Entra-identiteit van de ingelogde persoon en kan daarmee het volle scala aan database-autorisatie toepassen. Welke database-rollen, permissies, Row-Level Security of andere autorisatiemechanismen ingezet worden, is ontwerp in **A2 — Autorisatie**; deze laag levert alleen de identiteit.

Verbindingsstrategie: start met **pool per request** (eenvoudig; 5–20 ms overhead). Bij hoger volume is een **pool per sessie** met LRU-cache op `oid` + verval bij token-expiry een natuurlijke volgende stap. Geen authenticatie-keuze, wel een performance-tuning.

## 9. API-endpoints

```ts
// src/routes/me.ts
export default async function (app: FastifyInstance) {
  app.get('/me', async (req) => {
    const user = req.session.get('user')
    if (!user) throw app.httpErrors.unauthorized('auth_required')
    return user
  })
}
```

`/api/me` is het enige endpoint dat strikt bij A1 hoort: het retourneert de geauthenticeerde identiteit. Alle overige `/api/*`-endpoints hebben gemeen dat ze (a) een geldige sessie vereisen, en (b) via `getConnection(req)` met het user-token verbinden naar SQL. De invulling van die endpoints valt onder de functionele applicatie-uitwerking.

## 10. Ontwikkelcheck

Vooraf aan opleveren:

- [ ] Na eerste login zet `/signin-oidc` een `__Host-beheer_session`-cookie met `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] `/api/me` retourneert 401 zonder cookie en 200 met cookie
- [ ] Een testquery tegen Azure SQL via de backend gebruikt het access token van de ingelogde gebruiker (controle: `SELECT SUSER_NAME()` geeft de UPN van de inlogger terug)
- [ ] Een query mislukt (SQL login failed) als de scope `https://database.windows.net/user_impersonation` ontbrak bij authorize — controle dat de juiste scope wordt gevraagd
- [ ] Token-refresh werkt: na 1 uur 5 minuten levert een databaseverzoek nog data (dankzij `offline_access`)
- [ ] Revocatie werkt: na `Revoke-MgUserSignInSession` resulteert het eerstvolgende verzoek in een 401 binnen enkele minuten (CAE + refresh-fout)
- [ ] Geen secrets in code, app-settings, of logs; clientcertificaat en session-sleutel komen uit Key Vault
- [ ] Logs bevatten `oid`, `request_id`, `statusCode`, nooit tokens of cookiewaarden

## 11. Teststrategie

- **Unit** (Vitest): token-cache-logica, sessie-serialisatie, claim-mapping, PEM→JWK-helper
- **Integratie** (testcontainer of acceptatie-tenant): token-refresh-flow, SQL-verbinding met user-token
- **E2E** (Playwright): volledige flow met een testaccount dat via een gerichte Conditional Access-uitzondering is vrijgesteld van interactieve MFA. De uitzondering wordt gedocumenteerd en periodiek gereviewd.

## Aanvullende beveiliging buiten A1-scope

- **Autorisatie in SQL en in de applicatie** — database-rollen, Row-Level Security, endpoint-autorisatie: **A2 — Autorisatie**
- **CSRF-bescherming** — sessies beschermen tegen cross-site misbruik: **A3 — Sessiemanagement** en **B — Application Hardening**
- **Security headers** (CSP, HSTS, etc.) — **B4 — Security Headers**
