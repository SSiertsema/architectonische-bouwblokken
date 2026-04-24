# Mobile-integratie — Keycloak

AppAuth-iOS en AppAuth-Android zijn OIDC-conformant en werken identiek tegen Auth0 en Keycloak. De implementatie is **nagenoeg identiek** aan variant A; deze pagina benoemt de verschillen.

## Unchanged ten opzichte van variant A

Zie `../variant-a-auth0/mobile-integratie.md` voor:

- AppAuth-iOS en AppAuth-Android setup
- PKCE + Associated Domains / App Links
- Keychain / EncryptedSharedPreferences met biometric unlock
- DPoP-interceptor
- App Attest / Play Integrity
- Refresh-flow + rotation
- Watch / Wear OS-pairing via shared storage

## Verschillen

### 1. Discovery-URL

```swift
// iOS
private let issuer = URL(string: "https://auth.pulso.com/realms/pulso-eu")!
```

```kotlin
// Android
private val issuer = Uri.parse("https://auth.pulso.com/realms/pulso-eu")
```

AppAuth's `discoverConfiguration(forIssuer:)` werkt identiek.

### 2. Client-ID

`pulso-ios-prod` / `pulso-android-prod` zijn in Keycloak public clients met PKCE verplicht. Geen client-secret in de app-code (zoals bij Auth0 ook).

### 3. Scopes en audience

Keycloak gebruikt **geen `audience`-parameter** voor standaard-configs — audience wordt server-side gezet via Audience-mapper op de client-scope. Dus:

```swift
// variant A (Auth0): audience als additionalParameter
let request = OIDAuthorizationRequest(
    ...,
    additionalParameters: ["audience": "https://api.pulso.com/"]
)

// variant B (Keycloak): geen audience-parameter, scope onder een mapper met Audience-config
let request = OIDAuthorizationRequest(
    ...,
    additionalParameters: nil
)
```

### 4. Platform Integrity Verification in Keycloak

Voor App Attest/Play Integrity bouwt Pulso een **custom Authenticator** in de mobile-flow van Keycloak (Java SPI):

```java
public class AppAttestAuthenticator implements Authenticator {
    @Override
    public void authenticate(AuthenticationFlowContext context) {
        String attestHeader = context.getHttpRequest().getHttpHeaders().getHeaderString("X-App-Attest");
        if (!isValidAttest(attestHeader, context.getUser())) {
            context.failure(AuthenticationFlowError.ACCESS_DENIED);
            return;
        }
        context.success();
    }
}
```

De mobile-app stuurt de attest als header mee bij elke token-refresh; Keycloak valideert.

### 5. Refresh-token-rotation en reuse-detection

Gelijkwaardig aan Auth0 ("Revoke Refresh Token" + "Refresh Token Max Reuse=0"). Bij reuse geeft Keycloak een `invalid_grant`-response; de AppAuth-code handelt dit als "login opnieuw vereist".

## Migratie-overwegingen

Als Pulso op enig moment van Auth0 naar Keycloak migreert, raakt de mobile-app minimaal:

1. Issuer-URL wijzigen (config-flag)
2. Client-ID wijzigen (config-flag)
3. `audience`-parameter verwijderen uit auth-request
4. App Attest / Play Integrity integreren met Keycloak SPI in plaats van Auth0 Action
5. Bestaande users krijgen **geen migratie van refresh-tokens** (tokens zijn CIAM-specifiek); alle users worden uitgelogd en moeten opnieuw inloggen

Pulso plant zo'n migratie rondom een app-release-cyclus zodat er tijd is voor geleidelijke uitrol (feature-flag op nieuwe CIAM, rollback mogelijk).
