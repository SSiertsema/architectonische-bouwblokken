# 08 — Accountlifecycle en herstel

In casus 1 volgt de levenscyclus van een account automatisch uit HR: indienst → AD-account → Entra → app; uitdienst → terug. In een consumentencasus bestaat geen HR, geen beheerder, geen lifecycle-automatisering van buitenaf. **Alles moet self-service werken**, want consumenten hebben geen "bel de servicedesk"-verwachting en, in Pulso's geval, is er gewoonweg geen 24/7-servicedesk.

Dit bestand dekt het volledige lifecycle-palet: van signup tot verwijdering, met speciale aandacht voor herstel-scenario's waar Thomas (de wisselgebruiker) de primaire validator is.

## Lifecycle-fases

1. **Pre-signup** — landing, waardepropositie, consent-bewustwording
2. **Signup** — e-mail + passkey/social/password, consent-functioneel
3. **Verification** — e-mail verifiëren
4. **Progressive profiling** — extra gegevens wanneer de customer journey daar om vraagt
5. **Active use** — dagelijks / periodiek gebruik
6. **Recovery** — wachtwoord vergeten, e-mail wijzigen, device kwijt
7. **Account-wijziging** — social-linking, upgrade naar premium, family-plan-overgang
8. **Pauze / inactief** — langdurig niet gebruikt, mogelijk heractivatie
9. **Opzegging** — abonnement beëindigen (user blijft)
10. **Verwijdering** — AVG-recht op vergetelheid
11. **Post-deletie** — bewaartermijnen, auditgegevens, reactivering binnen wachtperiode

## Signup + verification

Zie `03-authenticatieflow-en-registratie.md`. Key-points relevant voor lifecycle:

- Signup zonder e-mailverificatie geeft beperkte toegang (gast-modus, één workout)
- E-mailverificatielink 24 uur geldig, regenereerbaar
- Wachtwoordvereisten: 12+ tekens, tegen HIBP-lijst gecheckt
- Passkey-creatie aangeboden direct na eerste verified login ("wil je in de toekomst zonder wachtwoord inloggen?")

## Progressive profiling

Hoeft hier niet in detail — zie `03-authenticatieflow-en-registratie.md`. Ontwerpprincipe: **gegevens verzamelen op het moment dat ze gebruikt worden**, niet "voor het geval dat".

## Wachtwoord vergeten

Klassieke flow, correct uitgevoerd:

1. Gebruiker tikt "Wachtwoord vergeten" op login-scherm
2. Vult e-mailadres in — ongeacht of dat adres bestaat, toont Pulso altijd "als dit adres bekend is, hebben we een mail gestuurd" (voorkomt user-enumeratie)
3. Als het adres bestaat: mail met single-use, 1-uur-geldige, per-user-gekoppelde reset-link
4. Bij klikken: CIAM-pagina voor nieuw wachtwoord
5. Na reset: alle bestaande sessies invaliderend + een bevestigingsmail naar het oude **en** nieuwe adres als ze verschillend zijn (ze zijn meestal hetzelfde)
6. Na reset wordt passkey-aanmaak expliciet aangeboden

Speciaal voor **Thomas**:

- Reset-mail bereikt hem snel genoeg (minder dan 30 seconden zonder SPAM-issues)
- Link is duidelijk, niet verborgen tussen tracking-parameters
- Reset-ervaring is 2 schermen: nieuw wachtwoord + bevestiging "je bent klaar om in te loggen"
- Als Thomas zijn oude wachtwoord herinnert tijdens de reset, kan hij annuleren zonder account-schade

## E-mail wijzigen — de hardste flow

Pulso's grootste support-hoofdpijn is *e-mail wijzigen terwijl de oude mailbox niet meer toegankelijk is*. Thomas' Frustration Scenario staat hier letterlijk model.

### Standaard-pad (oude e-mail nog toegankelijk)

1. Ingelogde gebruiker gaat naar "Profiel → E-mail wijzigen"
2. Step-up (passkey / TOTP) verplicht
3. Voert nieuw e-mailadres in
4. Pulso stuurt bevestigingsmail naar het **nieuwe** adres én een "we gaan je e-mail wijzigen" notificatie naar het **oude** adres
5. Klikt user in nieuwe-mail: definitief gewijzigd; oude-mail bevat ook undo-link (geldig 24 uur)
6. Alle sessies behalve de huidige worden ingetrokken

### Edge case — oude e-mail niet toegankelijk

