# Voice + LLM — Zitadel

Alle externe kanalen (Google Home, Alexa, ChatGPT Actions, Claude MCP) praten via standaard OAuth 2.0 met Zitadel. De flows zijn identiek aan variant A/B; het configureren gebeurt in de Zitadel Console (of via Management API als IaC).

## Google Home — Account Linking

### Zitadel-configuratie

In `pulso-eu` → `pulso-platform` → Applications → Create:

- **Type**: OIDC Web
- **Authentication method**: Basic (client_secret_basic)
- **Redirect URIs**:
  - `https://oauth-redirect.googleusercontent.com/r/<google-project-id>`
  - `https://oauth-redirect-sandbox.googleusercontent.com/r/<google-project-id>`
- **Post-logout Redirect URIs**: niet nodig (Google handelt logout zelf af)
- **Grant types**: Authorization Code, Refresh Token
- **Token Settings**:
  - Refresh Token: aan, rollend, 30 dagen

Na opslaan: kopieer **Client ID** en **Client Secret** naar Google Actions Console.

### Google Actions Console

- Account Linking → type **OAuth** → flow **Authorization Code**
- Client ID / Client Secret uit Zitadel
- Authorization URL: `https://pulso-eu.zitadel.cloud/oauth/v2/authorize`
- Token URL: `https://pulso-eu.zitadel.cloud/oauth/v2/token`
- Scopes (spatie-gescheiden):
  - `openid`
  - `profile`
  - `email`
  - `offline_access`
  - `voice.sessions.start`
  - `voice.sessions.read`
  - `voice.notes.write`
  - `urn:zitadel:iam:org:project:id:123456789:aud`

### Voice Match

Google stuurt per invocatie `conv.user.verificationStatus` (VERIFIED / GUEST). Pulso's fulfillment checkt dit:

```javascript
// fulfillment.js — Actions on Google
const {conversation} = require('@assistant/conversation');
const app = conversation();

app.handle('startPulsoSession', async (conv) => {
  const token = conv.user.params.accessToken;  // Zitadel access-token, via Google
  const verified = conv.user.verificationStatus === 'VERIFIED';

  if (!token) {
    conv.ask('Koppel eerst je Pulso-account in de Google Home-app.');
    return;
  }
  if (!verified) {
    conv.ask('Voor persoonlijke voortgang open je de Pulso-app op je telefoon.');
    return;
  }

  const res = await fetch('https://api.pulso.com/voice/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'breathing', duration: 300 })
  });
  if (!res.ok) {
    conv.ask('Er ging iets mis, probeer het later opnieuw.');
    return;
  }
  conv.ask('Welkom terug, we beginnen met een ademhalingsoefening.');
});
```

FastAPI ziet gewoon een Bearer-token; JWKS-validatie werkt transparant.

## Amazon Alexa — Account Linking

### Zitadel-configuratie

- **Type**: OIDC Web
- **Authentication method**: Basic
- **Redirect URIs** (Alexa per regio):
  - `https://layla.amazon.com/api/skill/link/<vendor-id>`
  - `https://pitangui.amazon.com/api/skill/link/<vendor-id>`
  - `https://alexa.amazon.co.jp/api/skill/link/<vendor-id>`
- Scopes zoals bij Google Home

### Alexa Developer Console

- Account Linking aan, type **Auth Code Grant**
- Authorization URI: `https://pulso-eu.zitadel.cloud/oauth/v2/authorize`
- Access Token URI: `https://pulso-eu.zitadel.cloud/oauth/v2/token`
- Client ID / Secret uit Zitadel

```javascript
// Alexa skill fulfillment
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
        .speak('Koppel eerst je Pulso-account in de Alexa-app.')
        .withLinkAccountCard()
        .getResponse();
    }
    const r = await fetch('https://api.pulso.com/voice/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'breathing' })
    });
    return input.responseBuilder
      .speak(r.ok ? 'Welkom terug, we beginnen.' : 'Er ging iets mis.')
      .getResponse();
  }
};
```

## ChatGPT Actions — OAuth 2.0

### Zitadel-configuratie

- **Type**: OIDC Web
- **Authentication method**: Basic
- **Redirect URIs**: `https://chat.openai.com/aip/g-<gpt-id>/oauth/callback`
- Scopes: `openid profile email offline_access workouts.read trainingsload.read urn:zitadel:iam:org:project:id:123456789:aud`

### ChatGPT Custom GPT — OpenAPI

