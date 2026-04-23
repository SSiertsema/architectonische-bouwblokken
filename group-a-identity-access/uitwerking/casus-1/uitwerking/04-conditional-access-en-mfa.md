# 04 — Conditional Access en MFA

## Uitgangspunt

MFA en andere toegangscondities worden **niet in de applicatie** afgedwongen, maar in Entra ID via **Conditional Access (CA)**. De applicatie vertrouwt erop dat elk ID-token dat zij ontvangt, alle relevante CA-policies heeft doorlopen. Dit houdt de applicatie zelf klein en zorgt dat wijzigingen in het organisatiebrede veiligheidsbeleid automatisch doorwerken zonder applicatiewijziging.

## Policy-structuur in Meerwijde

Conditional Access is in Meerwijde gelaagd opgebouwd. Van breed (alle apps) naar specifiek (alleen de beheertool):

### Laag 1 — Organisatiebrede baseline

Deze policies gelden voor alle cloud-apps, niet alleen voor de beheertool:

- **Block legacy authentication** — alle IMAP/POP/SMTP basic auth wordt geweigerd
- **Require MFA for all users** — alle medewerkers, alle apps; de eerste inlog per dag vraagt MFA, daarna werkt het PRT
- **Block sign-in from outside allowed countries** — toegang vanuit EU + enkele expliciet toegestane landen; de rest geblokkeerd
- **Require compliant or Hybrid Azure AD-joined device** — inloggen vanaf niet-beheerde apparaten wordt geweigerd

### Laag 2 — Policies specifiek voor de beheertool

| Policy | Kenmerk |
|--------|---------|
| **CA-Beheertool-MFA** | Target: alle gebruikers met toegang tot de Enterprise Application `beheertool-prod`. Grant: require MFA + require compliant device |
| **CA-Beheertool-SessionControl** | Sign-in frequency: 8 uur. Persistent browser session: Never. Effect: na een werkdag opnieuw een MFA-prompt |
| **CA-Beheertool-Beheerders-StrictDevice** | Target: leden van de app role `Beheerder`. Grant: require compliant device met risk score Low. Sign-in frequency: 4 uur |

### Laag 3 — Identity Protection (P2)

Voor gebruikers met Entra ID P2 zijn risk-based policies actief:

- **Sign-in risk = medium/high** → block en trigger sign-in risk remediation
- **User risk = high** → block en trigger password reset
- Risk-signalen komen uit Identity Protection (atypical travel, anonymous IP, leaked credentials, malware-infected device)

## Geaccepteerde MFA-methoden

Conform het Meerwijde-beleid zijn alleen sterke factoren toegestaan:

- **Microsoft Authenticator** met push + number matching
- **FIDO2-security key** (YubiKey, feitelijk alleen voor IT en beheer)
- **Windows Hello for Business** op de werkplek

Uitgesloten:

- **SMS- en voice-call OTP** — uitgefaseerd wegens SIM-swap-risico
- **E-mail OTP** — niet beschikbaar als tweede factor voor werkaccounts

## Privileged Identity Management (PIM)

Gebruikers met beheerrechten in de applicatie krijgen die rechten **niet permanent**, maar via **PIM for Groups**:

- De AD-groep `APP-Beheertool-Beheerders` is onder PIM-beheer gebracht in Entra
- Medewerkers zijn *eligible* member, geen *active*
- Activatie voor maximaal 4 uur, met verplichte rechtvaardiging (vrije tekst of ticket-ID)
- MFA op het moment van activatie
- Gecontroleerde rollen (zoals toegang tot pseudonimisering of schrap-functies) vragen bovendien goedkeuring van een tweede beheerder

Na afloop vervalt het actieve lidmaatschap en valt de gebruiker terug op zijn reguliere rechten. Activaties en deactivaties verschijnen in de Entra audit log en worden naar Sentinel doorgeleid.

## Break-glass accounts

Twee cloud-only accounts (`bg1@meerwijde.onmicrosoft.com`, `bg2@meerwijde.onmicrosoft.com`) staan buiten alle Conditional Access-policies. Eigenschappen:

- Alleen te gebruiken als CA of MFA storing heeft
- Ingelogd worden getriggerd als alert naar de CISO en het SOC (via Sentinel)
- Credentials versleuteld bewaard op twee fysiek gescheiden locaties (kluis en off-site)
- FIDO2-key als tweede factor, ondanks vrijstelling van CA
- Periodieke test (minimaal per kwartaal) dat de accounts werken

## Effect voor Sanne

Voor Sanne — beleidsmedewerker, hybride werkend, op een Intune-beheerde laptop — betekent dit samenspel:

- 's Ochtends eerste keer inloggen op haar laptop: Windows Hello → PRT actief
- De beheertool openen: CA-policies evalueren, alle checks slagen, geen extra prompt
- Sign-in frequency van 8 uur betekent dat ze aan het begin van de volgende werkdag één push-notificatie op haar telefoon krijgt en daarna weer stilletjes door kan werken
- Als ze 's avonds vanaf haar privé-laptop probeert in te loggen: CA weigert wegens niet-compliant device, met een duidelijke foutpagina die verwijst naar de servicedesk
