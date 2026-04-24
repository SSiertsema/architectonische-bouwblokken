# Variant A — Auth0 (managed CIAM)

Dit is de "leidraad"-variant: Pulso's huidige productie-stack en het referentiepunt voor de sequencediagrammen in `../architectuur.md`.

## Tenant-opzet

Pulso heeft twee Auth0-tenants:

| Tenant | Regio | Gebruik |
|--------|-------|---------|
| `pulso-eu.eu.auth0.com` | EU (Frankfurt) | Alle EU-gebruikers |
| `pulso-us.us.auth0.com` | US | Noord-Amerikaanse gebruikers |

Voor elke tenant:

- Custom domain: `auth.pulso.com` (EU) en `auth.us.pulso.com` (US)
- TLS-cert via ACM, attached aan Auth0 custom domain
- Region-routing: een edge-functie op CloudFront bepaalt op basis van geo-cookie of user-keuze naar welke tenant wordt geleid

## Applications in de tenant

| Application | Type | Gebruik |
|-------------|------|---------|
| `pulso-web-prod` | Regular Web App | BFF web-kanaal |
| `pulso-ios-prod` | Native | iOS app (public client + PKCE) |
| `pulso-android-prod` | Native | Android app (public client + PKCE) |
| `pulso-google-home` | Regular Web App | Google Home Account Linking (confidential) |
| `pulso-alexa` | Regular Web App | Alexa Account Linking (confidential) |
| `pulso-chatgpt-actions` | Regular Web App | ChatGPT Actions (confidential) |
| `pulso-mcp-dcr` | M2M + DCR enabled | Dynamic Client Registration voor Claude MCP (elke MCP-sessie wordt een nieuwe dynamische client) |
| `pulso-mgmt` | M2M | Pulso-BFF gebruikt dit voor Management API calls (sessie-revoke, user-lookup) |

## Connections (identity providers)

- **Database: `Username-Password-Authentication`** — e-mail + Argon2id; disposable-mail-lijst als pre-registration action
- **WebAuthn: `pulso-passkeys`** — platform-authenticators én cross-platform; resident keys aan
- **Social: `apple`** — verplicht voor iOS
- **Social: `google-oauth2`** — met extra scopes alleen voor profielbasis
- **Social: `windowslive`** — Microsoft consumer
- **Social: `facebook`** — afbouwen; retention-only
- Geen **SAML/enterprise** connections — dat is workforce-territorium

### Connection-specifieke instellingen

- Passkeys: "Require user verification" aan; "Allowed authenticator attachments" = platform + cross-platform
- Google: `email_verified` mapping strict; users zonder verified email krijgen geen auto-link
- Facebook: account-linking **uit** — te risicovol wegens e-mail-verificatie-inconsistenties

## Universal Login

Pulso gebruikt de **New Universal Login** (template-based, niet classic). Voordelen:

- Fully custom branding via "Universal Login Customization"
- Passkey-flows native ingebouwd
- Consent-schermen passen bij Pulso's ontwerp-taal
- Internationale vertalingen in Auth0's i18n-engine

### Aangepaste prompts

Pulso heeft custom prompts voor:

- `consent` — extra uitleg per scope met link naar privacy-statement
- `login-id` — "log in met passkey, social of e-mail" volgorde
- `mfa-otp` — TOTP-challenge met branded layout
- `device-flow-activate` — pagina voor Device-flow-bevestiging (smart glasses, wearable)

## Actions (flows)

Pulso heeft Actions actief op:

- **Post-Login trigger**: zet custom claims (`consents`, `region`, `family_plan_id`), enforce step-up voor gevoelige acties, stuurt risk-signals naar Pulso
- **Pre-User-Registration trigger**: disposable-email-check, invisible CAPTCHA verificatie
- **Post-User-Registration trigger**: aanmaken van user in Pulso-DB, welkomst-email triggeren
- **Post-Change-Password trigger**: invalideer alle sessies + verstuur notificatie
- **Credentials-Exchange trigger**: scope-constraint per client-id, log-enrichment voor Datadog

Voorbeeld — Post-Login Action (conceptueel, TypeScript):

