# Voice + LLM — Auth0

Concreet inregelen van Google Home, Alexa, ChatGPT Actions en Claude MCP tegen een Auth0-tenant.

## Google Home — Account Linking

### Google Actions Console

1. Project aanmaken in Actions on Google console
2. Account Linking: type **OAuth**, grant type **Authorization Code**
3. Authorization URL: `https://auth.pulso.com/authorize`
4. Token URL: `https://auth.pulso.com/oauth/token`
5. Client ID / Secret: uit de `pulso-google-home` Application in Auth0
6. Scopes: `voice.sessions.start voice.sessions.read voice.notes.write`
7. Google's redirect URI toevoegen in Auth0 (Allowed Callback URLs):
   - `https://oauth-redirect.googleusercontent.com/r/<project-id>`
   - `https://oauth-redirect-sandbox.googleusercontent.com/r/<project-id>`

### Auth0-config voor `pulso-google-home`

- Application Type: **Regular Web Application**
- Grant Types: Authorization Code, Refresh Token
- **Refresh Token Rotation**: aan (30d rollend)
- Token Endpoint Authentication: `client_secret_post` (Google-vereisten)
- Connections: alleen `Username-Password-Authentication` en `google-oauth2` toegestaan — geen passkeys (Google Home kan geen WebAuthn tonen tijdens linking)

### Actions on Google

In de Action-fulfillment:

```javascript
// fulfillment.js
const {conversation} = require('@assistant/conversation');

const app = conversation();

app.handle('startPulsoSession', async (conv) => {
  const token = conv.user.params.accessToken;  // Google levert na linking
  if (!token) {
    conv.ask("Om te beginnen, koppel eerst je Pulso-account in de Google Home-app.");
    return;
  }

  const res = await fetch('https://api.pulso.com/voice/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'breathing', duration: 300 })
  });
  if (!res.ok) {
    conv.ask("Er ging iets mis, probeer het later opnieuw.");
    return;
  }
  conv.ask("Welkom terug — we beginnen met een ademhalingsoefening.");
});
```

### Voice Match-signaal

Google Assistant stuurt bij uitvoering een `verificationStatus` mee (`GUEST` / `VERIFIED`). Alleen bij `VERIFIED` met matching Voice Match accepteert Pulso account-specifieke queries.

## Amazon Alexa — Account Linking

### Alexa Developer Console

1. Skill-type: **Custom** of **Smart Home** — Pulso kiest Custom voor rijke dialoog
2. Account Linking: enable
3. Authorization URI: `https://auth.pulso.com/authorize`
4. Access Token URI: `https://auth.pulso.com/oauth/token`
5. Client ID/Secret: uit `pulso-alexa` Application in Auth0
6. Scope: `voice.sessions.start voice.sessions.read voice.notes.write`
7. Auth0 Allowed Callback URLs:
   - `https://layla.amazon.com/api/skill/link/<vendor-id>`
   - `https://pitangui.amazon.com/api/skill/link/<vendor-id>`
   - `https://alexa.amazon.co.jp/api/skill/link/<vendor-id>`

### Lambda-fulfillment (Alexa skill)

```javascript
const Alexa = require('ask-sdk-core');

const StartSessionHandler = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(input.requestEnvelope) === 'StartSessionIntent';
  },
  async handle(input) {
    const token = input.requestEnvelope.context.System.user.accessToken;
    if (!token) {
      return input.responseBuilder
        .speak("Koppel eerst je Pulso-account in de Alexa-app.")
        .withLinkAccountCard()
        .getResponse();
    }
    const r = await fetch('https://api.pulso.com/voice/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'breathing', duration: 300 })
    });
    if (!r.ok) {
      return input.responseBuilder.speak("Er ging iets mis.").getResponse();
    }
    return input.responseBuilder
      .speak("Welkom terug, we beginnen je ademhalingsoefening.")
      .getResponse();
  }
};
```

## ChatGPT Actions — OAuth 2.0

Pulso host een Custom GPT of Action. Het OAuth-manifest:

### Auth0-config voor `pulso-chatgpt-actions`

- Application Type: **Regular Web Application**
- Grant Types: Authorization Code, Refresh Token
- Refresh Token Rotation: aan (30d)
- Auth0 Callback URL: `https://chat.openai.com/aip/g-<gpt-id>/oauth/callback`
- Connections: alle behalve Facebook

### OpenAPI / Actions manifest in ChatGPT

```yaml
# openapi.yaml (fragment)
openapi: 3.1.0
info:
  title: Pulso Coach
  version: 1.0.0
servers:
  - url: https://api.pulso.com
paths:
  /workouts/recent:
    get:
      operationId: getRecentWorkouts
      summary: Haal recente workouts op
      security:
        - OAuth2:
            - workouts.read
      responses:
        '200':
          description: OK
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.pulso.com/authorize
          tokenUrl: https://auth.pulso.com/oauth/token
          scopes:
            workouts.read: Lezen van workouts
            trainingsload.read: Lezen van trainingslast
```

