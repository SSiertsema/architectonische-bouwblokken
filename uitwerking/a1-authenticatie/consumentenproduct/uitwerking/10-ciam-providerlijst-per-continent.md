# 10 — CIAM-providerlijst per continent

Dit bestand is een **catalogus** bedoeld om een kwalitatieve CIAM-shortlist te maken zonder eerst zelf te hoeven zoeken. Groepering is primair op **HQ-continent** (leveranciers-origin en legal-entity-jurisdictie); een aparte paragraaf laat zien **waar de data fysiek gehost kan worden**. Die twee dimensies vallen vaak niet samen — een US-leverancier kan EU-hosting aanbieden.

Selectie-advies bovenaan (hoe deze lijst te gebruiken):

1. **Start met je juridische harde grens** — EHDS, AVG-rechtsgrondslag, sectorregulering. Dit bepaalt welke jurisdictie toegestaan is.
2. **Voeg je data-residency-eis toe** — moet data fysiek in EU blijven? EEA-only? EU + "adequaat" land zoals Zwitserland / UK?
3. **Bepaal je type** — managed SaaS, developer-first managed, self-hosted open source, BaaS, of social-only.
4. **Toets functionele must-haves** — passkeys-volwassenheid, mobile SDK's, Device Flow, DCR voor LLM, Account Linking voor voice.
5. **Weeg lock-in en kosten** — per MAU vs. per infra, lock-in via vendor-specifieke rules-engines, exit-kosten bij migratie.

De lijst is **geselecteerd**, niet uitputtend. Focus: serieuze, actief onderhouden, voor consumer-IAM (CIAM) relevante oplossingen met traceerbare HQ.

---

## Europa

Europese HQ of primaire legal-entity in Europa. Meestal sterk op AVG-compliance en EU-data-residency als kernpropositie.

### Managed CIAM (SaaS, commercieel)

