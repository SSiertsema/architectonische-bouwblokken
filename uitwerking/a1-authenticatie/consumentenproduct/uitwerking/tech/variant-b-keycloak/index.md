# Variant B — Keycloak (self-hosted open source)

Dit is de alternatieve variant: zelf gehoste Keycloak in Pulso's eigen AWS-omgeving. Geeft volledige controle over data, kosten, en customization, tegen een hogere operationele last.

## Deployment-topologie

Pulso host Keycloak op EKS in dezelfde regio's als de hoofd-applicatie:

```
eu-west-1:                    us-east-1:
  keycloak-eu namespace         keycloak-us namespace
  ├── 3x keycloak pods          ├── 3x keycloak pods
  ├── ALB + AWS WAF             ├── ALB + AWS WAF
  ├── Aurora PostgreSQL (gedeeld of gescheiden)
  ├── ElastiCache Redis (session cache — Infinispan JDBC replacement)
  └── Grafana dashboards
```

- **Domain**: `auth.pulso.com` (EU), `auth.us.pulso.com` (US)
- **TLS**: ACM-cert op ALB, edge-terminated
- **HA**: 3 replicas per regio, anti-affinity over AZ's, Aurora multi-AZ
- **Upgrades**: rolling, geteste major upgrades elke 12-18 maanden
- **Versie**: Keycloak 26 (actuele LTS op peildatum)

## Realm-ontwerp

Pulso gebruikt één realm per regio:

- `pulso-eu` realm in de EU-cluster
- `pulso-us` realm in de US-cluster

Binnen een realm:

### Clients

| Client-id | Type | Gebruik |
|-----------|------|---------|
| `pulso-web-prod` | Confidential, standard flow | BFF web-kanaal |
| `pulso-ios-prod` | Public, standard flow + PKCE | iOS app |
| `pulso-android-prod` | Public, standard flow + PKCE | Android app |
| `pulso-google-home` | Confidential, standard flow | Google Home Account Linking |
| `pulso-alexa` | Confidential, standard flow | Alexa |
| `pulso-chatgpt-actions` | Confidential, standard flow | ChatGPT Actions |
| `pulso-mgmt` | Confidential, service-account | Pulso-BFF gebruikt voor admin-API |
| `pulso-device-flow` | Public, device flow | Stand-alone wearable + smart glasses |
| **Dynamic clients via DCR** | Public, standard flow + PKCE | Per Claude-MCP-sessie |

### Client scopes

Per scope een definitie (`workouts.read`, `workouts.write`, `health.heartrate.read`, etc.), met:

- **Mapper**: voegt scope toe aan access-token-claim
- **Consent screen text**: expliciete uitleg getoond tijdens authorization

### Identity providers

- **Apple** via `apple` broker (native in Keycloak 24+)
- **Google** via `google` broker
- **Microsoft** via `microsoft` broker
- **Facebook** via `facebook` broker (optioneel)
- **WebAuthn** als authenticator (niet als broker) — passkeys

### First Broker Login flow

Aangepaste flow voor account-linking na social login:

1. Gebruiker komt binnen via Google
2. Keycloak zoekt user op basis van verified email
3. Als gevonden: prompt "We zien dat je al een account hebt — wil je Google koppelen?"
4. Als niet gevonden en email is verified: nieuwe user + automatische koppeling
5. Als niet gevonden en email niet verified: redirect naar eigen verification

Dit wordt gerealiseerd via Keycloak's **Authentication Flow**-editor: een custom First Broker Login-flow met de juiste authenticators.

## Authentication flows

Pulso heeft custom flows voor:

- **Browser flow** — passkey-first, dan social, dan password
- **Direct grant flow** — niet gebruikt (security anti-pattern)
- **Device Code flow** — voor Device Authorization Grant
- **Registration flow** — inclusief disposable-email-check via custom authenticator
- **Reset credential flow** — met CAPTCHA-authenticator
- **First broker login flow** — account-linking na social

Elk flow bestaat uit **authenticators**; Pulso gebruikt built-ins én eigen **SPI-implementaties** waar nodig.

### Voorbeeld — custom authenticator

Voor het enforcen van step-up op gevoelige scopes:

```java
// SensitiveScopeStepUpAuthenticator.java
public class SensitiveScopeStepUpAuthenticator implements Authenticator {
    private static final Set<String> SENSITIVE_SCOPES = Set.of(
        "account.email.change", "account.subscription.manage",
        "account.delete", "account.export"
    );

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        String requestedScopes = context.getAuthenticationSession()
            .getClientNote("scope");
        if (requestedScopes == null) { context.success(); return; }

        Set<String> requested = new HashSet<>(Arrays.asList(requestedScopes.split(" ")));
        requested.retainAll(SENSITIVE_SCOPES);
        if (requested.isEmpty()) { context.success(); return; }

        // Force OTP or passkey step-up
        context.forceChallenge(
            context.form()
                .setAttribute("requested_sensitive", requested)
                .createForm("stepup-challenge.ftl")
        );
    }
}
```

## WebAuthn / passkeys

In Keycloak Admin → Authentication → WebAuthn Policy:

- Relying Party ID: `auth.pulso.com`
- User verification: **required**
- Attestation: **none** of **indirect**
- Resident Keys: **preferred**
- Authenticator attachment: **cross-platform** of **platform**

Passkeys zijn "WebAuthn Register" authenticator in de register-flow; "WebAuthn Authenticator (Passwordless)" in browser-flow — eerste optie voor de user.

