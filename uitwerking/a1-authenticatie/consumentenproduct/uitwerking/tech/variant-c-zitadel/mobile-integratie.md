# Mobile-integratie — Zitadel

iOS (SwiftUI) en Android (Jetpack Compose) gebruiken **AppAuth** als OIDC-client. Het protocol is identiek aan variant A/B; de verschillen zitten in de Zitadel-specifieke issuer-URL, de extra Zitadel-scopes, en de koppeling naar FastAPI in plaats van Node/Fastify.

## iOS

### Dependencies

- **AppAuth-iOS** — OIDC-client
- **CryptoKit** — P256-sleutels voor DPoP
- **LocalAuthentication** — biometrische gate

### App-registratie in Zitadel

Creëer in `pulso-eu` organisatie / `pulso-platform` project een **Application**:

- **Type**: OIDC Native
- **Authentication method**: None (public client + PKCE)
- **Redirect URIs**:
  - `com.pulso.app://auth.pulso.com/ios/callback`
  - `com.pulso.app://logout`
- **Post-logout Redirect URIs**: `com.pulso.app://logout`
- **Token Settings**:
  - Access Token: JWT
  - Access Token Role Assertion: aan
  - ID Token Role Assertion: aan
  - Refresh Token: aan
  - Refresh Token Idle Expiration: 30 dagen
  - Refresh Token Expiration: 30 dagen (rolling)

Zitadel's **refresh-token-rotation** staat per default aan.

### Auth-service in Swift

```swift
// AuthService.swift
import AppAuth
import LocalAuthentication

final class AuthService {
    static let shared = AuthService()

    private let issuer = URL(string: "https://pulso-eu.zitadel.cloud")!
    private let clientId = "123456789@pulso-platform"   // Zitadel client-id
    private let redirectURI = URL(string: "com.pulso.app://auth.pulso.com/ios/callback")!
    private let scopes = [
        "openid",
        "profile",
        "email",
        "offline_access",
        "urn:zitadel:iam:user:metadata",
        "urn:zitadel:iam:user:resourceowner",
        "urn:zitadel:iam:org:projects:roles",
        "urn:zitadel:iam:org:project:id:123456789:aud",
        "workouts.read",
        "workouts.write",
        "health.heartrate.read",
    ]

    private var authState: OIDAuthState?

    func signIn(from controller: UIViewController) async throws {
        let config = try await OIDAuthorizationService.discoverConfiguration(forIssuer: issuer)

        let request = OIDAuthorizationRequest(
            configuration: config,
            clientId: clientId,
            scopes: scopes,
            redirectURL: redirectURI,
            responseType: OIDResponseTypeCode,
            additionalParameters: [
                "prompt": "login"      // initieel altijd zichtbare UI; daarna silent refresh
            ]
        )

        authState = try await withCheckedThrowingContinuation { cont in
            OIDAuthState.authState(byPresenting: request, presenting: controller) { state, error in
                if let state = state { cont.resume(returning: state) }
                else { cont.resume(throwing: error ?? AuthError.unknown) }
            }
        }

        try await store(authState!)
    }

    private func store(_ state: OIDAuthState) async throws {
        let data = try NSKeyedArchiver.archivedData(withRootObject: state, requiringSecureCoding: true)
        let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,
            nil
        )!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.pulso.auth",
            kSecAttrAccount as String: "authState",
            kSecValueData as String: data,
            kSecAttrAccessControl as String: access
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        if status != errSecSuccess { throw AuthError.keychainStore(status) }
    }

    func restoreState() async throws -> OIDAuthState? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.pulso.auth",
            kSecAttrAccount as String: "authState",
            kSecReturnData as String: true,
            kSecUseOperationPrompt as String: "Ontgrendel Pulso"
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else { return nil }
        authState = try NSKeyedUnarchiver.unarchivedObject(ofClass: OIDAuthState.self, from: data)
        return authState
    }

    func accessToken() async throws -> String {
        guard let state = authState else { throw AuthError.notSignedIn }
        return try await withCheckedThrowingContinuation { cont in
            state.performAction { token, _, error in
                if let t = token { cont.resume(returning: t) }
                else { cont.resume(throwing: error ?? AuthError.unknown) }
            }
        }
    }

    func stepUp(acr: String, from controller: UIViewController) async throws {
        // Forceer een nieuwe authenticatie met sterker acr voor gevoelige acties
        let config = try await OIDAuthorizationService.discoverConfiguration(forIssuer: issuer)
        let request = OIDAuthorizationRequest(
            configuration: config,
            clientId: clientId,
            scopes: scopes,
            redirectURL: redirectURI,
            responseType: OIDResponseTypeCode,
            additionalParameters: [
                "acr_values": acr,
                "prompt": "login",
                "max_age": "0",
            ]
        )
        authState = try await withCheckedThrowingContinuation { cont in
            OIDAuthState.authState(byPresenting: request, presenting: controller) { state, error in
                if let state = state { cont.resume(returning: state) }
                else { cont.resume(throwing: error ?? AuthError.unknown) }
            }
        }
        try await store(authState!)
    }
}

enum AuthError: Error { case notSignedIn, keychainStore(OSStatus), unknown }
```