```yaml
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
      parameters:
        - name: days
          in: query
          schema: { type: integer, default: 7 }
      security:
        - OAuth2: [workouts.read]
      responses:
        '200': { description: OK }

components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://pulso-eu.zitadel.cloud/oauth/v2/authorize
          tokenUrl: https://pulso-eu.zitadel.cloud/oauth/v2/token
          scopes:
            workouts.read: Lezen van workouts
            trainingsload.read: Lezen van trainingslast
```

ChatGPT leidt de gebruiker door Zitadel's consent-scherm; access-token komt terug naar ChatGPT en wordt bij elke call meegegeven aan FastAPI.

### Zitadel Action — scope-consent-log

```javascript
// Zitadel Action v2 — pre-authentication voor LLM-clients
exports.preAuth = async (ctx, api) => {
  const clientId = ctx.request?.clientId;
  if (!clientId || !isLLMClient(clientId)) return;

  const requested = (ctx.request?.scope || '').split(' ');
  await api.call('POST', 'https://api.pulso.com/internal/consent-log', {
    headers: { Authorization: `Bearer ${ctx.secrets.PULSO_WEBHOOK_TOKEN}` },
    body: {
      user_id: ctx.user?.id,
      client_id: clientId,
      scopes: requested,
      timestamp: new Date().toISOString(),
      channel: 'oauth-consent',
    },
  });
};

function isLLMClient(clientId) {
  return clientId.startsWith('chatgpt-') || clientId.startsWith('mcp-');
}
```

## Claude MCP — Dynamic Client Registration (via Mgmt API)

Zitadel heeft op het moment van schrijven beperkte directe RFC 7591-support. Pulso's MCP-server wrapt de Zitadel Management API en biedt **zelf een /register endpoint** aan Claude.

### MCP-server in Python (FastAPI)

Pulso draait een aparte FastAPI-service op `mcp.pulso.com` (losstaand van `api.pulso.com`), die:

1. Een DCR-achtig `/register` endpoint aanbiedt aan Claude
2. Een Zitadel Management API-call doet om een nieuwe Application in het project aan te maken
3. Zelf als OAuth-provider fungeert richting Claude, maar proxyt de feitelijke authorize/token naar Zitadel

```python
# mcp-proxy/app/routes/register.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, HttpUrl

from app.zitadel.mgmt_client import ZitadelMgmtClient, get_mgmt_client
from app.security.rate_limit import rate_limit

router = APIRouter()

class DCRRequest(BaseModel):
    redirect_uris: List[HttpUrl]
    client_name: str | None = None
    grant_types: List[str] = ["authorization_code", "refresh_token"]
    response_types: List[str] = ["code"]
    token_endpoint_auth_method: str = "none"

class DCRResponse(BaseModel):
    client_id: str
    registration_access_token: str
    registration_client_uri: str
    redirect_uris: List[HttpUrl]
    grant_types: List[str]
    response_types: List[str]
    token_endpoint_auth_method: str
    scope: str

@router.post("/register", response_model=DCRResponse, status_code=201)
async def register(
    request: Request,
    body: DCRRequest,
    mgmt: Annotated[ZitadelMgmtClient, Depends(get_mgmt_client)],
) -> DCRResponse:
    await rate_limit(request.client.host, f"dcr:{request.client.host}", limit=10, per_seconds=3600)

    client_name = f"mcp-{body.client_name or 'claude'}-{int(time.time())}"

    # Zitadel Management API: POST /management/v1/projects/{project_id}/apps/oidc
    app_config = await mgmt.create_oidc_app(
        project_id=settings.zitadel_project_id,
        name=client_name,
        redirect_uris=[str(u) for u in body.redirect_uris],
        response_types=["OIDC_RESPONSE_TYPE_CODE"],
        grant_types=["OIDC_GRANT_TYPE_AUTHORIZATION_CODE", "OIDC_GRANT_TYPE_REFRESH_TOKEN"],
        app_type="OIDC_APP_TYPE_NATIVE",
        auth_method_type="OIDC_AUTH_METHOD_TYPE_NONE",  # public + PKCE
        access_token_type="OIDC_TOKEN_TYPE_JWT",
        dev_mode=False,
    )

    # Genereer registration-access-token waarmee Claude later zijn eigen registratie kan updaten
    reg_access_token = secrets.token_urlsafe(32)
    await mgmt.set_app_metadata(
        project_id=settings.zitadel_project_id,
        app_id=app_config["appId"],
        key="mcp_registration_token",
        value=hash_token(reg_access_token),
    )

    return DCRResponse(
        client_id=app_config["clientId"],
        registration_access_token=reg_access_token,
        registration_client_uri=f"https://mcp.pulso.com/register/{app_config['appId']}",
        redirect_uris=body.redirect_uris,
        grant_types=body.grant_types,
        response_types=body.response_types,
        token_endpoint_auth_method="none",
        scope="openid profile workouts.read trainingsload.read "
              f"urn:zitadel:iam:org:project:id:{settings.zitadel_project_id}:aud",
    )
```

