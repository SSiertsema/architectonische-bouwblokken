# 02 — Identiteitsarchitectuur

## Topologie

In tegenstelling tot casus 1, waar een bestaande corporate IdP (Entra ID) gegeven is, begint een CIAM-casus bij het ontwerp van de identiteitsopslag zelf. De keten voor een Pulso-gebruiker is korter en tegelijk breder vertakt:

```
[Eindgebruiker] — signup / login
     │
     ▼
[CIAM-platform]                     primaire opslag van user + identity + consent
     │   ├── e-mail/wachtwoord
     │   ├── passkeys (WebAuthn credentials per user)
     │   ├── social connections: Apple, Google, Microsoft, Facebook
     │   └── refresh-token store
     │
     ├──(OIDC / OAuth 2.0)──► Pulso web (SPA + BFF)
     ├──(OAuth 2.0 + PKCE)──► Pulso iOS (native public client)
     ├──(OAuth 2.0 + PKCE)──► Pulso Android (native public client)
     ├──(OAuth 2.0 Device Flow)──► Pulso smart glasses / stand-alone wearable
     ├──(OAuth 2.0 Account Linking)──► Google Home / Alexa
     ├──(OAuth 2.0 + DCR)──► LLM-integraties (ChatGPT Actions, Claude MCP-server)
     │
     └──► Pulso application DB (eigen user-profiel, abonnement, workouts)
                     │
                     └── gekoppeld aan CIAM-`sub` als stabiele sleutel
```

Centraal: het **CIAM-platform is de bron van authenticatie, niet van het applicatieve gebruikersprofiel**. De identity-laag weet wie je bent en hoe je dat bewijst (wachtwoord, passkey, federatief); de applicatie weet wat je als gebruiker bent (trainingsniveau, abonnementstype, voorkeuren). De brug tussen beide is de stabiele `sub`-claim.

## User vs. identity — datamodel

Een CIAM-platform kent twee onderling gerelateerde concepten die bij eerste kennismaking makkelijk door elkaar lopen:

- **User (account)** — één Pulso-gebruiker, één abonnement, één set preferences
- **Identity (connection)** — één manier waarop die user zich bewijst (e-mail+wachtwoord, Apple-identiteit, Google-identiteit, passkey A op iPhone, passkey B op MacBook)

Eén user kan meerdere identities hebben (Amira logt in met Apple én met passkey; dat is dezelfde user met twee identities). Dit model draagt:

- **Account-linking** — wanneer een gebruiker eerst met e-mail registreert en later "Sign in with Google" gebruikt met hetzelfde verified e-mail, wordt dezelfde user herkend in plaats van een duplicaat
- **Social-drift-opvang** — raakt een gebruiker zijn Facebook-account kwijt, dan kan hij via een andere identity (e-mail of andere social) alsnog inloggen op dezelfde user
- **Credential-isolation** — een gecompromitteerde identity kan ingetrokken worden zonder de user te verliezen

Platform-terminologie verschilt; het onderliggende model niet:

| Platform | "User" heet | "Identity" heet |
|----------|-------------|-----------------|
| Auth0 | User | Identity (array op user) — één per connection |
| Entra External ID | User (consumer) | Federated credentials / local credentials |
| Amazon Cognito | User | IdP-linked identity |
| Keycloak | User | Identity (per Identity Provider) + credentials |
| Stytch | User | Authentication method (per member) |
| Firebase Auth | User | Provider data (per sign-in method) |

## CIAM-platformlandschap

Casus 5 verplicht zich bewust niet aan één leverancier. De ontwerp-uitkomst moet op meerdere platformen met vergelijkbare inspanning te realiseren zijn. Het landschap valt uiteen in vier categorieën.

### Managed CIAM-platformen (SaaS, enterprise)

| Platform | Kenmerk | Sterk in | Let op |
|----------|---------|----------|--------|
| **Auth0 (Okta CIC)** | Marktleider, brede features | Actions (no-code extensions), Universal Login, Bot Detection, Adaptive MFA, Passkeys | MAU-pricing kan schaal-kostbaar worden; lock-in in Rules/Actions |
| **Okta Customer Identity Cloud** | Enterprise-variant Auth0 | SLA, audits, private clouds | Prijsklasse; dezelfde basis |
| **Microsoft Entra External ID** | Opvolger van Azure AD B2C | Microsoft-stack-integratie, External ID for customers | Feature-gap met B2C nog niet gesloten; custom policies complex |
| **Amazon Cognito** | AWS-native | Kostenefficiënt op schaal, IAM-integratie | UX op self-service; hosted UI beperkt |
| **Google Identity Platform** | Firebase Auth op schaal | Mobile-first erfgoed, GCP-integratie | Admin UI sober; meeste features via SDK |
| **Ping Identity (PingOne for Customers)** | Enterprise | Federatie, advanced authentication (DaVinci) | Enterprise-prijsschaal |
| **ForgeRock Identity Cloud** | Onderdeel van Ping | Klassieke IAM-volwassenheid | Complex, zwaar |

