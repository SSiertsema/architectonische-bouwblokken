# Backend Node.js (BFF) — Auth0

Node.js 20 + Fastify + TypeScript. De BFF is het vertrouwde eindpunt richting Auth0: het voert de OIDC-flow uit, beheert de sessie, en vertaalt frontend-API-calls naar backend-diensten.

## Packages

```
fastify                                  # server
@fastify/cookie @fastify/session         # cookie + session middleware
@fastify/secure-session                  # encrypted cookie sessions
@fastify/helmet                          # security headers
openid-client                            # OIDC RP voor Auth0
jose                                     # JWT validation (extra verificatie waar nodig)
pino                                     # logging
ioredis                                  # sessie- en cache-store
```

`openid-client` is de Node OIDC-referentiebibliotheek; het werkt tegen elk conformant OpenID Provider (Auth0, Keycloak, Cognito, ...) — Variant B-implementatie hergebruikt het.

## Project-layout

```
src/
├── server.ts                  # fastify bootstrap
├── config.ts                  # env + secrets
├── lib/
│   ├── oidc.ts                # openid-client setup
│   ├── session.ts             # encrypted session helpers
│   ├── mgmt.ts                # Auth0 Management API client
│   └── risk.ts                # risk-signals publisher
├── routes/
│   ├── signin.ts              # /signin/start, /signin/callback, /signin/stepup
│   ├── signout.ts             # /signout + federated logout
│   ├── me.ts                  # /me, /me/consents, /me/devices
│   └── webhooks.ts            # /webhooks/auth0-event
├── middleware/
│   ├── require-session.ts
│   └── require-acr.ts
└── types.ts
```

## OIDC-setup

```typescript
// src/lib/oidc.ts
import { Issuer, generators, Client } from "openid-client";
import { config } from "../config";

let client: Client;

export async function getOidcClient(): Promise<Client> {
  if (client) return client;
  const issuer = await Issuer.discover(`https://${config.auth0Domain}/`);
  client = new issuer.Client({
    client_id: config.auth0ClientId,
    client_secret: config.auth0ClientSecret,
    redirect_uris: [`${config.appBaseUrl}/signin/callback`],
    post_logout_redirect_uris: [`${config.appBaseUrl}/`],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_basic"
  });
  return client;
}

export function newPkce() {
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  const state = generators.state();
  const nonce = generators.nonce();
  return { code_verifier, code_challenge, state, nonce };
}
```

## Signin-routes

```typescript
// src/routes/signin.ts
import { FastifyPluginAsync } from "fastify";
import { getOidcClient, newPkce } from "../lib/oidc";

export const signinRoutes: FastifyPluginAsync = async (app) => {
  app.get("/signin/start", async (req, reply) => {
    const oidc = await getOidcClient();
    const { code_verifier, code_challenge, state, nonce } = newPkce();

    req.session.set("pkce", { code_verifier, state, nonce });

    const authUrl = oidc.authorizationUrl({
      scope: "openid profile email offline_access",
      code_challenge,
      code_challenge_method: "S256",
      state,
      nonce,
      audience: "https://api.pulso.com/"
    });

    return reply.redirect(authUrl);
  });

  app.get("/signin/callback", async (req, reply) => {
    const oidc = await getOidcClient();
    const pkce = req.session.get("pkce");
    if (!pkce) return reply.status(400).send({ error: "no_pkce" });

    const params = oidc.callbackParams(req.raw);
    const tokenSet = await oidc.callback(
      `${config.appBaseUrl}/signin/callback`,
      params,
      { code_verifier: pkce.code_verifier, state: pkce.state, nonce: pkce.nonce }
    );

    req.session.set("sub", tokenSet.claims().sub);
    req.session.set("email", tokenSet.claims().email);
    req.session.set("acr", tokenSet.claims().acr);
    req.session.set("issued_at", tokenSet.claims().iat);
    req.session.set("refresh_token", tokenSet.refresh_token);

    return reply.redirect("/");
  });

  app.get("/signin/stepup", async (req, reply) => {
    const oidc = await getOidcClient();
    const { code_verifier, code_challenge, state, nonce } = newPkce();
    const acr = (req.query as any).acr;

    req.session.set("pkce", { code_verifier, state, nonce });

    const authUrl = oidc.authorizationUrl({
      scope: "openid profile email",
      code_challenge,
      code_challenge_method: "S256",
      state,
      nonce,
      prompt: "login",
      max_age: 0,
      acr_values: acr
    });

    return reply.redirect(authUrl);
  });
};
```

## Sessie-opslag

Secure session is een **encrypted cookie** (niet een session-ID). Minimaal:

```typescript
// src/server.ts
import fastify from "fastify";
import secureSession from "@fastify/secure-session";
import cookie from "@fastify/cookie";

const app = fastify({ logger: true });

