# Backend Node.js (BFF) — Keycloak

Het BFF-patroon is hetzelfde als in variant A; `openid-client` werkt tegen elke OIDC-conformant IdP. Deze pagina benoemt de Keycloak-specifieke verschillen.

## Unchanged

Zie `../variant-a-auth0/backend-node-stappen.md` voor:

- Project-layout
- OIDC-setup met `openid-client`
- Signin-routes (`/signin/start`, `/signin/callback`, `/signin/stepup`)
- Sessie-cookie (`__Host-pulso_session`)
- `/api/me`, `/api/me/consents`
- Observability
- CORS, CSP, rate-limiting

Alle logica is CIAM-agnostisch dankzij `openid-client`'s discovery. Pulso migreert van Auth0 → Keycloak door uitsluitend configuratie te wijzigen.

## Keycloak-specifieke verschillen

### 1. OIDC issuer-URL

```typescript
// src/config.ts
export const config = {
  // Auth0: "https://pulso-eu.eu.auth0.com/"
  // Keycloak:
  oidcIssuer: "https://auth.pulso.com/realms/pulso-eu",
  oidcClientId: "pulso-web-prod",
  oidcClientSecret: process.env.KC_CLIENT_SECRET!,  // confidential client
  // ...
};
```

`Issuer.discover()` werkt identiek; het well-known-document ligt op `https://auth.pulso.com/realms/pulso-eu/.well-known/openid-configuration`.

### 2. Admin API in plaats van Management API

Keycloak heeft een **Admin REST API** onder `https://auth.pulso.com/admin/realms/pulso-eu/...`. Authentication via een service-account (`pulso-mgmt` client met `realm-management` rollen zoals `view-users`, `manage-users`, `view-realm`).

```typescript
// src/lib/kcAdmin.ts
import fetch from "undici";

const base = `${config.oidcIssuer.replace("/realms/pulso-eu", "")}/admin/realms/pulso-eu`;
let cachedToken: { token: string; exp: number } | null = null;

async function adminToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const r = await fetch(`${config.oidcIssuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.kcAdminClientId,
      client_secret: config.kcAdminClientSecret
    })
  });
  const data = await r.body.json() as any;
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export const kcAdmin = {
  async listSessions(userId: string) {
    const r = await fetch(`${base}/users/${encodeURIComponent(userId)}/sessions`, {
      headers: { Authorization: `Bearer ${await adminToken()}` }
    });
    return await r.body.json();
  },
  async logoutUser(userId: string) {
    await fetch(`${base}/users/${encodeURIComponent(userId)}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await adminToken()}` }
    });
  },
  async revokeSession(sessionId: string) {
    await fetch(`${base}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await adminToken()}` }
    });
  },
  async updateUserAttributes(userId: string, attributes: Record<string, string[]>) {
    const user = await fetch(`${base}/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${await adminToken()}` }
    }).then(r => r.body.json()) as any;
    user.attributes = { ...(user.attributes ?? {}), ...attributes };
    await fetch(`${base}/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${await adminToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
  }
};
```

Gebruik in `/api/me/devices` en `/api/me/consents` identiek aan variant A, maar met `kcAdmin` in plaats van `auth0Mgmt`.

### 3. Webhook / event-stream via Event Listener SPI

Geen native "push webhook" zoals Auth0 Log Streams. Pulso schrijft een **Event Listener SPI** (Java-class) die events direct naar Pulso's ingestion-endpoint pusht, of gebruikt de open-source `keycloak-event-listener-http` extension.

Alternatief zonder Java-SPI: Keycloak event admin-events worden ook naar een externe JMS / Kafka geduwd; Pulso draait een consumer.

```typescript
// src/routes/webhooks.ts — ontvangt events van custom Keycloak-SPI
app.post("/webhooks/keycloak-event", { preHandler: verifyMTLS }, async (req, reply) => {
  const ev = req.body as any;
  switch (ev.type) {
    case "LOGIN":
      await db.loginEvents.record(ev);
      break;
    case "LOGIN_ERROR":
      await alerts.maybeEscalate(ev);
      break;
    case "USER_DISABLED_BY_PERMANENT_LOCKOUT":
      await alerts.notifyTrustAndSafety(ev);
      break;
    // ...
  }
  await datadogLog.push(ev);
  return reply.status(200).send();
});
```

### 4. Custom claims

Keycloak gebruikt **Protocol Mappers** i.p.v. Auth0 Actions:

- Open Keycloak Admin → Clients → `pulso-web-prod` → Client Scopes → Dedicated → Mappers
- Maak een "User Attribute" mapper: `consents` → ID Token-claim `https://pulso.com/consents`
- Maak een "Hardcoded Role" of "Role Name Mapper" voor rollen in de `roles`-claim

User attributes worden via de Admin API gezet (`kcAdmin.updateUserAttributes(userId, { consents: [...] })`).

### 5. Step-up via `acr_values`

Keycloak ondersteunt `acr_values` uit de OIDC-spec. In de authenticatie-flow editor maak je een conditional-branch:

- Als `acr_values=urn:pulso:acr:stepped_up_recent` → forceer OTP-authenticator
- Anders → standard browser-flow

De BFF-code (`/signin/stepup`) is identiek aan variant A: stuurt gewoon `acr_values` mee; Keycloak handelt het via de flow.

### 6. Logout

Keycloak's end-session-endpoint is `https://auth.pulso.com/realms/pulso-eu/protocol/openid-connect/logout`:

```typescript
app.post("/signout", async (req, reply) => {
  const session = req.session;
  const idToken = session.get("id_token");
  session.delete();
  reply.clearCookie("__Host-pulso_session");
  const logoutUrl = new URL(`${config.oidcIssuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("id_token_hint", idToken);
  logoutUrl.searchParams.set("post_logout_redirect_uri", `${config.appBaseUrl}/`);
  return reply.redirect(logoutUrl.toString());
});
```

## Deployment-consideraties

- BFF en Keycloak staan in dezelfde VPC; `/token`-calls lopen intern zonder internet-hop
- mTLS tussen BFF en Keycloak op `/token`-endpoint is een optie (extra confidential-client-waarborg)
- BFF cacht OIDC-discovery-document (TTL 10 min); JWKS-keys TTL 1 uur

## Testing

- **Testcontainers** voor Keycloak: elke integratie-test start een tijdelijke Keycloak-container met pre-imported realm
- Dezelfde test-suite die tegen Auth0 draait werkt ook hier dankzij `openid-client`-abstractie
- Staging-environment heeft een eigen Keycloak-realm (`pulso-staging`)