### Developer-first managed CIAM (nieuwere generatie)

| Platform | Kenmerk | Sterk in | Let op |
|----------|---------|----------|--------|
| **Stytch** | API-first | Passwordless, passkeys, mobile SDK's | Geen hosted UI, alles self-built |
| **Clerk** | Frontend-first | React/Next.js integratie, snelle UX, "sign-in as" | Minder flexibel buiten React-ecosysteem |
| **Descope** | Drag-and-drop flows | No-code flow-builder, passkeys, risk signals | Vendor-specifieke flows moeilijk te migreren |
| **Frontegg** | B2B+B2C | Self-service tenanting, entitlements | Minder pure consumer-focus |
| **WorkOS** | B2B-schakel | SSO-federatie naar enterprise | Meer B2B dan B2C |
| **Supabase Auth** | BaaS-component | Integratie in Supabase-ecosysteem | Beperktere consumer-features |
| **Firebase Authentication** | Mobile BaaS | Mobile SDK's, social | Beperkte enterprise-features |

### Self-hosted / open source

| Platform | Kenmerk | Sterk in | Let op |
|----------|---------|----------|--------|
| **Keycloak** | Red Hat, grootste open source | OIDC/SAML volledig, realm-concept, admin-UI | Operationele inspanning, Java-stack, upgrades |
| **Ory Stack** (Kratos + Hydra + Keto + Oathkeeper) | Modulair, cloud-native | Microservices, fine-grained authz | Meer bewegende delen, eigen integratie nodig |
| **Authentik** | Python-based modern | Dev-vriendelijk, Docker-first | Kleinere community dan Keycloak |
| **FusionAuth** | Downloadable + SaaS | Goede feature-pariteit met managed | Commerciële licentie bij schaal |
| **SuperTokens** | Open-core | Self-host + managed, recipe-based | Jonger, beperktere ecosysteem |
| **Zitadel** | Rust/Go | Multi-tenant, modern, event-sourced | Jonger, community nog beperkt |

### Identiteit-als-component (sociale federatie)

"Sign in with Apple / Google / Microsoft / Facebook / X" is **nooit een volwaardig CIAM**, maar wel een cruciale federatie-laag bovenop een van de bovenstaande. Speciale aandachtspunten:

- **Sign in with Apple** — verplicht in iOS-apps die andere social-login bieden; hashed e-mail-relay
- **Sign in with Google** — meest-gebruikte social; GIS SDK
- **Sign in with Microsoft** — relevant door overlap met werk-accounts (Entra ID-consumerkant)
- **Facebook Login** — in afname; ruilrelatie privacy-risico vs. bereik
- **Sign in with X (voorheen Twitter)** — in afname; beleidswijzigingen maken de koppeling minder betrouwbaar

## Selectiecriteria

Pulso weegt platformen op de volgende criteria. Per criterium is voorbij "wat de slide zegt" gekeken naar "wat het betekent in gebruik".

| Criterium | Wat het in praktijk betekent |
|-----------|------------------------------|
| **Kostenmodel** | Per MAU (Auth0, Stytch, Clerk), per auth (Cognito), flat license (Keycloak zelf, dan infra), per tenant (Frontegg) — boven 500k MAU is verschil materieel |
| **Data-residency** | EU-datacenters vereist voor EU-gebruikers; Auth0 EU-region, Entra EU, Cognito eu-*, Keycloak self-host op eigen keuze |
| **Passkeys-volwassenheid** | Ondersteuning voor resident keys, cross-device, attestation; niet elk platform is even ver |
| **Mobile SDK-kwaliteit** | First-party SDK's voor iOS/Android, support voor AppAuth-patroon, biometric unlock op refresh |
| **Device Authorization Grant** | Voor smart glasses / stand-alone wearable — niet in elke managed dienst direct beschikbaar |
| **Account Linking recipe** | Voor Google Home / Alexa — moet OAuth 2.0-standard zijn; platform moet juiste redirect-URI-shape accepteren |
| **Dynamic Client Registration** | Voor LLM-integraties (MCP) — niet elk platform ondersteunt DCR out-of-the-box |
| **Consent-registratie** | Zit het in het platform of wordt het apart bijgehouden? Auth0 Actions kunnen het; Cognito niet; Keycloak via extension |
| **Admin-UX voor non-engineers** | Support-team moet e-mailadressen kunnen vervangen, sessies uitloggen, users lockouten — zonder database-toegang |
| **Observability-integratie** | Webhooks of event-streams naar Datadog/Sentinel; SIEM-exports |
| **Certificeringen** | SOC 2 Type II, ISO 27001, HIPAA (relevant door gezondheidsdata) |
| **Lock-in-risico** | Hoe moeilijk is migratie? Een platform met vendor-specifieke flow-engine maakt exit lastig |
| **Community + SDK-onderhoud** | Actief project? Last commit? Security advisories afgehandeld? |

## Pulso's keuze-proces in deze casus

