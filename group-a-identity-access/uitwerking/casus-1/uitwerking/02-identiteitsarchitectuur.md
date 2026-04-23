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
- **Gesynchroniseerde objecten**: medewerker-accounts (users), security groups die voor autorisatiedoeleinden worden gebruikt, en computers voor Hybrid Azure AD Join
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
- **Groups** — security groups gesynct vanuit AD (bron van rolverlening) plus Entra-only groepen voor cloud-specifieke doeleinden (PIM for Groups)
- **Devices** — Hybrid Azure AD-joined werkplekken; Intune-compliance status is beschikbaar als signal in Conditional Access
- **App registrations** — technische configuratie van de applicatie (client ID, redirect URIs, certificaten, permissies, app roles)
- **Enterprise applications** — service principal-representatie van dezelfde applicatie in de tenant; hierop landen gebruikers-/groepentoewijzingen en Conditional Access-policies

## Hybride aspect voor de beheertool

De beheertool draait in Azure maar authenticeert gebruikers die oorspronkelijk in AD staan. Doordat Entra ID de gesynchroniseerde identiteiten beheert, hoeft de applicatie zelf nooit contact te maken met AD. De applicatie spreekt uitsluitend OIDC tegen Entra ID.

Omdat werkplekken Hybrid Azure AD-joined zijn, levert Entra bij elke sign-in een device-claim die in Conditional Access benut wordt (zie `04-conditional-access-en-mfa.md`). Dit is bepalend: een niet-beheerde laptop haalt de beheertool niet, ook niet met de juiste gebruikersnaam en MFA.

## Netwerkpositie

De App Service met de beheertool bevindt zich in een productie-subscription van de Azure Landing Zone, achter **Azure Front Door** met WAF. Inkomend verkeer van medewerkers loopt via internet; lateraal verkeer naar andere services binnen Azure verloopt over **private endpoints**. Authenticatie naar Entra verloopt vanuit de applicatie over HTTPS naar `login.microsoftonline.com`. Er is geen directe lijn tussen de applicatie en on-prem AD — alle identiteitsuitwisseling gaat via Entra.