Als Thomas zijn oude werkmail niet meer heeft, kan hij zich nog steeds inloggen (hij weet zijn wachtwoord, of heeft een passkey). De uitdaging: Pulso kan zijn wijziging niet "verifiëren" via oude mail. Pulso's aanpak:

1. Gebruiker kiest "Oude e-mail niet meer toegankelijk" in de wijzig-flow
2. Pulso vraagt aanvullende factoren:
   - Abonnementsgegevens (welk plan, laatste betalingsdatum)
   - Recente activiteit (wanneer laatste workout, type)
   - Alternatief contact (telefoonnummer indien eerder verified, secundair e-mailadres)
3. Trust & Safety reviewt handmatig binnen 2 werkdagen
4. Bij goedkeuring: e-mailwijziging doorgevoerd, gebruiker krijgt mail op nieuwe adres + notificatie + geforceerde sessie-logout + re-auth met step-up

Ontwerp-rationale: dit is **géén snelle self-service**. De afweging is opzettelijk — een te makkelijk pad is account-takeover-vehikel. De 2-dagen-doorlooptijd is een bewuste trade-off.

## Device kwijt

Amira's iPhone blijft in de trein liggen.

### Vanuit een ander device (laptop, tablet)

1. Amira logt in op `app.pulso.com` via passkey op MacBook
2. Gaat naar "Apparaten & integraties"
3. Ziet al haar sessies en devices
4. Kiest "iPhone 14 Pro — Amira" → "Uitloggen en vergeten"
5. CIAM trekt refresh-tokens in; push-notificatie naar het device (mocht het nog verbonden zijn) toont "je bent uitgelogd door een andere sessie"
6. Optioneel: meldt Amira het als gestolen — CIAM markeert `device_state=stolen`, volgende pogingen om met ditzelfde device te authenticeren worden geblokkeerd

### Vanuit geen enkel ander device

Dit is de worst-case: haar iPhone is het enige apparaat met haar passkeys (niet gesynced), en ze heeft geen wachtwoord-fallback.

Pulso's preventie: **passkey-sync via iCloud Keychain aanmoedigen bij setup** ("deze passkey zal met je andere Apple-devices worden gedeeld"). Als dat niet is gebeurd, is de fallback:

1. `pulso.com/account/recover` — self-service recovery-flow
2. Vraagt: welk e-mailadres? (als bekend)
3. Vraagt: welke persona-kenmerken? (zie "E-mail wijzigen" edge case)
4. Trust & Safety reviewt
5. Bij goedkeuring: tijdelijk wachtwoord gestuurd naar e-mail; geforceerde wachtwoordwijziging + passkey-setup bij eerste login

## Account-samenvoeging na social-login-verwarring

Scenario: Thomas registreerde twee jaar geleden met e-mail+wachtwoord. Toen hij weer wilde inloggen, koos hij "Sign in with Google" — dit leidde tot een **tweede account** omdat het Google-profiel-e-mail anders was of zijn verified status ontbrak.

Pulso's oplossing:

- "Ik heb waarschijnlijk twee accounts"-link in de support-sectie
- Self-service merge na step-up op beide accounts (sequentieel)
- Abonnement wordt overgedragen (of, als beide betaald zijn, een credit)
- Workout-historie wordt samengevoegd met conflict-resolution (duplicaten naar de primaire)
- Gebruiker kiest welk e-mailadres overblijft

Wat achter de schermen gebeurt is een CIAM-user-merge + applicatie-DB-merge, gevolgd door een event dat downstream-systemen (Stripe, analytics) de oude user-id vervangt door de nieuwe.

## Family-plan-overgangen

Pulso's family-plan (tot 6 leden) heeft extra lifecycle-events die authenticatie raken:

- **Uitnodiging**: family-owner stuurt invite-link; nieuwe of bestaande Pulso-user accepteert; bij bestaand account wordt er gekoppeld, bij nieuw signup → verify → koppel
- **Lid verwijderen**: owner kan elk lid uit het plan halen; lid houdt het account, verliest premium-toegang per volgende facturatiecyclus
- **Eigenaarschap overdragen**: owner kan plan overdragen aan een ander lid — step-up op beide accounts, 7-dagen-cooling-off
- **Lid leaves**: lid vertrekt uit plan; als ze op gratis niveau willen blijven, behouden ze hun data

Authenticatie-kant: elk familie-lid heeft een eigen user; `family_plan_id`-claim in de token koppelt ze. Rollen (owner vs. member) horen bij A2.

## Pauze en inactiviteit