| Provider | HQ | Type | Data-regio's | Kenmerken | Link |
|----------|-----|------|---------------|-----------|------|
| **One Welcome (Thales CIAM)** | NL / FR (Thales) | Managed enterprise CIAM | EU | Voortgekomen uit iWelcome (NL); sterk op AVG; enterprise B2B+B2C | [thalesgroup.com/en/markets/digital-identity-and-security/identity-access-management-solutions](https://cpl.thalesgroup.com/access-management/onewelcome-identity-platform) |
| **Ubisecure** | Helsinki, FI | Managed CIAM | EU | Vooral Noord-Europa; sterk op delegated admin (family / organizations) | [ubisecure.com](https://www.ubisecure.com/) |
| **Nevis** | Zürich, CH | Managed + self-host CIAM | EU (CH, DE) | Sterk in Zwitserse financiële sector; FIDO2/passkey-nadruk | [nevis.net](https://www.nevis.net/) |
| **Signicat** | Trondheim, NO | Managed CIAM + identity verification | EU | Sterk op BankID en eIDAS-gekoppelde inlog; consumer + KYC gecombineerd | [signicat.com](https://www.signicat.com/) |
| **Criipto** | Kopenhagen, DK | Managed CIAM | EU | BankID Noord-Europa; e-ID's; developer-vriendelijk | [criipto.com](https://www.criipto.com/) |
| **Reach Five** | Parijs, FR | Managed CIAM | EU | B2C-focus; loyaliteitsprogramma-integratie; retail | [reachfive.com](https://www.reachfive.com/) |
| **Cidaas** | Oppenweiler, DE | Managed CIAM | EU (DE) | Sterke AVG-positionering; progressive profiling; delegated admin | [cidaas.com](https://www.cidaas.com/) |
| **Yoti** | Londen, UK | Digital identity + CIAM | EU + UK | Sterk op reusable-identity en age-verification; consumer-first | [yoti.com](https://www.yoti.com/) |
| **IDnow** | München, DE | Identity verification + CIAM-laag | EU | Primair KYC; authenticatie-component voor regulated industries | [idnow.io](https://www.idnow.io/) |
| **Scaled Access** | België (deel van OneWelcome / Thales) | Relationship-based access | EU | Overgenomen; rol-gebaseerde family/organization-modellen | zie One Welcome |
| **Evidos** | Haarlem, NL | Signing + identity | EU | Primair documentondertekening; auth-component | [evidos.nl](https://www.evidos.nl/) |

### Open source / self-host (Europese-origin of -community)

| Provider | HQ / oorsprong | Type | Kenmerken | Link |
|----------|-----------------|------|-----------|------|
| **Ory Stack** (Kratos, Hydra, Keto, Oathkeeper) | München, DE | Open source + managed cloud | Modulair; cloud-native; fine-grained authz | [ory.sh](https://www.ory.sh/) |
| **Zitadel** | Zürich, CH | Open source + managed cloud | Modern, multi-tenant, event-sourced | [zitadel.com](https://zitadel.com/) |
| **Authentik** | Community (DE/NL/global) | Open source, self-host | Docker-first, modern UI, SSO + CIAM | [goauthentik.io](https://goauthentik.io/) |
| **privacyIDEA** | Kassel, DE | Open source MFA-server | Sterk op MFA-tokens; combineerbaar met Keycloak | [privacyidea.org](https://www.privacyidea.org/) |

### Identity verification / BankID-federatie (complement op CIAM)

| Provider | Focus | Landen |
|----------|-------|--------|
| **iDIN** | Nederlandse banken-federatie voor consumer-inlog | NL |
| **itsme** | Belgische mobiele ID-app | BE |
| **SwissID** | Zwitserse federatie | CH |
| **VerimiID** | Duitse consortium-ID | DE |
| **NemID / MitID** | Deense nationale ID | DK |
| **BankID** | Zweeds/Noorse banken-ID | SE, NO |

Deze worden zelden als enige inlog-IdP gebruikt maar vaak als federatie-bron bovenop een managed CIAM.

---

## Noord-Amerika

Grootste concentratie CIAM-leveranciers wereldwijd. HQ meestal US (Delaware-inc), soms Canada. Bijna allemaal bieden EU-hosting; bijna geen enkele is jurisdictie-neutraal wat de **legal-entity**-klus betreft (CLOUD Act blijft van toepassing op US-HQ-bedrijven).

### Managed enterprise CIAM

| Provider | HQ | Data-regio's | Kenmerken | Link |
|----------|-----|---------------|-----------|------|
| **Auth0 (Okta Customer Identity)** | San Francisco, US | US / EU / AU / JP | Marktleider; rijk ecosysteem; Actions voor extensie | [auth0.com](https://auth0.com/) |
| **Okta Customer Identity Cloud** | San Francisco, US | Meer regio's incl. private cloud | Enterprise-variant van Auth0; SLA; private cloud-optie | [okta.com/customer-identity](https://www.okta.com/customer-identity/) |
| **Microsoft Entra External ID** | Redmond, US | Wereldwijd (Azure-regio's) | Opvolger Azure AD B2C; Microsoft-stack | [microsoft.com/security/business/identity-access/microsoft-entra-external-id](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-external-id) |
| **Amazon Cognito** | Seattle, US | Alle AWS-regio's | Kostenefficiënt op schaal; AWS-native | [aws.amazon.com/cognito](https://aws.amazon.com/cognito/) |
| **Google Identity Platform / Firebase Authentication** | Mountain View, US | Alle GCP-regio's | Mobile-first erfgoed; GCP-integratie | [cloud.google.com/identity-platform](https://cloud.google.com/identity-platform) |
| **Ping Identity (PingOne for Customers)** | Denver, US | Multi-regio | Enterprise federatie; DaVinci orchestration | [pingidentity.com](https://www.pingidentity.com/) |
| **ForgeRock Identity Cloud** (onderdeel Ping) | Denver, US (historisch NO) | Multi-regio | Klassieke IAM-volwassenheid | zie Ping Identity |
| **IBM Security Verify** | Armonk, US | Multi-regio | Enterprise; sterk in gereguleerde sectoren | [ibm.com/products/verify-saas](https://www.ibm.com/products/verify-saas) |
| **LoginRadius** | Vancouver, CA | NA / EU / APAC | CIAM-specialist; B2C-focus | [loginradius.com](https://www.loginradius.com/) |
| **OneLogin** (One Identity) | San Francisco, US | Multi-regio | Meer workforce; CIAM-laag | [onelogin.com](https://www.onelogin.com/) |
| **JumpCloud** | Louisville (CO), US | NA / EU | Workforce-first, CIAM als addon | [jumpcloud.com](https://jumpcloud.com/) |

### Developer-first managed CIAM (nieuwere generatie)

| Provider | HQ | Data-regio's | Kenmerken | Link |
|----------|-----|---------------|-----------|------|
| **Stytch** | San Francisco, US | US / EU | API-first; passwordless; passkeys | [stytch.com](https://stytch.com/) |
| **Clerk** | San Francisco, US | US / EU | React/Next-first; pre-built UI | [clerk.com](https://clerk.com/) |
| **Descope** | Los Altos, US | US / EU | No-code flow-builder | [descope.com](https://descope.com/) |
| **Frontegg** | New York, US (IL-founders) | US / EU | B2B+B2C; self-service tenanting | [frontegg.com](https://frontegg.com/) |
| **WorkOS** | San Francisco, US | US / EU | Enterprise SSO-brug (meer B2B) | [workos.com](https://workos.com/) |
| **Supabase Auth** | Singapore (inc)/global | Multi-regio | BaaS-component | [supabase.com/auth](https://supabase.com/auth) |
| **Userfront** | US | US | Developer-first, kleine teams | [userfront.com](https://userfront.com/) |

### Open source / self-host (Noord-Amerikaanse origin)

| Provider | HQ | Kenmerken | Link |
|----------|-----|-----------|------|
| **Keycloak** (Red Hat / IBM) | Raleigh, US | Grootste open source CIAM; realm-concept; OIDC/SAML volledig | [keycloak.org](https://www.keycloak.org/) |
| **FusionAuth** | Denver, US | Downloadable + SaaS; feature-pariteit managed | [fusionauth.io](https://fusionauth.io/) |
| **SuperTokens** | Delaware, US | Open-core; self-host + managed | [supertokens.com](https://supertokens.com/) |
| **Gluu Flex** | Austin, US | Open source identity; historisch UMA-focus | [gluu.org](https://gluu.org/) |

---

## Azië-Pacific

Fragmenteerd landschap; veel leveranciers zijn regio-specifiek (Korea, Japan, China) vanwege data-regulering en consumer-adoption van lokale social logins.

### Japan

| Provider | Type | Kenmerken | Link |
|----------|------|-----------|------|
| **LINE Login** | Social IdP | Dominante messaging-app; social-login voor Japanse consumenten | [developers.line.biz](https://developers.line.biz/en/services/line-login/) |
| **Yahoo Japan ID** | Social IdP | Grote Japanse gebruikersbasis | [developer.yahoo.co.jp](https://developer.yahoo.co.jp/yconnect/) |
| **Rakuten Auth** | Social IdP | Rakuten-ecosysteem | [developers.rakuten.com](https://developers.rakuten.com/) |
| **au ID (KDDI)** | Telco-gebaseerde ID | Mobiele carrier-koppeling | [id.auone.jp](https://id.auone.jp/) |
| **NRI Secure — Uni-ID Libra** | Managed CIAM | Enterprise JP-specifiek | [nri-secure.com](https://www.nri-secure.com/service/consumer-identity) |

### Zuid-Korea

| Provider | Type | Kenmerken | Link |
|----------|------|-----------|------|
| **NAVER Login** | Social IdP | Dominante Koreaanse zoekmachine / platform | [developers.naver.com](https://developers.naver.com/docs/login/) |
| **KakaoTalk Login** | Social IdP | Dominante messaging-app in Zuid-Korea | [developers.kakao.com](https://developers.kakao.com/) |

### China

Let op: **Chinese wettelijke vereisten** (PIPL, Cybersecurity Law, lokale data-opslag) maken aparte CIAM-infra vaak noodzakelijk. Dit is echt een apart ecosysteem.

| Provider | Type | Kenmerken | Link |
|----------|------|-----------|------|
| **WeChat Login** (Tencent) | Social IdP | Veruit grootste in China; essentieel voor Chinese consumer-app | [open.weixin.qq.com](https://open.weixin.qq.com/) |
| **QQ Connect** (Tencent) | Social IdP | QQ-community | [connect.qq.com](https://connect.qq.com/) |
| **Alipay Login** (Ant Group) | Social IdP + payments | Combinatie met betaling | [open.alipay.com](https://open.alipay.com/) |
| **Weibo Connect** (Sina) | Social IdP | Social-media-platform | [open.weibo.com](https://open.weibo.com/) |
| **Authing** | Managed CIAM (CN) | Chinese equivalent van Auth0; lokale hosting | [authing.cn](https://www.authing.cn/) |

### India

| Provider | Type | Kenmerken | Link |
|----------|------|-----------|------|
| **miniOrange** | Managed CIAM + self-host | Breed CIAM + workforce; Pune-HQ | [miniorange.com](https://www.miniorange.com/) |
| **Freshworks — Freshid** | IAM-component Freshworks | Meer workforce | [freshworks.com](https://www.freshworks.com/) |
| **Aadhaar / DigiLocker** | Overheidsidentiteit | Indiase nationale ID-federatie | [uidai.gov.in](https://uidai.gov.in/) |

### Zuidoost-Azië en Australië

| Provider | HQ | Type | Kenmerken | Link |
|----------|-----|------|-----------|------|
| **WSO2 Identity Server** | Mountain View (US) / Colombo (LK) | Open source | Java-stack, OIDC/SAML volledig | [wso2.com/identity-server](https://wso2.com/identity-server/) |
| **Deep Identity** | Singapore | Managed IAM | Voornamelijk workforce, CIAM-laag | [deepidentity.com](https://www.deepidentity.com/) |
| **ConnectID** | Sydney, AU | Federatie | Australische banken-federatie voor consumer | [connectid.com.au](https://connectid.com.au/) |
| **Singpass** | Singapore | Overheidsidentiteit | Singaporese nationale ID | [singpass.gov.sg](https://www.singpass.gov.sg/) |
| **MyInfo** | Singapore | Data-portabiliteit | Aangesloten op Singpass | zie Singpass |

---

## Midden-Oosten

Veel gebruik van US-leveranciers (Auth0, Azure) met regionale hosting (ME-Central). Enkele lokale spelers:

| Provider | HQ | Type | Kenmerken | Link |
|----------|-----|------|-----------|------|
| **CyberArk Workforce Identity** | Petah Tikva, IL (+ Boston, US) | Managed IAM | Meer workforce; CIAM-laag | [cyberark.com](https://www.cyberark.com/) |
| **UAE Pass** | Dubai, UAE | Overheidsidentiteit | Federatieve nationale ID | [uaepass.ae](https://uaepass.ae/) |
| **NafathID** | Riyadh, KSA | Overheidsidentiteit | Saudische nationale ID-app | zie overheidsportaal |

### Israëlische leveranciers met consumer-CIAM-focus

| Provider | Kenmerken | Link |
|----------|-----------|------|
| **Transmit Security** | Risk-based auth, passwordless; Tel Aviv | [transmitsecurity.com](https://transmitsecurity.com/) |
| **Descope** | (genoemd bij N.A.; Israëlische founders, US-HQ) | — |
| **Frontegg** | (genoemd bij N.A.; Israëlische founders, US-HQ) | — |

---

## Latijns-Amerika

Beperkt aantal lokale pure-CIAM-spelers; meeste bedrijven gebruiken Auth0, Cognito of Keycloak met LA-regio-hosting.

| Provider | HQ | Type | Kenmerken | Link |
|----------|-----|------|-----------|------|
| **MercadoLibre Connect** | Buenos Aires, AR | Social IdP | Dominante marktplaats-login in Latijns-Amerika | [developers.mercadolibre.com](https://developers.mercadolibre.com/) |
| **Globo ID** | São Paulo, BR | Social IdP (media) | Mediahuis-gekoppeld | - |
| **gov.br** | Brazilië | Overheidsidentiteit | Braziliaanse nationale ID | [gov.br](https://www.gov.br/) |

---

## Afrika

Zeer beperkt pure-CIAM-landschap. Overheids-ID's zoals **SecureIdent** (ZA) en **Smart Africa Alliance-initiatieven** bestaan wel maar zijn geen generieke B2C-CIAM-producten. Gebruikelijk: Auth0, Cognito, of Keycloak met eu-south-1 (Cape Town) of eigen hosting.

| Provider | Land | Type | Notitie |
|----------|-------|------|---------|
| **SecureIdent** | Zuid-Afrika | Managed | Kleine speler; voornamelijk workforce |
| **Smile ID** | Nigeria / SA | Identity verification + KYC | Vaak als laag bovenop een CIAM |

---

## Data-residency — matrix

De meeste grote managed providers bieden meerdere regio's. Voor data-residency-voorkeur (bijvoorbeeld Pulso's "EU-gebruikers in EU, US-gebruikers in US"):

| Provider | EU | US | APAC | AU | CA | ME | LATAM | AF |
|----------|:--:|:--:|:----:|:--:|:--:|:--:|:-----:|:--:|
| Auth0 | ✓ | ✓ | ✓ (JP, AU) | ✓ | — | — | — | — |
| Okta Customer Identity Cloud | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Entra External ID | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Amazon Cognito | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (CPT) |
| Google Identity Platform | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| Ping Identity | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Stytch | ✓ | ✓ | — | — | — | — | — | — |
| Clerk | ✓ | ✓ | — | — | — | — | — | — |
| Descope | ✓ | ✓ | — | — | — | — | — | — |
| LoginRadius | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Ubisecure | ✓ | — | — | — | — | — | — | — |
| Nevis | ✓ (DE, CH) | — | — | — | — | — | — | — |
| One Welcome / Thales | ✓ | — | — | — | — | — | — | — |
| Cidaas | ✓ | — | — | — | — | — | — | — |
| Signicat | ✓ | — | — | — | — | — | — | — |
| Ory Cloud | ✓ | ✓ | — | — | — | — | — | — |
| Zitadel Cloud | ✓ | ✓ | — | — | — | — | — | — |
| Authing | — | — | ✓ (CN) | — | — | — | — | — |
| Keycloak (self-host) | Overal (zelf kiezen) |
| FusionAuth (self-host) | Overal |
| SuperTokens (self-host) | Overal |

Self-hosted opties bieden per definitie volledige flexibiliteit voor regio-keuze — ten koste van eigen ops-inspanning.

---

## Jurisdictie vs. hosting — waarom beide tellen

Voor AVG-compliance is **fysieke data-opslag in EU** één dimensie. De andere is **legal entity en jurisdictie van de verwerker**:

- Een US-HQ-bedrijf (Auth0/Okta, Cognito) dat data in Frankfurt host, valt onder **US CLOUD Act** — de US-overheid kan data opvragen, ongeacht hosting-locatie
- Een EU-HQ-bedrijf (Ubisecure, Signicat, One Welcome, Nevis) valt niet onder CLOUD Act
- Onder EU-US Data Privacy Framework is transfer wettelijk geregeld, maar blijft juridisch contingent
- Self-host in eigen EU-cloud eliminateert beide risico's (maar voegt ops-last toe)

Voor Pulso's EU-gebruikersbasis zijn drie paden met oplopende soevereiniteit:

1. **US-HQ managed met EU-hosting** (Auth0 EU-regio) — snel, goedkoop, met CLOUD Act-onzekerheid
2. **EU-HQ managed** (Ubisecure, One Welcome, Signicat, Cidaas) — pure EU-stack, geen CLOUD Act-exposure
3. **Self-host in eigen EU-cloud** (Keycloak, Ory, Zitadel) — volledige soevereiniteit, hoogste ops-last

De juiste keuze hangt af van risk-appetite, sectorregulering en schaal.

---

## Social-login-aanbieders (federatie-laag)

Nooit de enige CIAM, altijd een laag ernaast:

| Provider | Continent (HQ) | Verplichting |
|----------|-----------------|--------------|
| Sign in with Apple | US | **Verplicht** in iOS-apps die andere social-login aanbieden |
| Sign in with Google | US | Sterk aanbevolen wereldwijd |
| Sign in with Microsoft | US | Nuttig in consumer + overlap met werkaccounts |
| Facebook Login | US | In afname; retention-only |
| X (Twitter) Login | US | In afname; beleidsonzekerheid |
| LINE Login | JP | Essentieel voor Japanse markt |
| NAVER / KakaoTalk | KR | Essentieel voor Koreaanse markt |
| WeChat Login | CN | Essentieel voor Chinese markt |

---

## Verhouding tot de varianten in `tech/`

De twee uitgewerkte varianten (Auth0 en Keycloak) zijn bewust representatieve keuzes uit twee uiteinden van het spectrum:

- **Auth0** — managed, US-HQ, EU-hosting beschikbaar, marktleider
- **Keycloak** — open source, self-host, EU-community-origin (Red Hat heeft weliswaar US-HQ maar de Keycloak-community is wereldwijd), volledige controle

Andere providers uit deze lijst zijn rechtstreekse alternatieven:

- Voor "managed met EU-HQ": **Ubisecure**, **One Welcome**, **Cidaas**, **Signicat**, **Nevis** — drop-in voor de Auth0-variant, met andere admin-UX
- Voor "self-host open source": **Ory Stack**, **Zitadel**, **Authentik** — drop-in voor de Keycloak-variant, modernere architectuur maar kleinere community
- Voor "developer-first managed": **Stytch**, **Clerk**, **Descope** — snellere greenfield bouw, meer vendor-specifieke flow-code

De protocolkeuzes (OIDC + PKCE, WebAuthn, Device Flow, DCR) en patronen (BFF, scope-minimalisatie, refresh-rotation, DPoP, app-attest) blijven identiek ongeacht de provider.