### MCP-tools

```python
# mcp-proxy/app/mcp/tools.py
from mcp.server.fastmcp import FastMCP, Context

mcp = FastMCP("Pulso Coach")

@mcp.tool()
async def list_recent_workouts(days: int, ctx: Context) -> dict:
    """Haal recente workouts op van de geauthenticeerde gebruiker."""
    bearer = ctx.request_context.request.headers.get("Authorization")
    if not bearer:
        raise ValueError("missing_bearer")

    async with httpx.AsyncClient() as http:
        r = await http.get(
            f"https://api.pulso.com/workouts/recent?days={days}",
            headers={"Authorization": bearer},
        )
        r.raise_for_status()
        data = r.json()

    # Markeer user-gegenereerde content als untrusted (prompt-injection-preventie)
    return {
        "summary": f"Je hebt {len(data['workouts'])} workouts de afgelopen {days} dagen.",
        "raw": {"data": data, "_meta": {"untrusted": True}},
    }
```

### 30-dagen re-consent

Pulso's MCP-proxy houdt bij wanneer elke MCP-client voor het laatst consent heeft gekregen. Een `POST /introspect`-call op de MCP-proxy (door Claude gemaakt om tokens te valideren) controleert impliciet:

```python
@router.post("/introspect")
async def introspect(token: str, client_id: str, ...):
    # Normale introspection via Zitadel...
    # Plus: als consent ouder dan 30 dagen, retourneer active=false om Claude te dwingen opnieuw te authorizen
    last = await mgmt.get_app_metadata(project_id, app_id, "mcp_last_consent")
    if datetime.now() - last > timedelta(days=30):
        return {"active": False}
    return {"active": True, ...}
```

## Revocatie

- **Voice**: gebruiker kiest "ontkoppelen" in Google Home / Alexa-app → platform roept `/oauth/v2/revoke` op Zitadel aan → session + refresh-tokens vervallen
- **ChatGPT**: user verwijdert de Custom GPT → geen expliciete revocatie; Pulso laat het refresh-token natuurlijk verlopen (30 dagen rolling)
- **Claude MCP**: user verwijdert de MCP-server in Claude → Claude doet `DELETE` op `registration_client_uri` → Pulso's MCP-proxy roept Zitadel's Mgmt API aan om de Application te verwijderen

## Events en audit

Zitadel's Actions v2 kunnen bij elke relevante auth-event een webhook naar `api.pulso.com/webhooks/zitadel-action` sturen. Pulso's FastAPI-webhook-route schrijft events naar Datadog + S3. Zelfde patroon als in variant A/B.

## Configuratie-tabel — voice + LLM applications in Zitadel

| Application | Type | Auth-method | Redirect URIs | Scopes (key) |
|-------------|------|-------------|----------------|---------------|
| `pulso-google-home` | OIDC Web | client_secret_basic | `oauth-redirect.googleusercontent.com/r/<id>` | `voice.*`, `offline_access` |
| `pulso-alexa` | OIDC Web | client_secret_basic | `*.amazon.com/api/skill/link/<vendor>` | `voice.*`, `offline_access` |
| `pulso-chatgpt-actions` | OIDC Web | client_secret_basic | `chat.openai.com/aip/g-<gpt-id>/oauth/callback` | `workouts.read`, `trainingsload.read` |
| `pulso-mcp-dcr` | API (service) | Private Key JWT | — | `openid profile urn:zitadel:iam:org:projects:roles` |
| `pulso-device-flow` | OIDC Native | none (public + PKCE) | `urn:ietf:wg:oauth:2.0:oob` (Device Flow) | `workouts.*`, `coaching.stream` |

## Wat in de Zitadel-console zichtbaar is

Na een levende maand zie je in het `pulso-platform` project:

- Een handvol statisch gedefinieerde Applications (Nuxt-web, iOS, Android, Google Home, Alexa, ChatGPT, Device Flow)
- Tientallen dynamisch aangemaakte Applications met namen als `mcp-claude-1714567890` (één per Claude-gebruiker die Pulso heeft gekoppeld)
- Events-tab met een stream van alle auth-events (login, token-refresh, logout, session termination)
- Users-tab met de Pulso-eindgebruikers (Amira, Thomas, Henk, Nadia en ~650.000 anderen)

Pulso's data-model-source-of-truth (workouts, abonnement, health-data) blijft in Aurora PostgreSQL — niet in Zitadel. Zitadel kent alleen `sub`, identity-methoden, metadata en auth-events.
