# Mobile-integratie — Auth0

iOS (SwiftUI) en Android (Jetpack Compose) met **AppAuth** als OIDC-client. Public client + PKCE + biometric unlock + DPoP + app-attest / Play Integrity.

## iOS

### Dependencies

- **AppAuth-iOS** (`github.com/openid/AppAuth-iOS`) — OIDC-client
- **Auth0.swift** (`github.com/auth0/Auth0.swift`) — optioneel; Pulso kiest AppAuth voor platform-portabiliteit met Variant B

### Client-registratie

Een `pulso-ios-prod` Application in Auth0 (Native type):

- Callback URLs: `com.pulso.app://auth.pulso.com/ios/callback`
- Refresh Token Rotation: aan
- Absolute Expiration: 30 dagen
- Token-auth: geen secret (public client)

### Associated domains

Pulso's iOS-app claimt `auth.pulso.com` via `apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.pulso.app",
      "paths": ["/ios/callback"]
    }]
  }
}
```

### Auth-service in Swift

```swift
// AuthService.swift
import AppAuth
import LocalAuthentication

final class AuthService {
    static let shared = AuthService()

    private let issuer = URL(string: "https://auth.pulso.com/")!
    private let clientId = "pulso-ios-prod"
    private let redirectURI = URL(string: "com.pulso.app://auth.pulso.com/ios/callback")!
    private let scopes = ["openid", "profile", "email", "offline_access", "workouts.read", "workouts.write"]

    private var authState: OIDAuthState?

    func signIn(from controller: UIViewController) async throws {
        let config = try await OIDAuthorizationService.discoverConfiguration(forIssuer: issuer)

        let request = OIDAuthorizationRequest(
            configuration: config,
            clientId: clientId,
            scopes: scopes,
            redirectURL: redirectURI,
            responseType: OIDResponseTypeCode,
            additionalParameters: ["audience": "https://api.pulso.com/"]
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
        let state = try NSKeyedUnarchiver.unarchivedObject(ofClass: OIDAuthState.self, from: data)
        authState = state
        return state
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
}

enum AuthError: Error { case notSignedIn, keychainStore(OSStatus), unknown }
```

### DPoP

AppAuth heeft geen ingebouwde DPoP-support; Pulso voegt het toe via een URLSession-middleware:

```swift
// DPoPInterceptor.swift
import Foundation
import CryptoKit

final class DPoPInterceptor: URLProtocol {
    override class func canInit(with request: URLRequest) -> Bool {
        return request.url?.host == "api.pulso.com"
    }

    override func startLoading() {
        var req = request
        let dpop = DPoPTokenBuilder.build(method: req.httpMethod ?? "GET", url: req.url!)
        req.setValue(dpop, forHTTPHeaderField: "DPoP")
        // forward request...
    }
}
```

`DPoPTokenBuilder` gebruikt een `P256.Signing.PrivateKey` uit de Secure Enclave om een `dpop+jwt` te ondertekenen.

### App Attest

Bij eerste launch of na 7 dagen:

```swift
import DeviceCheck

func performAppAttest() async throws -> Data {
    let service = DCAppAttestService.shared
    let keyId = try await service.generateKey()
    let challenge = try await fetchChallenge()  // haal van pulso-backend
    let attest = try await service.attestKey(keyId, clientDataHash: SHA256.hash(data: challenge))
    return attest  // stuur naar backend
}
```

Backend stuurt attest door naar een Auth0 Action via `user_metadata.app_attest_valid=true`. Ongeldige attest → user geblokkeerd.

## Android

### Dependencies

- **AppAuth-Android** (`net.openid:appauth:0.11.1` of nieuwer)
- **AndroidX Security Crypto** voor EncryptedSharedPreferences
- **AndroidX Biometric**
- **Play Integrity** via `com.google.android.play:integrity`

### Client-registratie

`pulso-android-prod` Application in Auth0 met:

- Callback: `com.pulso.app://auth.pulso.com/android/callback`
- App Links voor Digital Asset Links in manifest

### Auth-manager in Kotlin

```kotlin
// AuthManager.kt
class AuthManager(private val context: Context) {
    private val issuer = Uri.parse("https://auth.pulso.com/")
    private val clientId = "pulso-android-prod"
    private val redirect = Uri.parse("com.pulso.app://auth.pulso.com/android/callback")

    private val authService = AuthorizationService(context)
    private val storage = EncryptedSharedPreferences.create(
        context,
        "pulso_auth",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    suspend fun signIn(activity: Activity) {
        val serviceConfig = AuthorizationServiceConfiguration.fetchFromIssuer(issuer)
        val req = AuthorizationRequest.Builder(
            serviceConfig,
            clientId,
            ResponseTypeValues.CODE,
            redirect
        ).setScopes("openid", "profile", "email", "offline_access", "workouts.read", "workouts.write")
         .setAdditionalParameters(mapOf("audience" to "https://api.pulso.com/"))
         .build()

        val intent = authService.getAuthorizationRequestIntent(req)
        activity.startActivityForResult(intent, RC_SIGN_IN)
    }

    fun handleResponse(resp: AuthorizationResponse?, err: AuthorizationException?) {
        if (resp == null || err != null) return
        val state = AuthState(resp, null)
        authService.performTokenRequest(
            resp.createTokenExchangeRequest(),
            ClientSecretPost("")  // public client, no secret
        ) { tokenResp, tokenErr ->
            if (tokenResp != null) {
                state.update(tokenResp, null)
                storeState(state)
            }
        }
    }

    private fun storeState(state: AuthState) {
        storage.edit().putString("state", state.jsonSerializeString()).apply()
    }

    suspend fun freshAccessToken(activity: FragmentActivity): String {
        ensureBiometricUnlock(activity)
        val state = AuthState.jsonDeserialize(storage.getString("state", null)!!)
        return suspendCancellableCoroutine { cont ->
            state.performActionWithFreshTokens(authService) { token, _, err ->
                if (token != null) cont.resume(token) else cont.resumeWithException(err ?: Exception("unknown"))
            }
        }
    }

    private suspend fun ensureBiometricUnlock(activity: FragmentActivity) {
        // BiometricPrompt-flow voor strong biometric
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
// stuur token naar backend
```

Backend valideert via Google Play Integrity API en update Auth0 `user_metadata.play_integrity_valid`.

## Refresh-flow op app-open

1. App start → biometric unlock → lees AuthState uit secure storage
2. Als access_token verlopen: performActionWithFreshTokens → POST /token (grant_type=refresh_token)
3. Auth0 levert nieuw access + nieuw refresh (rotation)
4. AppState opgeslagen
5. API-calls met Bearer-token (en DPoP op iOS)

Als POST /token 400 terugkomt met `invalid_grant` — reuse-detectie geactiveerd of refresh verlopen — dan reset-state + verwijzen naar signIn().

## Deeplinks en universal links

- iOS `applinks` via AASA (zie boven); ook `com.pulso.app`-custom URL scheme voor niet-Universal-Link-omgevingen
- Android `autoVerify="true"` app-links + Digital Asset Links-bestand op `https://pulso.com/.well-known/assetlinks.json`

## Uitloggen

- Verwijder AuthState uit storage
- Optioneel: call `/v2/logout?client_id=...&federated` om federated IdP-sessie mee te beëindigen (minder gangbaar bij mobile dan web)

## Watch / Wear OS-pairing

Na succesvolle iOS-login schrijft de app het refresh-token naar een **Shared Keychain Access Group** zodat de watch-app het kan lezen zonder eigen login-flow. Android-Wear OS equivalent via `AccountManager` met shared `UserHandle`.
