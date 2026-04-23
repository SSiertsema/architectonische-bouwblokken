import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Architectonische Bouwblokken',
  description: 'Herbruikbare bouwblokken voor veilige softwareontwikkeling',
  lang: 'nl-NL',
  cleanUrls: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Groepen',
        items: [
          { text: 'A. Identity & Access', link: '/group-a-identity-access/a1-authenticatie' },
          { text: 'B. Application Hardening', link: '/group-b-application-hardening/b1-input-validatie-en-output-encoding' },
          { text: 'C. Observability & Evidence', link: '/group-c-observability-evidence/c1-logging-en-audit-trail' },
          { text: 'D. Governance & Compliance', link: '/group-d-governance-compliance/d1-standaarden-compliance-registry' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'A. Identity & Access',
        collapsed: false,
        items: [
          {
            text: 'A1 — Authenticatie',
            link: '/group-a-identity-access/a1-authenticatie',
            collapsed: true,
            items: [
              {
                text: 'Casussen',
                collapsed: true,
                items: [
                  { text: 'Casus 1 — Interne beheertool', link: '/group-a-identity-access/a1-uitwerking/casus-1-interne-beheertool' },
                  { text: 'Casus 2 — B2B SaaS multi-IdP', link: '/group-a-identity-access/a1-uitwerking/casus-2-b2b-saas-multi-idp' },
                  { text: 'Casus 3 — Publieksapplicatie burgers', link: '/group-a-identity-access/a1-uitwerking/casus-3-publieksapplicatie-burgers' },
                  { text: 'Casus 4 — Overheidsdienst bedrijven', link: '/group-a-identity-access/a1-uitwerking/casus-4-overheidsdienst-bedrijven' },
                  { text: 'Casus 5 — Consumentenproduct (CIAM)', link: '/group-a-identity-access/a1-uitwerking/casus-5-consumentenproduct-ciam' },
                ],
              },
              {
                text: 'Uitwerking Casus 1',
                collapsed: true,
                items: [
                  { text: '01 — Context', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/01-context' },
                  { text: '02 — Identiteitsarchitectuur', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/02-identiteitsarchitectuur' },
                  { text: '03 — Authenticatieflow & app-registratie', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/03-authenticatieflow-en-app-registratie' },
                  { text: '04 — Conditional Access & MFA', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/04-conditional-access-en-mfa' },
                  { text: '05 — Identiteitsclaims & rol-levering', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/05-rollen-en-claims' },
                  { text: '06 — Sessie & tokens', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/06-sessie-en-tokens' },
                  { text: '07 — Compliance & auditlogging', link: '/group-a-identity-access/a1-uitwerking/casus-1-uitwerking/07-compliance-en-auditlogging' },
                ],
              },
              {
                text: 'Personas',
                collapsed: true,
                items: [
                  { text: 'Sanne de Beleidsmedewerker', link: '/group-a-identity-access/a1-uitwerking/personas/sanne-beleidsmedewerker' },
                ],
              },
              {
                text: 'Organisatieprofielen',
                collapsed: true,
                items: [
                  { text: 'Gemeente Meerwijde', link: '/group-a-identity-access/a1-uitwerking/organisatieprofielen/gemeente-meerwijde' },
                ],
              },
            ],
          },
          { text: 'A2 — Autorisatie', link: '/group-a-identity-access/a2-autorisatie' },
          { text: 'A3 — Sessiemanagement', link: '/group-a-identity-access/a3-sessiemanagement' },
        ],
      },
      {
        text: 'B. Application Hardening',
        collapsed: false,
        items: [
          { text: 'B1 — Input-validatie & output-encoding', link: '/group-b-application-hardening/b1-input-validatie-en-output-encoding' },
          { text: 'B2 — Dependency management & patching', link: '/group-b-application-hardening/b2-dependency-management-en-patching' },
          { text: 'B3 — Secrets management', link: '/group-b-application-hardening/b3-secrets-management' },
          { text: 'B4 — Security headers', link: '/group-b-application-hardening/b4-security-headers' },
          { text: 'B5 — Error handling', link: '/group-b-application-hardening/b5-error-handling' },
        ],
      },
      {
        text: 'C. Observability & Evidence',
        collapsed: false,
        items: [
          { text: 'C1 — Logging & audit trail', link: '/group-c-observability-evidence/c1-logging-en-audit-trail' },
          { text: 'C2 — Monitoring & alerting', link: '/group-c-observability-evidence/c2-monitoring-en-alerting' },
        ],
      },
      {
        text: 'D. Governance & Compliance',
        collapsed: false,
        items: [
          { text: 'D1 — Standaarden & compliance registry', link: '/group-d-governance-compliance/d1-standaarden-compliance-registry' },
          { text: 'D2 — Risk assessment', link: '/group-d-governance-compliance/d2-risk-assessment' },
          { text: 'D3 — Compliance evidence & reporting', link: '/group-d-governance-compliance/d3-compliance-evidence-en-reporting' },
          { text: 'D4 — Rollen & verantwoordelijkheden', link: '/group-d-governance-compliance/d4-rollen-en-verantwoordelijkheden' },
        ],
      },
    ],
    outline: {
      level: [2, 3],
      label: 'Op deze pagina',
    },
    docFooter: {
      prev: 'Vorige',
      next: 'Volgende',
    },
    darkModeSwitchLabel: 'Thema',
    lightModeSwitchTitle: 'Wissel naar licht thema',
    darkModeSwitchTitle: 'Wissel naar donker thema',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Terug naar boven',
  },
})
