# Persona: Thomas de wisselgebruiker

**ID:** `thomas-wisselgebruiker`
**Created:** 2026-04-24
**Version:** 1.0
**Context:** Casus 5 — Consumentenproduct (CIAM) bij Pulso

---

## Overview

> Thomas is een 42-jarige leraar natuurkunde die Pulso in vlagen gebruikt: intensief aan het begin van elk schooljaar, sporadisch tijdens drukke periodes, enthousiast hernieuwd na elke vakantie. Tussen de gebruiksperiodes is hij zijn wachtwoord vergeten, heeft hij een nieuwe telefoon, en soms is zijn oude e-mailadres niet meer van hem. Zijn relatie met de app hangt vaker dan hem lief is af van de kwaliteit van de herstelflow.

---

## Demographics

| Attribute | Value |
|-----------|-------|
| **Leeftijd** | 42 |
| **Rol/Beroep** | Docent natuurkunde (middelbaar onderwijs) |
| **Woonplaats** | Almere |
| **Tech-affiniteit** | Gemiddeld — pragmatisch gebruiker |
| **Gezin** | Getrouwd, twee kinderen (10 en 13) |

---

## Goals & Motivations

### Primary Goals

1. **Weer in beweging komen** na drukke periodes — Pulso is zijn "start-opnieuw"-knop
2. **Gewoon beginnen** zonder te worstelen met accountherstel
3. **Niet nog eens vastlopen** — hij geeft apps snel op na één slechte ervaring

### Motivations

- **Gezondheid tijdens een zittend beroep** — hij weet dat hij moet bewegen
- **Vermijden van frustratie** — zijn werkdag levert genoeg stress; de fitness-app mag er niet bij komen
- **Low-commitment hernieuwing** — hij wil niet opnieuw beginnen, hij wil doorgaan waar hij bleef

---

## Pain Points & Frustrations

Authenticatie is voor Thomas de hoofdmoot van zijn frustraties met digitale diensten.

| Pain Point | Impact | Current Workaround |
|------------|--------|--------------------|
| Wachtwoord vergeten en reset-link in SPAM | Hoog | Zoekt in alle mailmappen; soms geeft hij op |
| E-mailadres in het account is zijn vorige werkmail | Hoog | Belt de servicedesk (die er bij Pulso niet is); geeft op |
| Social login met Facebook dat hij niet meer gebruikt | Medium | Probeert e-mail/wachtwoord; herinnert dat niet meer |
| "Dit apparaat herkennen we niet" na nieuwe telefoon | Hoog | Vraagt zoon; faalt soms nog steeds |
| Wachtwoordeisen (minimaal 12 tekens, hoofdletter, cijfer, speciaal) waar zijn password manager geen toegang tot heeft | Medium | Gebruikt een variant op zijn standaardwachtwoord (onveilig, weet hij) |

---

## Behaviors & Characteristics

### Technical Proficiency

**Level:** Gemiddeld

Thomas kan zijn weg vinden, maar heeft geen mentaal model van OAuth of e-mailvervangingsflows. Hij klikt op "Wachtwoord vergeten" en verwacht dat het werkt. Als er meer dan twee stappen komen, haakt hij af.

### Usage Patterns

| Pattern | Value |
|---------|-------|
| **Frequency** | Periodiek — soms dagelijks 2 weken lang, dan maanden niets |
| **Session Duration** | 20-40 minuten als hij traint; dropoff hoog |
| **Primary Device** | iPhone (privé); geen wearables |
| **Secondary Devices** | iPad (incidenteel); schoolcomputer (nooit voor Pulso) |
| **Peak Usage Time** | Start schooljaar, na kerstvakantie, voorjaar |

### Decision Making

- **Authority Level:** Beslist zelf; soms duwt zijn partner hem terug naar Pulso
- **Risk Tolerance:** Medium — vindt wachtwoord-recycling OK "omdat het maar een fitness-app is"
- **Information Needs:** Minimaal — hij wil gewoon weer kunnen

---

## Key Tasks & Workflows

### Primary Tasks

| Task | Frequency | Priority | Complexity |
|------|-----------|----------|------------|
| Inloggen na maanden afwezigheid | 3-4× per jaar | Hoog | Surprisingly high |
| Wachtwoord resetten | 3-4× per jaar | Hoog | Medium |
| E-mailadres wijzigen (werkmail → privémail) | Eenmalig | Hoog | Hoog |
| Workout-video volgen | Dagelijks tijdens actieve periode | Hoog | Simple |
| Abonnement pauzeren tijdens drukke maanden | 1-2× per jaar | Medium | Medium |

### Typical Workflow (herstart-scenario)