ChatGPT leidt de gebruiker door Pulso's consent-flow; het access-token komt terug naar ChatGPT's backend en wordt bij elke call meegegeven.

### Auth0 Action — scope-consent-log

```typescript
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id === CHATGPT_CLIENT_ID) {
    const granted = event.transaction?.requested_scopes ?? [];
    // Log consent naar Pulso
    await fetch("https://api.pulso.com/internal/consent-log", {
      method: "POST",
      headers: { Authorization: `Bearer ${event.secrets.INTERNAL_TOKEN}` },
      body: JSON.stringify({
        user_id: event.user.user_id,
        client: "chatgpt",
        scopes: granted,
        channel: "oauth-consent"
      })
    });
  }
};
```

## Claude MCP — Dynamic Client Registration

Meest complexe integratie. MCP-clients registreren zichzelf dynamisch bij de server; elke Claude-gebruiker = nieuwe client.

### Pulso's MCP-server

Niet direct Auth0 — Pulso host een MCP-proxy op `mcp.pulso.com` die:

- `/register` endpoint (RFC 7591 DCR) — accepteert client-metadata, roept Auth0 Management API aan om nieuwe Auth0-client te maken
- `/.well-known/oauth-authorization-server` — publiceert authorization server metadata
- `/authorize` en `/token` — relayen naar Auth0 met de nieuwe client-id
- MCP-tools (lijst van operations die Claude kan aanroepen)

### Dynamic Client Registration flow

```typescript
// POST /register op mcp.pulso.com
app.post("/register", async (req, reply) => {
  const metadata = req.body as DCRRequest;

  // Rate-limit per IP — voorkom DCR-misbruik
  const limited = await rateLimit.check(`dcr:${req.ip}`, { max: 10, per: 3600 });
  if (limited) return reply.status(429).send();

  // Creeer Auth0-client via Management API
  const auth0Client = await auth0Mgmt.createClient({
    name: `mcp-${metadata.client_name || "claude"}-${Date.now()}`,
    app_type: "regular_web",
    token_endpoint_auth_method: "none",   // public + PKCE
    callbacks: metadata.redirect_uris,
    allowed_origins: [],
    grant_types: ["authorization_code", "refresh_token"],
    refresh_token: {
      rotation_type: "rotating",
      expiration_type: "expiring",
      token_lifetime: 30 * 24 * 3600,
      idle_token_lifetime: 30 * 24 * 3600
    }
  });

  return {
    client_id: auth0Client.client_id,
    token_endpoint_auth_method: "none",
    redirect_uris: metadata.redirect_uris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: "openid profile workouts.read trainingsload.read"
  };
});
```

### Re-consent na 30 dagen

Een Post-Login Action controleert bij MCP-clients of de consent nog vers is:

```typescript
exports.onExecutePostLogin = async (event, api) => {
  const isMcp = event.client.metadata?.source === "mcp";
  if (!isMcp) return;
  const lastConsent = new Date(event.user.user_metadata?.mcp_last_consent ?? 0);
  const ageDays = (Date.now() - lastConsent.getTime()) / (1000 * 86400);
  if (ageDays > 30) {
    api.authentication.challengeWith({ type: "otp" });  // forceer step-up = impliciete re-consent
  }
};
```

### MCP-tools definition

```typescript
// mcp-server tools
server.registerTool({
  name: "workouts.recent",
  description: "Haal recente workouts op van de geauthenticeerde gebruiker",
  inputSchema: { type: "object", properties: { days: { type: "number" } } },
  handler: async ({ days }, context) => {
    const token = context.bearerToken;
    const r = await fetch(`https://api.pulso.com/workouts/recent?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) throw new Error("api_error");
    return await r.json();
  }
});
```

Pulso markeert elke response-string met MCP's `untrusted_content` marker om prompt-injection te mitigeren:

```typescript
return {
  content: [
    { type: "text", text: `Je hebt ${data.count} workouts de afgelopen week.` },
    { type: "text", text: JSON.stringify(data), annotations: { untrusted: true } }
  ]
};
```

## Revocatie

- Voice: gebruiker kiest in Google Home / Alexa-app "ontkoppelen" → platform roept Auth0's `/oauth/revoke` aan
- ChatGPT: user verwijdert "Pulso Coach" in zijn plugins/actions-lijst → ChatGPT stopt gebruik; Pulso detecteert lange inactiviteit en laat het refresh-token verlopen
- Claude MCP: "verwijder MCP-server" in Claude Desktop → client roept Pulso's `/register/{client_id}` DELETE aan → Pulso verwijdert de Auth0-client

## Wat in de Auth0-tenant zichtbaar is

Na een levende maand zie je in de tenant:

- Tientallen MCP-clients (één per Claude-gebruiker die Pulso heeft gekoppeld)
- Eén client voor ChatGPT Actions, Google Home, Alexa elk
- Log Stream met voice-sessies en LLM-queries als audit-trail
- User-metadata per user met `mcp_last_consent`, `voice_linked_at`, en consent-state
