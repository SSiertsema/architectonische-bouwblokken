# B3 — Secrets Management

## 1. Wat is dit bouwblok?

Dit bouwblok regelt hoe een applicatie omgaat met geheimen: wachtwoorden, API-sleutels, certificaten en andere gevoelige credentials. Het zorgt ervoor dat deze geheimen veilig worden opgeslagen, gedistribueerd en geroteerd — en dat ze nooit terechtkomen in broncode, configuratiebestanden of logbestanden.

## 2. Waarom is dit nodig?

Gelekte geheimen zijn een van de meest voorkomende oorzaken van beveiligingsincidenten. Een API-sleutel die per ongeluk in een Git-repository terechtkomt, een wachtwoord dat hardcoded in de broncode staat, of een certificaat dat in een logbestand verschijnt — elk van deze situaties kan leiden tot ongeautoriseerde toegang tot systemen en data. Zonder centraal secrets management is het bovendien onmogelijk om geheimen snel te roteren na een incident, waardoor de schade onnodig lang voortduurt.

## 3. Wie heeft hiermee te maken?

- **Ontwikkelteam** — gebruikt geheimen in de applicatie zonder ze direct in code of configuratie op te nemen
- **Beheerder / Operations** — beheert de secrets vault, voert rotaties uit en monitort toegang
- **Security officer** — stelt het beleid op voor opslag, rotatie en toegang tot geheimen
- **DevOps / Platform team** — richt de infrastructuur in voor veilige distributie van geheimen naar applicaties
- **Manager / Projectleider** — draagt verantwoordelijkheid voor naleving van het secrets-beleid binnen het team

## 4. Waar zit dit in de applicatie?

Secrets management zit op het snijvlak van **infrastructuur en applicatie**. De opslag van geheimen (de vault) is infrastructuur. De manier waarop de applicatie geheimen ophaalt en gebruikt is applicatielogica. Het beleid rondom rotatie en toegang is een organisatorisch proces. Geheimen raken daarmee aan alle lagen: van de CI/CD-pipeline die credentials injecteert, tot de applicatiecode die ze runtime ophaalt, tot het beheerproces dat ze periodiek vervangt.

## 5. Wanneer is dit relevant?

- **Bij ontwerp** — bepalen welke geheimen de applicatie nodig heeft en hoe deze worden aangeleverd
- **Bij bouw** — integratie met een secrets vault; zorgen dat geheimen niet in code terechtkomen
- **Bij deployment** — geheimen veilig injecteren in de runtime-omgeving
- **Bij beheer** — periodieke rotatie van geheimen en monitoring van toegangspatronen
- **Bij een incident** — gecompromitteerde geheimen onmiddellijk kunnen roteren zonder downtime

## 6. Hoe werkt dit?

Geheimen worden opgeslagen in een beveiligde kluis (vault) die losstaat van de applicatiecode en configuratie. Wanneer de applicatie een geheim nodig heeft — bijvoorbeeld om verbinding te maken met een database — haalt zij dit op uit de kluis op het moment dat het nodig is. Het geheim staat nergens op schijf en wordt niet meegegeven als zichtbare configuratie. Daarnaast worden geheimen periodiek automatisch vervangen (geroteerd), zodat een eventueel gelekt geheim slechts beperkte tijd bruikbaar is.

## 7. Voor de techneut

### Vault-integratie
Gebruik een dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, of vergelijkbaar) als enige bron van geheimen. De applicatie authenticeert zich bij de vault via een identiteitsmechanisme (zoals een service account of managed identity) en haalt geheimen op via een API. Geheimen worden nooit opgeslagen in omgevingsvariabelen die zichtbaar zijn via process listings of debug-endpoints.

### Runtime-injectie
Geheimen worden bij voorkeur runtime opgehaald door de applicatie zelf, niet vooraf geïnjecteerd door het platform. Dit maakt dynamische rotatie mogelijk zonder herstart. Waar runtime-ophalen niet mogelijk is (bijvoorbeeld bij bootstrapping), worden geheimen geïnjecteerd via kortstondige mechanismen zoals in-memory volumes of encrypted environment injection, nooit via configuratiebestanden op schijf.

### Rotatiestrategie
Implementeer automatische rotatie voor alle geheimen met een maximale levensduur per type:
- **Database-credentials** — roteren zonder downtime via dual-account of leasing-mechanismen
- **API-sleutels** — periodiek vervangen met overlap-periode voor naadloze transitie
- **Certificaten** — automatisch hernieuwen ruim voor expiratie via ACME of vergelijkbaar
- **Encryptiesleutels** — key rotation met re-encryption van bestaande data waar nodig

### Lekdetectie en -preventie
Voorkom dat geheimen onbedoeld worden vastgelegd of getoond:
- **Pre-commit hooks** — scannen op patronen die lijken op secrets (hoge entropie, bekende formaten)
- **CI/CD scanning** — geautomatiseerde detectie van secrets in broncode en configuratie
- **Log-sanitatie** — geheimen automatisch maskeren in loguitvoer
- **Repository scanning** — continu scannen van versiebeheer op historisch gelekte geheimen

### Toegangscontrole op secrets
Pas het least-privilege principe toe: elke applicatie of service heeft alleen toegang tot de geheimen die deze daadwerkelijk nodig heeft. Alle toegang tot geheimen wordt gelogd. Gebruik kortstondige credentials (leases) waar mogelijk, zodat een gelekt geheim automatisch verloopt.

## 8. Gedekte clausules

### NCSC ICT-beveiligingsrichtlijnen voor webapplicaties
| Richtlijn | Onderwerp |
|-----------|-----------|
| B/WA.08 | Sleutelbeheer — veilig beheer van cryptografische sleutels en geheimen |
| U/WA.07 | Cryptografie — correct gebruik van cryptografische mechanismen |

### ISO 27001
| Clausule | Onderwerp |
|----------|-----------|
| A.10.1.1 | Beleid voor gebruik van cryptografische beheersmaatregelen — richtlijnen voor omgang met sleutels en geheimen |
| A.10.1.2 | Sleutelbeheer — levenscyclusbeheer van cryptografische sleutels |
| A.9.2.4 | Beheer van geheime authenticatie-informatie van gebruikers — veilige distributie en opslag van credentials |
| A.9.4.3 | Wachtwoordbeheersysteem — eisen aan systemen die wachtwoorden en geheimen beheren |

## 9. Relaties met andere bouwblokken

| Bouwblok | Relatie |
|----------|---------|
| **A1 — Authenticatie** | Credentials die worden gebruikt voor authenticatie (wachtwoorden, API-sleutels, tokens) worden opgeslagen en beheerd via secrets management. A1 definieert welke credentials nodig zijn; B3 bepaalt hoe deze veilig worden bewaard. |
| **C1 — Logging & Audit Trail** | Alle toegang tot geheimen wordt gelogd via C1: wie heeft welk geheim opgehaald en wanneer. De geheimen zelf worden nooit gelogd — C1 bevat uitsluitend metadata over de toegang. |
| **D4 — Rollen & Verantwoordelijkheden** | D4 bepaalt wie geheimen mag aanmaken, inzien, roteren en verwijderen. Niet iedereen in het team heeft dezelfde toegang tot de vault. |
| **B2 — Dependency Management** | Dependencies kunnen eigen geheimen vereisen (licentiecodes, API-sleutels voor externe services). B2 identificeert welke dependencies credentials nodig hebben; B3 beheert die credentials. |