1. Maandagavond — partner zegt "Je was toch weer met Pulso bezig?"
2. Hij opent de app; ziet "je sessie is verlopen"
3. Tikt wachtwoord in; fout. Probeert tweede variant; fout
4. Tikt "Wachtwoord vergeten", vult e-mail in, wacht
5. Mail komt niet binnen; controleert SPAM — er staat één van twee weken terug
6. Klikt die link — verlopen. Vraagt nieuwe; wacht
7. Mail binnen; reset wachtwoord
8. Logt in; app vraagt "nieuw apparaat geconstateerd, bevestig"
9. Krijgt code per e-mail; vult in
10. App eindelijk open; heeft al 8 minuten niet getraind

---

## Environment & Context

### Tools & Systems

- **iPhone** — meeste apps
- **iCloud Keychain** — gebruikt hij half (niet altijd voor nieuwe accounts)
- **Gmail persoonlijk** + vroeger **Outlook werk** (naar ander adres)
- **Niet**: wearables, voice-assistenten (vindt hij "niets voor mij")

### Constraints

- **Druk werkrooster** — lesuren + nakijken; authenticatie-gedoe 's avonds is een afknapper
- **Meerdere e-mailadressen** — oude werkmail, privé-Gmail, eerstgebruikte mail uit de studententijd
- **Password fatigue** — weet dat wachtwoordherhaling niet veilig is, doet het toch
- **Geen tweede factor-verwachting** — als Pulso MFA eist is de kans dat hij afhaakt reëel

### Stakeholders

| Stakeholder | Relationship | Interaction |
|-------------|--------------|-------------|
| Partner | Motivator | Incidenteel — duwt hem terug |
| Zoon (13) | Tech-support | Sporadisch, bij tech-problemen |
| Pulso support | Zelden contact | Probeert zelf; bij falen geeft hij op |

---

## Quotes & Mindset

> "Ik probeer het nog één keer en als het dan niet lukt verwijder ik de app."

> "Mijn werkmail werkt niet meer — waarom kan ik dat niet gewoon zelf aanpassen?"

> "Nog een verificatiecode? Ik heb al drie codes gekregen vandaag, van verschillende apps."

---

## Scenarios

### Success Scenario

Na zomervakantie opent Thomas Pulso. Hij weet zijn wachtwoord niet meer, tikt op "Wachtwoord vergeten", vult zijn oude Gmail in. Binnen 15 seconden is er een mail met een duidelijke knop. Hij klikt, zet een nieuw wachtwoord via zijn password manager, en is binnen. De app toont "welkom terug — je laatste workout was 4 maanden geleden; zullen we een instap-programma maken?" Hij klikt ja en is binnen drie minuten aan het trainen.

### Frustration Scenario

Thomas wil inloggen, maar gebruikt nu een andere privé-e-mail dan toen hij signup deed. Hij tikt "Wachtwoord vergeten" op het nieuwe adres — geen account gevonden. Op het oude adres — mail komt in het accountherstel-adres, maar dat hij niet meer bij kan (oude werkgever heeft de mailbox gesloten). Er is geen self-service e-mail-wijziging mogelijk zonder in te loggen. Hij mailt Pulso-support; vier dagen later krijgt hij een geautomatiseerd antwoord "we kunnen geen e-mailadressen wijzigen zonder identiteitsverificatie". Hij verwijdert de app; zijn data (en abonnementshistorie) raakt hij kwijt.

---

## User Story Mapping

> Als wisselgebruiker
> wil ik mijn e-mailadres zelf kunnen wijzigen via een veilige self-service flow,
> zodat ik niet afhankelijk ben van een oude mailbox waar ik niet meer bij kan.

> Als wisselgebruiker
> wil ik na maanden afwezigheid in maximaal twee stappen weer kunnen inloggen,
> zodat ik mijn voornemen om weer te beginnen niet verlies aan accountherstel.

---

## Notes

- Thomas is **de lifecycle/herstel-persona** — zijn frustraties leven in `08-accountlifecycle-en-herstel.md`. Elk ontwerpdilemma rond "wachtwoord vergeten", "e-mailadres wijzigen zonder toegang tot oude mail" en "device-verandering" wordt aan hem getoetst.
- Zijn profiel ondersteunt de keuze om **passkeys als primaire methode** te introduceren: dan is wachtwoord-vergeten-frictie niet meer het hoofddrama.
- Support-escalaties (identiteitsverificatie voor e-mailwissel) moeten ontworpen worden voor consumenten die géén servicedesk om de hoek hebben — idealiter video-KYC of fallback-verificatie via een eerder bekende kanaal.
