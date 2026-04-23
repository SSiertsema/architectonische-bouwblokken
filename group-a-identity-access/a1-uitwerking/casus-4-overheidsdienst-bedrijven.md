# Casus 4 — Overheidsdienst voor bedrijven

## Context

Een digitaal portaal of dienst waar ondernemers namens hun onderneming handelingen verrichten bij de overheid: vergunningaanvragen, subsidies, rapportageverplichtingen, inzage in bedrijfsdossiers of keteninteracties tussen bedrijven en uitvoerders. De gebruiker handelt niet als privépersoon maar als vertegenwoordiger van een KvK-ingeschreven rechtspersoon of eenmanszaak.

## Doelgroep

- **Primair**: wettelijk vertegenwoordigers van Nederlandse ondernemingen (bestuurder, eigenaar, bevoegd functionaris)
- **Secundair**: gemachtigden binnen of buiten de onderneming (medewerker, accountant, intermediair, branche-organisatie)
- **Uitbreiding**: EU-bedrijven die via eIDAS-notified middelen digitaal zaken willen doen met de Nederlandse overheid
- **Buiten scope**: burgers in privéhoedanigheid — die horen bij Casus 3

## Eisen die doorwegen

- **Wettelijk/beleidskader**: Forum Standaardisatie wijst eHerkenning aan als verplichte voorziening voor bedrijfsmatige authenticatie richting overheid; eigen accountregistratie voor deze doelgroep is niet acceptabel
- **Betrouwbaarheidsniveau**: per dienst vastgesteld (typisch EH2+, EH3 of EH4), gekoppeld aan de gevoeligheid van de handeling en het risico van onbedoeld handelen
- **Ketenmachtiging**: het stelsel moet aangeven of de inloggende persoon daadwerkelijk bevoegd is om namens deze onderneming déze specifieke dienst af te nemen
- **KvK-koppeling**: handelingen worden vastgelegd op KvK-nummer/vestigingsnummer, niet op de natuurlijke persoon
- **Meerdere erkende makelaars**: de dienst moet alle door het stelsel erkende leveranciers accepteren, zonder voorkeursbehandeling
- **Grensoverschrijdend**: onder de Single Digital Gateway moeten buitenlandse EU-bedrijven via hun eigen inlogmiddel terechtkunnen

## Randvoorwaarden

- De dienst is aansluitgerechtigd op het stelsel voor bedrijfsauthenticatie
- Per dienst is een dienstencatalogus-item met betrouwbaarheidsniveau en machtigingsstructuur vastgelegd
- Aansluiting verloopt via een erkende leverancier; aansluittijd en kostenstructuur zijn meegenomen in planning
- De kosten per inlog komen typisch voor rekening van de ondernemer — dit is communicatief belangrijk richting eindgebruiker

## Relatie met andere bouwblokken

- **A2 — Autorisatie**: naast identiteit bepaalt het machtigingenregister wat de ingelogde persoon namens het bedrijf mag doen
- **A3 — Sessiemanagement**: sessie is gebonden aan zowel persoon als onderneming; wisselen van onderneming vereist nieuwe authenticatie
- **C1 — Logging & Audit Trail**: logging bevat persoon, onderneming, dienst en betrouwbaarheidsniveau
- **D1 — Standaarden Compliance Registry**: verplichte standaarden (SAML 2.0, eHerkenning, eIDAS) worden vastgelegd
- **D2 — Risk Assessment**: bepaalt het benodigde betrouwbaarheidsniveau per handeling