Deze casus behandelt beide eindpunten van het spectrum:

- **Auth0** als "full-managed, minste ops-last, hoogste feature-velocity" — dit is het pad dat Pulso vandaag volgt en dat in de Variant A van de tech/-sectie wordt uitgewerkt
- **Keycloak** als "volledige controle, voorspelbare kosten op schaal, geen vendor lock-in" — dit is het alternatief dat Pulso serieus overweegt en dat in de Variant B van de tech/-sectie wordt uitgewerkt

De andere platformen worden in vergelijkingstabellen genoemd zodat lezers die een andere combinatie overwegen (bijvoorbeeld Cognito bij een AWS-native stack, of Stytch voor een API-first benadering) kunnen zien waar de verschillen zitten.

## Protocollen en standaarden

In een consumentenproduct speelt een breder protocol-palet dan in een corporate tool. Relevante standaarden:

| Standaard | Waar | Waarom |
|-----------|------|--------|
| **OpenID Connect** | Web + mobile + voice + LLM | Identity-laag bovenop OAuth 2.0 |
| **OAuth 2.0 / 2.1** | Overal | Autorisatie-protocol |
| **PKCE (RFC 7636)** | Mobile + web SPA + LLM | Verplicht voor public clients |
| **OAuth 2.0 Device Authorization Grant (RFC 8628)** | Smart glasses, stand-alone wearable | Voor devices zonder volwaardige browser |
| **WebAuthn / FIDO2** | Passkeys op alle platforms | Phishing-resistent, device-gebonden of synced |
| **CIBA (Client-Initiated Backchannel Authentication)** | Nog niet actief — kandidaat voor bijvoorbeeld voice-bevestiging op telefoon | Decoupled auth |
| **DPoP (RFC 9449)** | Mobile, LLM-clients | Sender-constrained tokens |
| **Dynamic Client Registration (RFC 7591/7592)** | LLM-integraties | MCP-servers kunnen zichzelf registreren |
| **OAuth Token Exchange (RFC 8693)** | Eventueel voor kanaal-specifieke tokens | Token met gereduceerde scope voor deel-systemen |
| **FAPI 1.0 / 2.0** | Niet verplicht voor Pulso (geen PSD2) | Referentie voor high-security profielen |

De grondprincipes (Authorization Code Flow + PKCE, BFF voor web, public client voor mobile, Device Flow voor limited-UI) zijn platform-onafhankelijk. Platformkeuze bepaalt de *tooling*, niet het *model*.

## Netwerkpositie

Pulso is cloud-native in AWS. De identiteitslaag staat in dezelfde regio's als de rest van het platform, met bewust twee netwerklagen:

```
[User] ──HTTPS──► [CloudFront + AWS WAF] ──► [Pulso-services of CIAM-endpoints]

Managed (Auth0):
    CIAM-endpoints wonen bij Auth0 (auth.pulso.com via custom domain)
    Verkeer van BFF/mobile/voice skills naar Auth0 loopt over internet met TLS + mTLS waar mogelijk

Self-hosted (Keycloak):
    Keycloak draait in Pulso's VPC, achter ALB + AWS WAF
    Database: Aurora PostgreSQL (eigen cluster of gedeeld)
    Sessie-cache: ElastiCache (Redis)
    Admin-UI: alleen via bastion/VPN, niet publiek
```

Alle endpoints waarop authentieke gebruikers landen (login, callback, device-code) zitten achter WAF met daar toegesneden regels: rate-limiting op `/authorize` en `/token`, challenge op verdachte user-agents, geo-fencing per regio-indeling.

## Multi-region en data-residency

Pulso biedt EU-gebruikers expliciete EU-hosting. Praktisch:

- **User-record** bevat een `region`-attribuut, gezet bij signup op basis van IP + user-keuze
- Auth0 Tenant: één EU-tenant en één US-tenant; bij signup wordt naar de juiste tenant geleid (domain-based of landing-page-based)
- Keycloak: aparte realms per regio in eigen regio-cluster
- Cross-region uitwisseling van identity-data is verboden; alleen metagegevens (anoniem kwantitatief) voor aggregaat-rapportage
- Data-export voor migratie tussen regio's: alleen op expliciet gebruikersverzoek (lees: AVG-recht)

## Scope naar A2

Deze map beschrijft **identity** (wie ben je, hoe bewijs je dat, welke claims gaan naar de applicatie). Autorisatie (wat mag je, welk abonnement heb je, ben je family-plan-eigenaar of -lid) valt onder **A2 — Autorisatie**. De brug tussen beide is:

- `sub` (stabiele user-identifier)
- `email`, `email_verified`
- `amr` (welke auth-factoren zijn gebruikt — input voor step-up-beslissingen in A2)
- `acr` (authentication context class — "gewone login" vs. "recent step-up")
- Optioneel: `azp` (authorized party — voor multi-client setups)

Alle claims en hun semantiek worden in `06-consent-profielclaims.md` gedetailleerd.