Pulso biedt geen formele "pauze"-knop voor accounts zelf — alleen voor abonnementen. Voor de CIAM/A1 betekent dit:

- Account blijft geldig ongeacht abonnementstatus
- Een user die een jaar niet heeft ingelogd blijft bestaan
- Na 3 jaar inactiviteit stuurt Pulso een "we gaan je account opruimen tenzij je reageert"-mail
- Geen reactie binnen 30 dagen → account wordt automatisch verwijderd (zelfde flow als hieronder)

## Accountverwijdering (AVG-recht op vergetelheid)

Nadia's verwachting: een real delete, geen theatrale soft-delete.

### Self-service flow

1. "Profiel → Account verwijderen"
2. Step-up (passkey of TOTP) verplicht
3. Confirmatie-scherm met expliciete uitleg:
   - Wat wordt verwijderd (account, workouts, consent-log binnen bewaartermijn gereset, persoonsgegevens)
   - Wat wordt bewaard (financiële transactie-records 7 jaar, security-incidenten-log 5 jaar — wettelijke bewaarplichten)
   - Reactivering mogelijk binnen 14 dagen
4. User bevestigt met wachtwoord / passkey-assertion
5. Account gaat in "pending deletion" status
6. 14-dagen-grace-period: user kan reactiveren door in te loggen
7. Na 14 dagen: hard delete in CIAM + applicatie-DB + integratie-caches; logging-events worden geanonimiseerd (user_id → hash); consent-log blijft (zonder persoonlijke identifier, alleen proof-of-consent-evidence)

### Gedownstream-effecten

- Stripe-klantrecord: gecancelde subscription blijft vanwege boekhoudplicht, user-gegevens worden geredigeerd
- Apple Health / Google Fit-koppelingen: tokens ingetrokken via provider API
- LLM-clients: OAuth-clients ongeldig verklaard
- Family-plan: als deleting user owner was → 7-dagen-uitstel + transfer-flow vóór delete
- Community-data: berichten geanonimiseerd tot "verwijderde gebruiker"; delete-op-verzoek apart beschikbaar in community-privacy

### Data-export vóór deletie

Voor user vraagt Pulso *altijd* "wil je je data exporteren?" en biedt een **machine-leesbare JSON-export** aan (plus een leesbare PDF-samenvatting). Dit is geen AVG-verplichting op deletie-moment maar wel goed praktijk en sluit aan op Nadia's verwachting.

## Auditable events

Elk lifecycle-event wordt gelogd:

| Event | Bron | Retentie |
|-------|------|----------|
| `user.registered` | CIAM webhook | 7 jaar |
| `user.email_verified` | CIAM webhook | 7 jaar |
| `user.password_changed` | CIAM webhook | 7 jaar |
| `user.email_changed` | CIAM + Trust & Safety ticket | 7 jaar |
| `user.account_deletion_requested` | Applicatie | 7 jaar (geanonimiseerd) |
| `user.account_deleted` | Applicatie | 7 jaar (geanonimiseerd) |
| `user.family_plan_joined` | Applicatie | 7 jaar |
| `user.mfa_enrolled` / `user.mfa_removed` | CIAM webhook | 7 jaar |
| `user.passkey_added` / `user.passkey_removed` | CIAM webhook | 7 jaar |
| `session.revoked` | CIAM webhook | 3 jaar |

Precisie van events + retentie-rationale staan in `09-compliance-en-auditlogging.md`.

## Effect per persona

| Persona | Dominant lifecycle-event | Pulso's ontwerpantwoord |
|---------|----------------------------|--------------------------|
| **Amira** | Device-migratie (nieuwe iPhone) | Passkey-sync via iCloud Keychain + "alle sessies" overzicht |
| **Thomas** | Wachtwoordherstel + e-mailwissel | Robuuste flows + handmatige Trust & Safety-escalatie waar nodig |
| **Henk** | Account-linking re-auth | Proactieve "relink binnenkort nodig"-mails naar zijn dochter |
| **Nadia** | Account-verwijdering + data-export | Machine-leesbare export + transparante deletie-uitleg |

## Verhouding tot andere bouwblokken

- **A2 — Autorisatie**: wat een family-owner mag (lid verwijderen, eigenaarschap overdragen)
- **C1 — Logging & Audit Trail**: centrale opslag van alle lifecycle-events
- **D3 — Compliance Evidence & Reporting**: hoe AVG-verzoeken (recht op verwijdering, recht op inzage) worden afgehandeld
- **D4 — Rollen & Verantwoordelijkheden**: wie (Trust & Safety, Support) mag wat in deze flows
