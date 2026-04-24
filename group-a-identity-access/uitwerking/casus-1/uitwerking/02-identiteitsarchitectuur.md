# 02 — Identiteitsarchitectuur

## Topologie

De identiteit van een medewerker van Gemeente Meerwijde volgt een keten van drie lagen:

```
[HR-systeem]
    │  (geautomatiseerde provisioning bij in-/uitdienst)
    ▼
[Active Directory Domain Services]                 on-prem, stadhuis + secundair datacenter
    │  (Entra Connect Sync, elke ~30 minuten)
    ▼
[Entra ID]                                         cloud, tenant meerwijde.onmicrosoft.com
    │  (OIDC / OpenID Connect)
    ▼
[Interne beheertool]                               Azure App Service, West Europe
```

Het HR-systeem is de "system of record" voor medewerkerstatus. AD DS is de "system of record" voor de werkplekidentiteit en bestandsrechten. Entra ID is de "system of record" voor de cloudidentiteit en de identity provider richting applicaties.

## Synchronisatiemodel

Entra Connect Sync verzorgt de synchronisatie van AD naar Entra ID. Relevante keuzes die in Meerwijde gelden:

- **Password Hash Sync (PHS)** is ingeschakeld, zodat inloggen op Entra blijft werken als AD tijdelijk onbereikbaar is
- **Gesynchroniseerde objecten**: medewerker-accounts (users), security groups die als bron voor claims richting applicaties fungeren, en computers voor Hybrid Azure AD Join
- **OU-filtering**: test-OU's, serviceaccounts en buitendienst-accounts worden uitgesloten van synchronisatie
- **Attribuut-mapping**: `userPrincipalName` is het primaire e-mailadres (`voornaam.achternaam@meerwijde.nl`); de on-prem `objectGUID` wordt vertaald naar `ImmutableID` in Entra zodat de koppeling stabiel blijft
- **Password writeback** is actief voor self-service password reset vanuit Entra; hiermee blijft AD consistent als een medewerker via het Entra-portaal een wachtwoord reset

## Entra ID-tenant

| Aspect | Waarde |
|--------|--------|
| **Tenant-type** | Single tenant, gekoppeld aan het primaire domein `meerwijde.nl` |
| **Licentiemodel** | Microsoft 365 E3 voor alle medewerkers; Entra ID P2 + Intune voor aangewezen gebruikers (IT, beheer, risicogroepen) |
| **Datalocatie** | West Europe / North Europe (EU-datacenters), conform soevereiniteitsvoorkeur |
| **Multi-geo** | Niet van toepassing — Meerwijde werkt binnen één regio |

Relevante objecttypen voor deze casus:

- **Users** — gesynct vanuit AD; cloud-only accounts alleen voor break-glass en enkele technische rollen
- **Groups** — security groups gesynct vanuit AD plus Entra-only groepen voor cloud-specifieke doeleinden; bron voor claims in het ID-token
- **Devices** — Hybrid Azure AD-joined werkplekken; Intune-compliance status is beschikbaar als signal in Conditional Access
- **App registrations** — technische configuratie van de applicatie (client ID, redirect URIs, certificaten, permissies, claim-configuratie)
- **Enterprise applications** — service principal-representatie van dezelfde applicatie in de tenant; hierop landen Conditional Access-policies en gebruikers-/groepentoewijzingen (die laatste zijn relevant voor A2)

## Hybride aspect voor de beheertool

De beheertool draait in Azure maar authenticeert gebruikers die oorspronkelijk in AD staan. Doordat Entra ID de gesynchroniseerde identiteiten beheert, hoeft de applicatie zelf nooit contact te maken met AD. De applicatie spreekt uitsluitend OIDC tegen Entra ID.

### Wat is OIDC?

**OpenID Connect (OIDC)** is een dunne identiteitslaag bovenop **OAuth 2.0**. OAuth 2.0 lost het autorisatieprobleem op — "deze applicatie mag namens deze gebruiker iets doen" — maar zegt niets over *wie* die gebruiker is. OIDC vult dat gat met één gestandaardiseerd antwoord: een **ID-token**, een door de IdP ondertekende JWT met claims over de geauthenticeerde gebruiker (`sub`, `email`, `name`, eventueel `roles` of `groups`).

In termen van rollen: Entra ID is de **OpenID Provider (OP)**, de beheertool is de **Relying Party (RP)**. De RP delegeert het hele inlogproces aan de OP en krijgt na afloop een tokenpakket retour.

Concreet voor de beheertool betekent dat:

- **Geen wachtwoorden bij de applicatie** — Sanne authentiseert bij Entra (eventueel met MFA, device-check, locatiebeleid). De beheertool ziet enkel het ondertekende resultaat en kent het wachtwoord niet.
- **Lokale verificatie zonder callback** — het ID-token is ondertekend met een sleutel uit de publieke JWKS van Entra. De applicatie verifieert de signatuur en de standaardclaims (`iss`, `aud`, `exp`, `nbf`, `nonce`) zonder Entra opnieuw te bevragen per request.
- **Discovery via één URL** — alle endpoints (autorisatie, token, JWKS, userinfo, end-session) zijn vindbaar via `https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration`. Aan applicatiezijde beperkt de configuratie zich tot tenant-id, client-id en redirect-URI.
- **Standaardbibliotheken dekken de details** — MSAL en de OIDC-middleware (bijvoorbeeld `Microsoft.Identity.Web`) implementeren tokenuitwisseling, PKCE, validatie en sleutelrotatie. De applicatiecode raakt het protocol nauwelijks zelf aan.
- **Drie tokens met aparte rollen** — het **ID-token** zegt wie de gebruiker is (voor authenticatie), een eventueel **access token** geeft toegang tot een downstream-API (voor autorisatie tegen die API), en het **refresh token** verlengt de sessie zonder opnieuw inloggen.

OIDC is hier de logische keuze boven SAML 2.0: de beheertool is een moderne webapplicatie, JWT-tokens zijn lichter te verwerken dan SAML-XML-assertions, en de Microsoft-stack ondersteunt OIDC als first-class pad. SAML zou werken, maar voegt geen functionaliteit toe en brengt extra onderhoud mee aan XML-canonicalisatie en certificaatketens.

De feitelijke authenticatieflow (Authorization Code met PKCE), de configuratie van de app-registratie en de tokenvalidatie staan in `03-authenticatieflow-en-app-registratie.md`.

### Hybrid Azure AD-join als extra signaal

Omdat werkplekken Hybrid Azure AD-joined zijn, levert Entra bij elke sign-in een device-claim die in Conditional Access benut wordt (zie `04-conditional-access-en-mfa.md`). Dit is bepalend: een niet-beheerde laptop haalt de beheertool niet, ook niet met de juiste gebruikersnaam en MFA.

## Netwerkpositie

De App Service met de beheertool bevindt zich in een productie-subscription van de Azure Landing Zone, achter **Azure Front Door** met WAF. Inkomend verkeer van medewerkers loopt via internet; lateraal verkeer naar andere services binnen Azure verloopt over **private endpoints**. Authenticatie naar Entra verloopt vanuit de applicatie over HTTPS naar `login.microsoftonline.com`. Er is geen directe lijn tussen de applicatie en on-prem AD — alle identiteitsuitwisseling gaat via Entra.
