# Casus 3 — Publieksapplicatie voor burgers (NL)

## Context

Een digitale dienst waar Nederlandse burgers inloggen om persoonlijke zaken te regelen, bijvoorbeeld een gemeentelijk loket, een zorgportaal, een uitkeringsaanvraag of een inzagedienst. De dienst verwerkt persoonsgegevens en vaak het BSN, en valt binnen het speelveld van de Nederlandse overheid of een uitvoeringsorganisatie.

## Doelgroep

- **Primair**: meerderjarige ingezetenen van Nederland met een actief burgeraccount
- **Secundair**: gemachtigden (mantelzorger, bewindvoerder, ouder van minderjarige)
- **Uitbreiding**: EU-burgers die via hun eigen nationale inlogmiddel toegang zoeken (eIDAS)
- **Buiten scope**: zakelijke gebruikers — die horen bij Casus 4

## Eisen die doorwegen

- **Wettelijk/beleidskader**: Forum Standaardisatie schrijft het gebruik van het Nederlandse inlogstelsel voor ("pas toe of leg uit"); eigen gebruikersregistratie voor authenticatie is niet acceptabel
- **Betrouwbaarheidsniveau (eIDAS)**: per dienst moet worden vastgesteld of Laag, Substantieel of Hoog vereist is — dit bepaalt welke inlogmiddelen acceptabel zijn
- **BSN-verwerking**: alleen toegestaan met wettelijke grondslag (Wet algemene bepalingen burgerservicenummer); de koppeling tussen inlog en BSN verloopt via het stelsel, niet via de applicatie zelf
- **Machtigen**: voor veel diensten moet een burger namens een ander kunnen handelen; dit vereist integratie met de machtigingsvoorziening
- **Toegankelijkheid**: WCAG 2.1 AA voor het inlogtraject (Besluit digitale toegankelijkheid overheid)
- **Grensoverschrijdend**: diensten die onder de Single Digital Gateway vallen moeten eIDAS-notified middelen uit andere EU-lidstaten accepteren

## Randvoorwaarden

- De organisatie is aansluitgerechtigd op het stelsel (publiekrechtelijke taak of aangewezen organisatie)
- PKIoverheid-certificaten zijn beschikbaar voor de aansluiting
- De aansluitprocedure bij Logius is ingepland; doorlooptijd van weken tot maanden

## Relatie met andere bouwblokken

- **A2 — Autorisatie**: na authenticatie wordt bepaald of de burger de specifieke dienst mag gebruiken (leeftijd, woonplaats, dossier)
- **A3 — Sessiemanagement**: sessieduur sluit aan bij het betrouwbaarheidsniveau; Single Logout conform stelsel
- **C1 — Logging & Audit Trail**: inloggen én BSN-gebruik worden apart gelogd voor auditdoeleinden
- **D1 — Standaarden Compliance Registry**: verplichte standaarden (SAML 2.0, eIDAS) worden vastgelegd
- **D3 — Compliance Evidence & Reporting**: bewijslast voor Logius-audits en eIDAS-conformiteit