## Attack protection

Keycloak-built-ins:

### Brute force detection

Realm settings → Security Defenses → Brute Force Detection:

- Permanent lockout: nee (cyber-burden voor users te hoog)
- Max login failures: 5
- Wait increment: 60 sec
- Max wait: 900 sec
- Failure reset time: 12 uur

### CAPTCHA

Via built-in **reCAPTCHA authenticator** in registration flow (of Cloudflare Turnstile via custom SPI).

### Breached password check

Geen native Keycloak-feature; Pulso implementeert via **Registration Form-action SPI** die HIBP-API aanroept:

```java
public class HibpPasswordCheckAction implements FormAction {
    @Override
    public void validate(ValidationContext context) {
        String password = context.getHttpRequest().getDecodedFormParameters().getFirst("password");
        if (password == null) return;
        String sha1 = DigestUtils.sha1Hex(password).toUpperCase();
        String prefix = sha1.substring(0, 5);
        String suffix = sha1.substring(5);
        // HTTP call to api.pwnedpasswords.com/range/{prefix}
        if (isPwned(prefix, suffix)) {
            context.error("password_breached");
            context.validationError(...);
        }
    }
}
```

### Rate-limiting

Externe laag via AWS WAF + ALB:

- 100 requests/min per IP op `/realms/pulso-eu/protocol/openid-connect/token`
- 20 requests/min per IP op `/realms/pulso-eu/protocol/openid-connect/auth`
- 5 requests/min per IP op register-endpoint

## Refresh-token-rotation

Realm settings → Tokens:

- **Revoke Refresh Token**: aan
- **Refresh Token Max Reuse**: 0
- **Access Token Lifespan**: 1 uur
- **Refresh Token Max Lifespan per client** (via client settings): 30 dagen voor mobile, 7 dagen voor watch, 30 dagen voor voice/LLM

## Dynamic Client Registration

Keycloak ondersteunt DCR native via `/realms/pulso-eu/clients-registrations/openid-connect` endpoint.

Pulso configureert:

- **Trusted Hosts** policy (alleen MCP-clients van bekende origins mogen zich registreren)
- **Scope** policy (beperkt welke scopes een DCR-client mag aanvragen)
- **Client Disabled** policy (nieuw geregistreerde DCR-clients beginnen disabled, Pulso's MCP-server enable't ze na eerste consent)
- **Max Clients per Realm** policy (hard cap ter bescherming tegen abuse)

## Events & audit

Keycloak **Events** zijn configureerbaar per realm:

- **Login events**: alle types aan (login-success, login-failure, refresh-token, etc.)
- **Admin events**: alle types aan
- **Events Listener SPI**: custom listener pusht events naar Pulso's event-ingestion-endpoint (zelfde als Auth0-variant)

```java
public class PulsoEventListener implements EventListenerProvider {
    @Override
    public void onEvent(Event event) {
        // Seralize to JSON, POST to https://api.pulso.com/internal/events
        httpClient.post(Config.INGEST_URL)
            .body(serialize(event))
            .execute();
    }
}
```

## Backups & DR

- Aurora PostgreSQL: daily snapshots + continuous PITR (7 dagen)
- Cross-region replication voor DR: async replica in `eu-central-1` (voor eu-west-1 cluster)
- Infinispan/Redis sessie-cache is **niet** disaster-critical — bij regio-uitval worden users opnieuw gevraagd in te loggen
- Keycloak-config-export wekelijks naar S3 (via `kc.sh export`)

## Upgrade-strategie

- Minor upgrades: maandelijks cadans, rolling
- Major upgrades: elke 12-18 maanden, getest in staging-realm eerst
- Kritieke security-patches: binnen 72 uur, buiten kantooruren
- Database-migraties worden gevalideerd in staging met kopie van prod-schema

## Kosten

- Infrastructuur: EKS-pods, Aurora, Redis — voorspelbare AWS-kosten
- Geen per-MAU-tarief — schaling is infra-gebonden
- Engineering-effort: ~1.5 FTE intern voor Keycloak-beheer
- Compliance-audit: Pulso zelf moet certificeringen voeren, kost extern consult/audit-fees

Break-even met Auth0 ligt (voor Pulso's schaal) bij ~800k MAU; bij 650k is Auth0 nog iets goedkoper als je engineering-tijd meerekent, bij 1M+ is Keycloak duidelijk voordeliger.

## Operationele playbooks

- **Keycloak pod down**: readiness probe haalt uit LB; rolling restart door argoCD
- **Database-contentie**: query-analyse via `pg_stat_statements`, tunables in admin
- **Identity-provider outage (Google/Apple down)**: fallback naar e-mail + wachtwoord + passkey
- **Realm-config drift**: alles in Git, drift-detectie via `kc.sh export` en diff
- **Security incident**: kill-switch om één realm offline te halen (LB-rule)

## Wat self-host NIET oplost

Keycloak beheren betekent:

- Zelf verantwoordelijk voor DDoS-mitigatie op applicatielaag (WAF helpt maar is niet genoeg tegen gerichte auth-endpoint-attacks)
- Zelf verantwoordelijk voor Java CVE's en container-image-CVE's
- Zelf SOC 2 / ISO 27001-bewijs bouwen — géén cert-erfenis van een leverancier
- Zelf een SRE-rotatie onderhouden met Keycloak-expertise — kennis concentreert bij enkelen

Deze trade-offs zijn de prijs voor de controle die self-host oplevert.
