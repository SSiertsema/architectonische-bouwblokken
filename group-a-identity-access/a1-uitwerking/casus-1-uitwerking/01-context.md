# 01 — Context en uitgangspunten

## Situatieschets

De casus betreft een interne beheertool voor medewerkers van een Nederlandse overheidsinstantie. Als referentie-organisatie geldt **Gemeente Meerwijde** (zie `../organisatieprofielen/gemeente-meerwijde.md`): een middelgrote gemeente met een gevestigd hybride Azure-landschap en een on-prem Active Directory die gekoppeld is aan het HR-systeem. De beheertool wordt gebruikt door circa veertig beleidsmedewerkers (zoals `../personas/sanne-beleidsmedewerker.md`) en een klein aantal functioneel beheerders en leidinggevenden. Er is geen burger- of ondernemers-inlog.

## Uitgangspunten

De volgende technische en organisatorische gegevens zijn als uitgangspunt genomen en vormen de basis voor de verdere uitwerking in deze map:

- **Identiteitsbron**: on-prem Active Directory Domain Services (AD DS) is de bron voor medewerkeridentiteiten, gekoppeld aan het HR-systeem voor in- en uitdienstmeldingen
- **Cloud-identiteit**: Entra ID is de identity provider voor cloud-applicaties, gevoed door AD via Entra Connect Sync
- **Licentiemodel**: Microsoft 365 E3 met Entra ID P1; voor specifieke onderdelen (Identity Protection, PIM) is P2 beschikbaar voor aangewezen gebruikers
- **Werkplek**: Hybrid Azure AD-joined werkplekken, beheerd via Microsoft Intune; Windows Hello for Business is de primaire inlogmethode op het apparaat
- **Hosting**: de applicatie draait op Azure-platformdiensten (App Service of Container Apps) in Azure-region West Europe of North Europe
- **Compliance-baseline**: BIO geldt als minimum; ENSIA-verantwoording vraagt bewijslast over toegangsbeheer
- **Organisatorisch**: afdeling Informatievoorziening beheert het Azure-platform en de app-registratie; functioneel beheer ligt bij de beleidsdirectie

## Scope van deze uitwerking

**Binnen scope:**
- Keuze en configuratie van de authenticatieflow naar de applicatie
- Koppeling tussen AD, Entra ID en de applicatie
- Conditional Access-beleid dat van toepassing is op het inloggen
- Rol- en claimafhandeling tot aan de autorisatiegrens van A1
- Sessie- en tokenduur voor zover deze uit de federatieprotocollen volgt
- Logging en audittrail die specifiek op authenticatie betrekking hebben

**Buiten scope:**
- Inhoudelijke autorisatielogica (zie A2 — Autorisatie)
- Applicatiesessiegedrag dat losstaat van de IdP (zie A3 — Sessiemanagement)
- Geheimenbeheer buiten de scope van authenticatie (zie B3 — Secrets Management)
- Bredere logging- en monitoringinrichting (zie C1 en C2)
- Inrichting van AD zelf en het HR-synchronisatieproces

## Leeswijzer

De volgende bestanden in deze map werken elk een specifiek aspect verder uit:

- `02-identiteitsarchitectuur.md` — topologie AD ↔ Entra ID ↔ applicatie
- `03-authenticatieflow-en-app-registratie.md` — OIDC-flow en Entra-app-registratie
- `04-conditional-access-en-mfa.md` — voorwaardelijke toegang en MFA-beleid
- `05-rollen-en-claims.md` — van AD-groep naar app-rol via claims
- `06-sessie-en-tokens.md` — token-levensduur en sessieduur
- `07-compliance-en-auditlogging.md` — BIO/NCSC-bewijslast en auditlog