### API-calls naar FastAPI

```swift
// PulsoAPI.swift
final class PulsoAPI {
    static let shared = PulsoAPI()
    private let base = URL(string: "https://api.pulso.com")!

    func getRecentWorkouts() async throws -> [Workout] {
        let token = try await AuthService.shared.accessToken()
        var req = URLRequest(url: base.appendingPathComponent("/workouts/recent"))
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(DPoPBuilder.build(method: "GET", url: req.url!), forHTTPHeaderField: "DPoP")
        let (data, resp) = try await URLSession.shared.data(for: req)
        // ... decode / error-handling
        return try JSONDecoder().decode([Workout].self, from: data)
    }
}
```

### DPoP

DPoP is door Zitadel ondersteund op niet-Cloud tiers via client-configuratie; op Cloud is het vanaf 2026 beschikbaar op hogere tiers. Als het is ingeschakeld:

```swift
// DPoPBuilder.swift
import CryptoKit

enum DPoPBuilder {
    // P256-sleutel in Secure Enclave; aangemaakt bij eerste app-launch
    static let privateKey: P256.Signing.PrivateKey = try! SecureEnclave.P256.Signing.PrivateKey()

    static func build(method: String, url: URL) -> String {
        let header: [String: Any] = [
            "typ": "dpop+jwt",
            "alg": "ES256",
            "jwk": jwkFromPublicKey(privateKey.publicKey),
        ]
        let claims: [String: Any] = [
            "jti": UUID().uuidString,
            "htm": method,
            "htu": url.absoluteString,
            "iat": Int(Date().timeIntervalSince1970),
        ]
        return signJWT(header: header, claims: claims, key: privateKey)
    }
}
```

FastAPI valideert DPoP alleen als Pulso DPoP op Zitadel heeft ingeschakeld — beide zijden moeten "in" of beide "uit".

## Android

### Dependencies

- **AppAuth-Android** (`net.openid:appauth`)
- **AndroidX Security Crypto** — EncryptedSharedPreferences
- **AndroidX Biometric** — biometrisch gate
- **Play Integrity** — app-attest

### App-registratie

Dezelfde Zitadel-Application maken als voor iOS, met andere redirect-URI:

- `com.pulso.app://auth.pulso.com/android/callback`

### AuthManager in Kotlin

```kotlin
// AuthManager.kt
class AuthManager(private val context: Context) {
    private val issuer = Uri.parse("https://pulso-eu.zitadel.cloud")
    private val clientId = "123456789@pulso-platform"
    private val redirect = Uri.parse("com.pulso.app://auth.pulso.com/android/callback")

    private val authService = AuthorizationService(context)
    private val storage = EncryptedSharedPreferences.create(
        context,
        "pulso_auth",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val scopes = listOf(
        "openid", "profile", "email", "offline_access",
        "urn:zitadel:iam:user:metadata",
        "urn:zitadel:iam:user:resourceowner",
        "urn:zitadel:iam:org:projects:roles",
        "urn:zitadel:iam:org:project:id:123456789:aud",
        "workouts.read", "workouts.write", "health.heartrate.read"
    )

    suspend fun signIn(activity: Activity) {
        val config = AuthorizationServiceConfiguration.fetchFromIssuer(issuer)
        val req = AuthorizationRequest.Builder(
            config, clientId, ResponseTypeValues.CODE, redirect
        ).setScopes(*scopes.toTypedArray()).build()

        val intent = authService.getAuthorizationRequestIntent(req)
        activity.startActivityForResult(intent, RC_SIGN_IN)
    }

    fun handleResponse(resp: AuthorizationResponse?, err: AuthorizationException?) {
        if (resp == null) return
        val state = AuthState(resp, null)
        authService.performTokenRequest(
            resp.createTokenExchangeRequest(),
            NoClientAuthentication.INSTANCE  // public client, geen secret
        ) { tokenResp, tokenErr ->
            if (tokenResp != null) {
                state.update(tokenResp, null)
                storage.edit().putString("state", state.jsonSerializeString()).apply()
            }
        }
    }

    suspend fun freshAccessToken(activity: FragmentActivity): String {
        ensureBiometricUnlock(activity)
        val state = AuthState.jsonDeserialize(storage.getString("state", null)!!)
        return suspendCancellableCoroutine { cont ->
            state.performActionWithFreshTokens(authService) { token, _, err ->
                if (token != null) cont.resume(token) else cont.resumeWithException(err!!)
            }
        }
    }

    private suspend fun ensureBiometricUnlock(activity: FragmentActivity) {
        // BiometricPrompt with BIOMETRIC_STRONG class
    }
}
```

