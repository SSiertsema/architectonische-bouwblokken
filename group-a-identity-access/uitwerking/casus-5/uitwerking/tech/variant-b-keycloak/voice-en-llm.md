# Voice + LLM — Keycloak

Alle voice- en LLM-integraties werken tegen Keycloak's standaard OIDC/OAuth 2.0-endpoints. De flows zijn identiek aan variant A; de configuratie gebeurt in Keycloak Admin in plaats van in Auth0.

## Google Home — Account Linking

### Keycloak-configuratie

1. Admin → Clients → Create Client: `pulso-google-home`
   - Client type: OpenID Connect
   - Access type: confidential
   - Standard Flow Enabled: yes
   - Valid Redirect URIs:
     - `https://oauth-redirect.googleusercontent.com/r/<project-id>`
     - `https://oauth-redirect-sandbox.googleusercontent.com/r/<project-id>`
2. Credentials tab → copy client-secret
3. Client Scopes → add `voice.sessions.start`, `voice.sessions.read`, `voice.notes.write` (moeten eerst als Client Scopes bestaan)

### Google Actions Console

Identiek aan variant A:

- Authorization URL: `https://auth.pulso.com/realms/pulso-eu/protocol/openid-connect/auth`
- Token URL: `https://auth.pulso.com/realms/pulso-eu/protocol/openid-connect/token`
- Client ID / Secret: uit Keycloak

## Amazon Alexa — Account Linking

### Keycloak-configuratie

Client `pulso-alexa`:

- Access type: confidential
- Valid Redirect URIs:
  - `https://layla.amazon.com/api/skill/link/<vendor-id>`
  - `https://pitangui.amazon.com/api/skill/link/<vendor-id>`
  - `https://alexa.amazon.co.jp/api/skill/link/<vendor-id>`

Alexa Developer Console: dezelfde endpoints als voor Auth0, wijst naar Keycloak-URL's.

## ChatGPT Actions

Client `pulso-chatgpt-actions` in Keycloak:

- Access type: confidential
- Valid Redirect URIs: `https://chat.openai.com/aip/g-<gpt-id>/oauth/callback`
- Consent screen: enabled (user moet scopes bevestigen)

OpenAPI manifest in ChatGPT:

```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.pulso.com/realms/pulso-eu/protocol/openid-connect/auth
          tokenUrl: https://auth.pulso.com/realms/pulso-eu/protocol/openid-connect/token
          scopes:
            workouts.read: Lezen van workouts
            trainingsload.read: Lezen van trainingslast
```

## Claude MCP — Dynamic Client Registration

Keycloak heeft **native DCR** via `/realms/pulso-eu/clients-registrations/openid-connect`. Pulso hoeft geen proxy-MCP-server te bouwen die DCR zelf afhandelt — Keycloak doet het.

### DCR-policy

Admin → Realm Settings → Client Registration → Policies:

- **Trusted Hosts**: lijst van allowed hosts die DCR mogen aanroepen (Pulso's MCP-server IP-range)
- **Allowed Client Scopes**: alleen `workouts.read`, `trainingsload.read`, etc. — niet `health.*` zonder expliciete consent
- **Max Clients**: cap op 100.000 (anti-abuse)
- **Client Disabled**: nieuw geregistreerde clients zijn `enabled=false` tot Pulso's MCP-server ze activeert

### MCP-server in Pulso

Pulso host nog steeds een MCP-server (`mcp.pulso.com`), maar die server:

1. Ontvangt Claude's `/register`-call
2. Forward naar Keycloak's clients-registrations-endpoint (als "trusted host")
3. Ontvangt `client_id` + metadata terug
4. Retourneert naar Claude
5. Bemiddelt MCP-tool-calls (met Bearer-token van Claude) tegen de Pulso API

```typescript
// mcp.pulso.com/register
app.post("/register", async (req, reply) => {
  const metadata = req.body as DCRRequest;
  // Rate limit
  // ...
  const r = await fetch(`${config.kcIssuer}/clients-registrations/openid-connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Initial access token: M2M-token met client-register-rol
      "Authorization": `Bearer ${await initialAccessToken()}`
    },
    body: JSON.stringify({
      client_name: `mcp-${metadata.client_name}-${Date.now()}`,
      redirect_uris: metadata.redirect_uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      application_type: "native"
    })
  });
  const kcClient = await r.body.json();
  return {
    client_id: kcClient.client_id,
    registration_access_token: kcClient.registration_access_token,
    registration_client_uri: kcClient.registration_client_uri,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "openid profile workouts.read trainingsload.read"
  };
});
```

### 30-dagen re-consent

Keycloak heeft geen native "force re-consent na N dagen". Pulso implementeert via:

- **Custom Required Action** in de MCP-client-flow die bij login checkt of `consent_date` op de user + client combinatie < 30 dagen oud is
- Als ouder: trigger consent-screen opnieuw

Alternatief: client-side (in de MCP-server) bijhouden wanneer last-consent was en een "session.expired" response sturen naar Claude als deadline passeert.

## Revocatie

- Voice / Alexa: standaard Keycloak `/protocol/openid-connect/revoke` endpoint
- ChatGPT: idem
- Claude MCP: DELETE op de `registration_client_uri` (DCR-spec) verwijdert de client volledig uit Keycloak

## Events en audit

Alle voice- en LLM-events komen via de Event Listener SPI binnen op dezelfde ingestion-endpoint als in variant A (`POST /webhooks/keycloak-event`). Applicatie-level event-logging werkt identiek.

## Scope-design

Waar Auth0 consent-tekst via Actions bepaald wordt, doet Keycloak dit via **Client Scopes → Consent text**:

- `workouts.read` → consent text: "Toegang tot lezen van uw workouts (gefinaliseerde sessies en samenvattingen)"
- `trainingsload.read` → "Toegang tot uw berekende trainingsbelasting"
- `health.heartrate.read` → "Toegang tot uw hartslagdata — bijzondere categorie persoonsgegevens"

Deze teksten verschijnen op het consent-scherm in Keycloak tijdens OAuth-flow van de LLM-client.

## Sterktes en zwaktes

Sterkte van Keycloak voor deze integraties:

- DCR native en volwassen (geen custom proxy nodig voor MCP)
- Volledige controle over consent-teksten en -UI
- Event listener kan 100% customized naar Pulso's event-schema

Zwaktes:

- Geen ingebouwde "per-client re-consent-periode" — Pulso moet SPI schrijven
- Geen ingebouwde Voice Match-integratie (maar dat heeft Auth0 ook niet — dit komt van Google)
- Upgrade-risico: major Keycloak-versie kan DCR-API-gedrag lichtjes wijzigen; regressietests bij elke upgrade noodzakelijk
