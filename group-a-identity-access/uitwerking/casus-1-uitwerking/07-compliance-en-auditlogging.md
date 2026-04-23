# 07 — Compliance en auditlogging

## Toepasselijk kader

Voor een interne beheertool bij Gemeente Meerwijde zijn de volgende kaders primair van toepassing:

- **BIO (Baseline Informatiebeveiliging Overheid)** — verplichte baseline voor alle gemeenten, gebaseerd op ISO 27002
- **ENSIA** — jaarlijkse zelfevaluatie informatiebeveiliging, waarvoor bewijslast uit deze casus wordt aangeleverd
- **NCSC ICT-beveiligingsrichtlijnen voor webapplicaties** — technische uitwerking op webapplicatieniveau
- **AVG / UAVG** — voor logging die persoonsgegevens bevat (wie logde in, wanneer, vanaf waar)

## BIO-onderdelen relevant voor A1 in deze casus

| Onderdeel | Onderwerp | Invulling in deze casus |
|-----------|-----------|--------------------------|
| 9.2.1 | Registratie en uitschrijving gebruikers | HR → AD → Entra-keten; uitdienst werkt automatisch door |
| 9.2.2 | Toekennen toegangsrechten | Via AD-groepen en app roles (zie `05-rollen-en-claims.md`) |
| 9.2.3 | Beheer speciale toegangsrechten | Via PIM for Groups voor `Beheerder`-rol |
| 9.2.4 | Beheer geheime authenticatie-informatie | Entra-wachtwoordbeleid + verplichte MFA; geen applicatie-wachtwoorden |
| 9.2.5 | Beoordeling toegangsrechten gebruikers | Per kwartaal access reviews op de achterliggende Entra-groepen |
| 9.4.2 | Beveiligde inlogprocedures | OIDC + Conditional Access; geen legacy auth toegestaan |
| 9.4.3 | Systeem voor wachtwoordbeheer | Entra-wachtwoordbeleid, self-service reset met writeback |

## NCSC-richtlijnen

| Richtlijn | Invulling |
|-----------|-----------|
| U/WA.01 | OIDC via Entra ID, MFA afgedwongen via Conditional Access |
| B/WA.03 | App-registratie onder versiebeheer (Terraform), certificaten in Key Vault, geen shared secrets |

## Auditlogging — bronnen

Auditbewijs rond authenticatie komt uit drie bronnen:

### 1. Entra sign-in logs

Per sign-in wordt vastgelegd: gebruiker, tijdstip, IP-adres, geo-locatie, browser/client, status, MFA-methode, toegepaste CA-policies, device-status (compliant/joined), risk level. Deze gegevens zijn leidend voor bewijsvoering rond authenticatie.

### 2. Entra audit logs

Beheerhandelingen op identity-objecten: wijzigingen op app-registraties, Enterprise Applications, app role-toewijzingen, CA-policies, groepstoewijzingen, PIM-activaties. Relevante event types voor deze casus:

- `Add app role assignment to user`
- `Add member to group` / `Remove member from group`
- `Update application` / `Update conditional access policy`
- `Add eligible member (permanent/time-bound)` — PIM
- `Activate eligible role` — PIM-activatie

### 3. Applicatie-logs

De beheertool logt op applicatieniveau welke rol werd gebruikt bij welke actie, gekoppeld aan `oid` (de objectidentifier uit Entra). Deze logs horen functioneel onder **C1 — Logging & Audit Trail** maar zijn onmisbaar om van "heeft ingelogd" naar "heeft werkelijk actie X uitgevoerd" te komen.

## Diagnostic settings en retentie

Entra bewaart zelf standaard 30 dagen aan sign-in- en audit-logs (P1). Voor langere retentie en correlatie zijn **diagnostic settings** geconfigureerd:

```
Entra sign-in logs   ──┐
Entra audit logs     ──┼──► Log Analytics Workspace (Europe)
Applicatie-logs      ──┘        │
                                ├──► Microsoft Sentinel (detecties, workbooks)
                                └──► Archief-storage (immutable, tijdsgebaseerd)
```

- **Log Analytics**: retentie 12 maanden voor warm gebruik, queries en dashboards
- **Archiefstorage**: 7 jaar retentie voor beveiligingsloggen, immutable via tijdsgebaseerde policies
- **Data-locatie**: West Europe / North Europe, conform Meerwijde's data-residency-beleid

## Bewijsvoering voor ENSIA en interne audit

Bij een audit moet aantoonbaar zijn dat het toegangsbeheer werkt zoals ontworpen. De volgende queries worden als **saved searches** en **workbooks** vastgelegd in Log Analytics / Sentinel, zodat ze reproduceerbaar zijn:

| Vraag | Query-onderwerp |
|-------|------------------|
| Is er ooit ingelogd zonder MFA? | `SigninLogs` filter op `AuthenticationRequirement != "multiFactorAuthentication"` voor de app |
| Welke toekenningen van app roles zijn verleend? | `AuditLogs` filter op `Add app role assignment` per periode |
| Welke uitdienst-meldingen leidden tot verlies van toegang? | Correlatie HR-export ↔ AD-groepswijziging ↔ uitblijvende sign-ins |
| Zijn CA-policies ongewijzigd? | `AuditLogs` filter op `Update conditional access policy` — elke wijziging moet traceerbaar zijn naar een change-request |
| Wie heeft de `Beheerder`-rol geactiveerd en waarom? | PIM-activatielogs inclusief rechtvaardigingstekst |
| Zijn access reviews uitgevoerd en opgevolgd? | Entra access-review-resultaten met beslissing per lid |

## Alerting (richting C2)

Een subset van bovenstaande queries is omgezet in **Sentinel analytics rules** die realtime alerten:

- Sign-in naar break-glass account → Severity High, direct naar CISO en SOC-oncall
- App-registratie wijziging buiten kantooruren → Severity Medium
- Ongebruikelijk aantal mislukte sign-ins naar de beheertool → Severity Medium
- PIM-activatie zonder bijbehorende ticket-ID in de rechtvaardiging → Severity Low, dagelijks overzicht

Deze alerting hoort inhoudelijk onder **C2 — Monitoring & Alerting**; hier wordt de basis gelegd omdat de signalen ontstaan in de authenticatie-stroom.

## Persoonsgegevens in logs

Sign-in-logs bevatten persoonsgegevens (naam, e-mailadres, IP, locatie). Conform AVG geldt:

- Doelbinding: logs worden alleen gebruikt voor beveiliging, auditing en incidentafhandeling
- Bewaartermijn: onderbouwd op basis van de proportionaliteitsafweging door de Privacy Officer
- Toegang: alleen SOC-leden, CISO en aangewezen auditors; toegang verloopt zelf ook via PIM
- Verwijdering: archief is immutable, maar na bewaartermijn automatisch gewist via lifecycle-policy

## Verhouding tot andere bouwblokken

- **C1 — Logging & Audit Trail**: brede logging-architectuur; dit bestand beperkt zich tot authenticatie
- **C2 — Monitoring & Alerting**: detecties en alerting-logica; dit bestand levert de bronlogs
- **D1 — Standaarden Compliance Registry**: BIO- en NCSC-clausules zoals hier geciteerd worden centraal onderhouden
- **D3 — Compliance Evidence & Reporting**: het proces rond ENSIA en audit-bewijs