app.register(cookie);
app.register(secureSession, {
  key: Buffer.from(config.sessionKeyHex, "hex"),
  cookieName: "__Host-pulso_session",
  cookie: {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8
  }
});
```

Key uit AWS KMS / Secrets Manager, niet in code of env-vars direct.

## /me endpoint

```typescript
// src/routes/me.ts
export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/me", { preHandler: requireSession }, async (req) => {
    const sub = req.session.get("sub");
    const email = req.session.get("email");
    const acr = req.session.get("acr");

    // Consents komen uit applicatie-DB (geen token-round-trip)
    const consents = await db.consents.findByUserId(sub);
    const region = await db.users.findRegion(sub);

    return {
      sub,
      email,
      name: await db.users.findName(sub),
      picture: await db.users.findPicture(sub),
      consents,
      region,
      acr
    };
  });

  app.patch("/api/me/consents", { preHandler: requireSession }, async (req, reply) => {
    const sub = req.session.get("sub");
    const body = req.body as Record<string, any>;

    // 1. Update in DB (source of truth voor applicatie)
    await db.consents.update(sub, body);

    // 2. Spiegel naar Auth0 user_metadata
    await auth0Mgmt.updateUserMetadata(sub, { consents: body });

    // 3. Audit-log
    await log.consent({ sub, change: body, channel: "web" });

    return { ok: true };
  });
};
```

## Device-management

```typescript
// src/routes/me.ts — vervolg
app.get("/api/me/devices", { preHandler: [requireSession, requireAcr("urn:pulso:acr:stepped_up_recent")] }, async (req) => {
  const sub = req.session.get("sub");
  const sessions = await auth0Mgmt.listSessions(sub);
  return sessions.map(toDeviceInfo);
});

app.post("/api/me/devices/:id/revoke", { preHandler: [requireSession, requireAcr("urn:pulso:acr:stepped_up_recent")] }, async (req) => {
  const sub = req.session.get("sub");
  await auth0Mgmt.revokeSession((req.params as any).id);
  await log.deviceRevoked({ sub, session_id: (req.params as any).id });
  return { ok: true };
});

app.post("/api/me/devices/revoke-all", { preHandler: [requireSession, requireAcr("urn:pulso:acr:stepped_up_recent")] }, async (req) => {
  const sub = req.session.get("sub");
  await auth0Mgmt.revokeAllSessions(sub, { except: req.session.get("current_session_id") });
  return { ok: true };
});
```

## Management API-client

```typescript
// src/lib/mgmt.ts
import fetch from "undici";

const base = `https://${config.auth0Domain}/api/v2`;
let cachedToken: { token: string; exp: number } | null = null;

async function mgmtToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const res = await fetch(`https://${config.auth0Domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.auth0MgmtClientId,
      client_secret: config.auth0MgmtClientSecret,
      audience: `${base}/`,
      grant_type: "client_credentials"
    })
  });
  const data = await res.body.json() as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export const auth0Mgmt = {
  async listSessions(userId: string) {
    const r = await fetch(`${base}/users/${encodeURIComponent(userId)}/sessions`, {
      headers: { Authorization: `Bearer ${await mgmtToken()}` }
    });
    return (await r.body.json()) as any[];
  },
  async revokeSession(sessionId: string) {
    await fetch(`${base}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await mgmtToken()}` }
    });
  },
  async revokeAllSessions(userId: string, opts: { except?: string }) {
    const sessions = await this.listSessions(userId);
    await Promise.all(sessions.filter(s => s.id !== opts.except).map(s => this.revokeSession(s.id)));
  },
  async updateUserMetadata(userId: string, metadata: Record<string, any>) {
    await fetch(`${base}/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${await mgmtToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_metadata: metadata })
    });
  }
};
```

## Webhook: Auth0 Log Stream events

Auth0 pusht events naar een Pulso endpoint; de BFF verwerkt ze:

```typescript
// src/routes/webhooks.ts
export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/auth0-event", async (req, reply) => {
    // Auth0 stuurt geen HMAC-signatuur; Pulso gebruikt mTLS of een shared bearer-token
    const token = req.headers.authorization;
    if (token !== `Bearer ${config.auth0WebhookToken}`) return reply.status(401).send();

    const events = req.body as any[];
    for (const ev of events) {
      await handleAuth0Event(ev);
    }
    return { received: events.length };
  });
};

async function handleAuth0Event(ev: any) {
  switch (ev.data.type) {
    case "sepft": // successful passkey login
    case "s":     // successful login
      await db.loginEvents.record(ev);
      break;
    case "limit_wc": // wachtwoord-brute-force-limit bereikt
      await alerts.notifyTrustAndSafety(ev);
      break;
    case "coa": // credential-stuffing attack detected
      await alerts.notifyTrustAndSafetyHigh(ev);
      break;
    // ... meer cases
  }
  await datadogLog.push(ev);
}
```

## Risk-signals naar Auth0

Wanneer Pulso's eigen risk-engine een signaal detecteert (impossible-travel, velocity, breach-mention) stuurt het dat via een terug-kanaal dat de volgende Auth0 Post-Login Action kan lezen:

- Schrijf naar `user_metadata.risk_level`
- Volgende login-flow leest dit in de Action, en escaleert met `api.multifactor.enable("any")` of `api.access.deny()`

Alternatief: Auth0's **Adaptive MFA "User Identity Context"** API accepteert direct ingestion van risk-signalen.

## Observability

- `pino`-logger met structured JSON output naar stdout; CloudWatch-agent of Datadog-agent pickt op
- Request-correlation via `request_id` header (vanaf CloudFront → BFF → Auth0 waar mogelijk)
- Auth0-events én applicatie-events in dezelfde Datadog-index met `service:pulso-bff` tag

## Kritieke security-middleware

- `fastify-helmet` voor strikte CSP, HSTS, etc.
- `fastify-rate-limit` op login-gerelateerde endpoints (extra laag naast WAF)
- CORS-config strict: alleen `app.pulso.com` mag de API aanroepen met `credentials`
- Geen `Access-Control-Allow-Origin: *`

## Testing

- Contract-tests tegen een Auth0 test-tenant (aparte "dev" tenant)
- Geen prod-tokens in CI
- Fixtures gesimuleerd met `openid-client`'s `Client` mocks
- End-to-end happy path: Playwright-script dat een test-user door de hele flow laat lopen