### Play Integrity

```kotlin
val integrity = IntegrityManagerFactory.create(context)
val nonce = fetchNonceFromBackend()
val token = integrity.requestIntegrityToken(
    IntegrityTokenRequest.builder().setNonce(nonce).build()
).await().token()
// Stuur naar FastAPI /internal/device-attest; backend valideert via Play Integrity API
// en zet user-metadata in Zitadel (play_integrity_valid=true) via Management API
```

## Device Flow — smart glasses / stand-alone wearable

Zitadel heeft Device Authorization Grant first-class. Op een device met beperkte UI:

```kotlin
// Simpel voorbeeld — aanpasbaar voor watchOS / Meta Ray-Ban
suspend fun startDeviceFlow(): DeviceFlowStart {
    val resp = httpClient.post("https://pulso-eu.zitadel.cloud/oauth/v2/device_authorization") {
        url {
            parameters.append("client_id", deviceFlowClientId)
            parameters.append("scope", "openid profile workouts.read coaching.stream")
        }
    }
    return resp.body<DeviceFlowStart>()
    // start.user_code → toon op scherm + QR met verification_uri_complete
}

suspend fun pollToken(deviceCode: String): String? {
    val resp = httpClient.post("https://pulso-eu.zitadel.cloud/oauth/v2/token") {
        parameter("grant_type", "urn:ietf:params:oauth:grant-type:device_code")
        parameter("device_code", deviceCode)
        parameter("client_id", deviceFlowClientId)
    }
    if (resp.status.value == 400) {
        // authorization_pending → wacht interval sec
        return null
    }
    return resp.body<TokenResp>().accessToken
}
```

## Watch / Wear OS-pairing

Zelfde patroon als variant A/B: de watch-app krijgt geen eigen OAuth-flow, maar deelt een **refresh-token** met de parent-iOS / parent-Android-app via:

- iOS: Keychain Access Group (`com.pulso.app` + `com.pulso.watch`)
- Android: AccountManager met shared UID

De watch-app gebruikt vervolgens hetzelfde refresh-token om `api.pulso.com` rechtstreeks aan te roepen. De Zitadel-kant merkt niet dat het een watch is — het ziet alleen token-refreshes op dezelfde session-family.

## Kritische configuratie-checklist voor Zitadel mobile-apps

- [ ] Application-type: **OIDC Native**
- [ ] Authentication method: **None (public + PKCE)**
- [ ] Redirect-URIs met custom schemes (`com.pulso.app://...`)
- [ ] "Development mode" van Zitadel-application **uit** in productie (anders wordt unverified PKCE geaccepteerd)
- [ ] Refresh-token-rotation: aan
- [ ] Audience-scope expliciet gevraagd (`urn:zitadel:iam:org:project:id:<ID>:aud`) zodat FastAPI de token accepteert
- [ ] Project-roles assertion aan in Token Settings, als Pulso rollen uit de token wil lezen (family-owner, support, etc.)

## Wat hetzelfde blijft als variant A/B

- AppAuth-bibliotheek aan beide kanten
- Keychain / EncryptedSharedPreferences met biometrische gate
- Refresh-token-rotation + reuse-detectie
- Watch/Wear OS via shared storage
- Device Flow voor limited-UI devices

Enige verschil is de Zitadel-specifieke issuer-URL en de Zitadel-specifieke scopes (`urn:zitadel:...`) die de token verrijken.