```typescript
exports.onExecutePostLogin = async (event, api) => {
  // Custom claims
  const namespace = "https://pulso.com";
  api.idToken.setCustomClaim(`${namespace}/region`, event.user.app_metadata?.region ?? "eu");
  api.idToken.setCustomClaim(`${namespace}/consents`, event.user.user_metadata?.consents ?? {});

  // Risk-feedback van Pulso eigen engine
  const risk = await fetch(`https://risk.pulso.com/evaluate`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${event.secrets.RISK_TOKEN}` },
    body: JSON.stringify({
      user_id: event.user.user_id,
      ip: event.request.ip,
      device: event.request.user_agent,
      connection: event.connection.name
    })
  }).then(r => r.json());

  if (risk.level === "high") {
    api.multifactor.enable("any");
  }

  // Enforce step-up voor sensitive scopes
  const requestedScopes = event.transaction?.requested_scopes ?? [];
  const sensitive = ["account.email.change", "account.subscription.manage", "account.delete", "account.export"];
  if (requestedScopes.some((s) => sensitive.includes(s))) {
    api.authentication.challengeWith({ type: "otp" });
  }
};
```

## Attack Protection

Alle Attack Protection-lagen zijn aan:

- **Bot Detection**: reCAPTCHA v3 op `/authorize` en signup; escalation naar Enterprise-mode bij high-risk
- **Suspicious IP Throttling**: block na X mislukte pogingen per IP
- **Brute Force Protection**: account-lockout na repeated failures
- **Breached Password Detection**: check tegen HIBP bij login en wachtwoord-setting

## Refresh-token-rotation

Per application:

- **Web**: refresh tokens uit (sessie via BFF cookie; refresh gebeurt server-side als nodig)
- **iOS/Android**: Refresh Token Rotation aan + Absolute Expiration 30 dagen + Inactivity Expiration 30 dagen
- **Voice**: Refresh Token Rotation aan, 30 dagen rollend
- **ChatGPT Actions**: Refresh Token Rotation aan, 30 dagen rollend
- **MCP/Claude**: 30 dagen absolute; daarna force re-consent (handled in Action)

## Management API-gebruik

Pulso's BFF gebruikt de Management API voor:

- `GET /api/v2/users/{id}/sessions` — toon "Apparaten & integraties"
- `DELETE /api/v2/users/{id}/sessions` — "alles uitloggen"
- `DELETE /api/v2/users/{id}/authenticators/{auth_id}` — passkey verwijderen
- `POST /api/v2/users/{id}` met `user_metadata.consents` — consent-wijziging spiegelen
- `DELETE /api/v2/users/{id}` — account verwijderen

M2M-token wordt door `pulso-mgmt`-application opgehaald en in-memory gecached door de BFF; Auth0-API-rate-limits respectering via backoff-middleware.

## Log Streams

Pulso stuurt Auth0-events naar twee sinks:

- **Datadog** — via Log Stream (Datadog HTTP-endpoint type)
- **AWS EventBridge** — voor events die applicatie-state raken (`user.created`, `password.change`, `session.revoked`) worden doorgezet naar Lambda die applicatie-DB bijwerkt

Event-schema conform Auth0 spec; filters ingesteld om high-volume events (`fsa`, successful auth) te samplen, maar security-events (failure, reuse-detection) 100% door te sturen.

## Kosten-overwegingen

Pulso valt in "B2C Essentials → B2C Professional" staffel, schalend met MAU.

Grove schatting (cijfers indicatief):

- 650.000 MAU × tier-rate = aanzienlijk per maand
- Attack Protection → Enterprise-tier kost extra
- Per additional external database connection kosten
- Machine-to-machine tokens voor Management API zijn gelimiteerd; rate-limit vraagt soms higher-tier add-ons

Voor Pulso is dit een materiële OPEX-post; verder schalen vraagt een gesprek met Okta (enterprise-contract).

## Operationele overwegingen (het mooie aan managed)

Wat Pulso **niet** doet:

- Geen Keycloak-clusters draaien
- Geen DB-backup-strategie voor de CIAM
- Geen TLS-cert-rotatie (Auth0 handelt custom domain SSL af)
- Geen major-version-upgrades

Wat Pulso **wel** moet doen:

- Tenant-configuratie als code — **Auth0 Deploy CLI** + GitHub Actions; alle Actions, rules, connections, tenant-settings in versiebeheer
- Deployment pipelines per environment (dev → staging → prod tenants)
- Incident-response-playbook voor Auth0-outages
- Audit-trail-export naar eigen log-systeem voor compliance onafhankelijk van Auth0's retentie
