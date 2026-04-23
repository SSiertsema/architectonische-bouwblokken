# 05 — Identiteitsclaims en rol-levering

> **Scope:** dit bestand beschrijft uitsluitend wat Entra ID na authenticatie in het ID-token **aflevert** aan de applicatie — inclusief het mechanisme waarmee rol-informatie in dat token terechtkomt. De rol-definities zelf (welke rollen bestaan, wat ze mogen), de rol-toewijzing (wie welke rol krijgt), de access reviews en de applicatie-zijdige autorisatie-afdwinging horen bij **A2 — Autorisatie** en worden daar uitgewerkt.

## Claims die Entra aflevert

Na een geslaagde OIDC-flow (zie `03-authenticatieflow-en-app-registratie.md`) ontvangt de backend een ID-token met onder andere:

| Claim | Herkomst | Gebruik |
|-------|----------|---------|
| `iss`, `aud`, `exp`, `nbf`, `iat`, `nonce` | Protocol-verplicht | Token-validatie |
| `tid` | Tenant-ID | Validatie dat het token uit de juiste tenant komt |
| `oid` | Entra object-ID | Stabiele, onveranderlijke identifier van de gebruiker |
| `sub` | Pairwise subject | Alternatieve identifier, scoped aan de app |
| `preferred_username` | UPN (e-mailadres) | Weergave in de UI |
| `name`, `given_name`, `family_name` | AD → Entra | Weergave in de UI |
| `roles` | App roles in de Enterprise Application | Inputs voor autorisatiebeslissingen (A2) |

`oid` en `tid` vormen samen de werkelijk stabiele identifier van een gebruiker en worden door de applicatie als primaire sleutel gebruikt wanneer iets aan een persoon moet worden gekoppeld.

## App roles als leveringsmechanisme voor rol-claims

Entra biedt twee manieren om rol- of groepsinformatie in een token te zetten:

1. **`groups`-claim** — Entra plaatst een lijst van groeps-GUID's in het token
2. **`roles`-claim via app roles** — de applicatie definieert app roles in haar app-registratie; Entra plaatst de `value` van elke toegewezen app role in het token

In deze casus wordt **app roles** gebruikt. Reden is puur afleveringstechnisch:

- De `roles`-claim bevat stabiele, leesbare waarden (`Lezer`, `Verrijker`, ...) in plaats van GUID's, wat de applicatie onafhankelijk maakt van groepsidentifiers
- De `groups`-claim loopt tegen de **overage limit** aan (default 200 groepen per token); boven die grens vervalt de claim en moet de applicatie de lidmaatschappen via Microsoft Graph ophalen. App roles hebben dat probleem niet
- Veranderingen in de onderliggende groepsstructuur in AD raken het token niet zolang de koppeling groep → app role onveranderd blijft

De **definitie** van welke app roles er zijn en wie er in hoort — dat is autorisatie-ontwerp en valt onder A2.

## Ketenoverzicht: van AD naar token

Het afleveringspad voor de `roles`-claim loopt voor deze casus zo:

```
AD-security-groep (on-prem)
    │  Entra Connect Sync (~30 min)
    ▼
Entra-groep
    │  groep toegewezen aan app role in Enterprise Application
    ▼
App role-assignment in Entra
    │  bij sign-in evalueert Entra welke assignments voor deze gebruiker gelden
    ▼
'roles'-claim in ID-token
```

De A1-scope van dit bestand stopt bij de laatste pijl. Wie beslist welke AD-groep aan welke app role gekoppeld wordt — en waarom — is een A2-vraagstuk.

## Revocatie van rol-informatie

Drie mechanismen zorgen dat rol-wijzigingen doorwerken in het token:

1. **Nieuwe sign-in** — bij de volgende interactieve login worden app role-assignments opnieuw geëvalueerd
2. **Token refresh** — bij het vernieuwen van tokens via het refresh-token worden assignments opnieuw geëvalueerd
3. **Continuous Access Evaluation** — bij significante events (gebruiker gedeactiveerd, wachtwoordwijziging) stuurt Entra een claims challenge die de applicatie dwingt tot re-authenticatie, binnen minuten in plaats van uren

Details van CAE staan in `06-sessie-en-tokens.md`.

## Waar dit bestand stopt

Niet in dit bestand (hoort bij A2):

- Welke rollen de beheertool kent en wat ze mogen
- Welke AD-groep aan welke app role wordt gekoppeld en door wie
- De procedure voor het aanvragen, toekennen en intrekken van rollen
- Tijdelijke rolverlening (just-in-time via PIM for Groups) en de procedurele inrichting daarvan
- Periodieke access reviews op de rol-toewijzingen
- De applicatie-zijdige controle op aanwezigheid van een rol voor een actie
- Het foutgedrag bij ontbrekende rechten (403, UX)

De A1-bijdrage eindigt bij: **"deze geauthenticeerde gebruiker heeft, volgens Entra, op dit moment de volgende app roles"**. Wat de applicatie daarmee doet, is A2.
