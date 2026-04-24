# Nuxt frontend — Zitadel

Nuxt 3/4 + `nuxt-oidc-auth`. De Nitro-server is de BFF: hij doet OIDC tegen Zitadel, beheert de server-side sessie, en proxied API-calls naar FastAPI met een vers Bearer-token.

## Packages

```bash
pnpm add -D nuxt-oidc-auth
# of
npm install -D nuxt-oidc-auth
```

`nuxt-oidc-auth` wordt actief gemaintained en biedt een ingebouwde Zitadel-provider (zie [nuxtoidc.cloud/provider/zitadel](https://nuxtoidc.cloud/provider/zitadel)). Het module doet PKCE by default, encrypted-cookie-sessie, automatische refresh, en validation van id_tokens.

## Project-layout

```
app/
├── nuxt.config.ts
├── pages/
│   ├── index.vue
│   ├── dashboard.vue              # protected via middleware
│   ├── profile.vue                # protected
│   ├── privacy.vue                # protected (consent-toggles)
│   └── devices.vue                # protected + step-up vereist
├── middleware/
│   └── auth.global.ts             # protect alle /dashboard, /profile, /privacy, /devices
├── composables/
│   └── useApi.ts                  # wrapper om $fetch met credentials
├── server/
│   ├── api/
│   │   ├── workouts.get.ts        # proxy → FastAPI
│   │   ├── me/
│   │   │   ├── index.get.ts       # /api/me
│   │   │   ├── consents.patch.ts
│   │   │   ├── devices.get.ts
│   │   │   └── devices/
│   │   │       ├── [id]/revoke.post.ts
│   │   │       └── revoke-all.post.ts
│   │   └── [...slug].ts           # catch-all fallback-proxy
│   └── utils/
│       └── proxy.ts               # shared proxy-helper
└── .env                           # NUXT_OIDC_* variabelen
```

## nuxt.config.ts

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-oidc-auth'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
    },
    oidc: {
      defaultProvider: 'zitadel',
      session: {
        automaticRefresh: true,
        expirationThreshold: 60,       // refresh 60s vóór expiry
      },
      providers: {
        zitadel: {
          clientId: process.env.NUXT_OIDC_PROVIDERS_ZITADEL_CLIENT_ID!,
          clientSecret: '',             // leeg = PKCE (public client)
          baseUrl: process.env.NUXT_OIDC_PROVIDERS_ZITADEL_BASE_URL!,
          redirectUri: process.env.NUXT_OIDC_PROVIDERS_ZITADEL_REDIRECT_URI!,
          audience: process.env.NUXT_OIDC_PROVIDERS_ZITADEL_AUDIENCE!,
          logoutRedirectUri: `${process.env.NUXT_PUBLIC_APP_URL}/`,
          authenticationScheme: 'none', // PKCE
          scope: [
            'openid',
            'profile',
            'email',
            'offline_access',
            'urn:zitadel:iam:user:metadata',
            'urn:zitadel:iam:user:resourceowner',
            'urn:zitadel:iam:org:projects:roles',
            // Pulso-specifieke scopes die FastAPI verwacht:
            'workouts.read',
            'workouts.write',
          ],
          additionalAuthParameters: {
            // Forceer project-audience zodat FastAPI het token accepteert
            // (Zitadel levert een token met aud=project-ID bij deze scope)
          },
          exposeAccessToken: true,     // nodig voor server-proxy naar FastAPI
        },
      },
    },
  },
})
```

### Environment

```bash
# .env
NUXT_OIDC_SESSION_SECRET=...64-byte-hex...
NUXT_OIDC_TOKEN_KEY=...32-byte-hex...
NUXT_OIDC_AUTH_SESSION_SECRET=...
NUXT_OIDC_PROVIDERS_ZITADEL_CLIENT_ID=123456789@pulso-platform
NUXT_OIDC_PROVIDERS_ZITADEL_BASE_URL=https://pulso-eu.zitadel.cloud
NUXT_OIDC_PROVIDERS_ZITADEL_REDIRECT_URI=https://app.pulso.com/auth/zitadel/callback
NUXT_OIDC_PROVIDERS_ZITADEL_AUDIENCE=123456789@pulso-platform
NUXT_PUBLIC_APP_URL=https://app.pulso.com
NUXT_PUBLIC_API_BASE_URL=/api           # via Nuxt-server-proxy naar FastAPI
NUXT_API_INTERNAL_URL=http://fastapi.internal:8000   # server-side alleen
```

## Route-middleware

```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/auth/login', '/auth/zitadel/callback', '/auth/logout']
  if (publicRoutes.includes(to.path)) return

  const { loggedIn, user } = useOidcAuth()

  if (!loggedIn.value) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  // Step-up voor gevoelige paden
  const requiresStepUp = ['/devices', '/profile/delete', '/profile/email', '/privacy/export']
  if (requiresStepUp.some((p) => to.path.startsWith(p))) {
    const acr = user.value?.claims?.acr
    if (acr !== 'urn:pulso:acr:stepped_up_recent') {
      return navigateTo(
        `/auth/login?acr=urn:pulso:acr:stepped_up_recent&redirect=${encodeURIComponent(to.fullPath)}`
      )
    }
  }
})
```

## Login-pagina

`nuxt-oidc-auth` registreert automatisch `/auth/login` en `/auth/zitadel/callback`. De login-pagina hoeft niets bijzonders — de module handelt de redirect af:

```vue
<!-- pages/auth/login.vue -->
<script setup lang="ts">
const route = useRoute()
const { login } = useOidcAuth()

onMounted(() => {
  login('zitadel', {
    redirect: route.query.redirect as string,
    acrValues: route.query.acr as string | undefined,
  })
})
</script>

<template>
  <main><p>Bezig met inloggen…</p></main>
</template>
```

## Server-BFF-proxy naar FastAPI

Dit is de kern van variant C: de Nitro-server pakt het access-token uit de session en voegt het toe aan elke proxy-call naar FastAPI.

```typescript
// server/utils/proxy.ts
import type { H3Event } from 'h3'

export async function proxyToFastAPI<T = unknown>(
  event: H3Event,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const session = await getUserSession(event)
  if (!session?.oidcAuth) {
    throw createError({ statusCode: 401, statusMessage: 'auth_required' })
  }

  const accessToken = session.oidcAuth.accessToken
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'no_access_token' })
  }

  const config = useRuntimeConfig()
  const url = `${config.apiInternalUrl}${path}`

  const response = await $fetch.raw<T>(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Request-ID': getHeader(event, 'x-request-id') ?? crypto.randomUUID(),
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  // Forward step-up-vereiste headers
  const stepUpHeader = response.headers.get('X-Stepup-Required')
  if (stepUpHeader) {
    setHeader(event, 'X-Stepup-Required', stepUpHeader)
  }

  return response._data as T
}
```

### Concrete proxy-endpoints

```typescript
// server/api/workouts.get.ts
export default defineEventHandler(async (event) => {
  return await proxyToFastAPI(event, '/workouts/recent')
})

// server/api/me/index.get.ts
export default defineEventHandler(async (event) => {
  return await proxyToFastAPI(event, '/me')
})

// server/api/me/consents.patch.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await proxyToFastAPI(event, '/me/consents', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
})

// server/api/me/devices.get.ts
export default defineEventHandler(async (event) => {
  return await proxyToFastAPI(event, '/me/devices')
})

// server/api/me/devices/[id]/revoke.post.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await proxyToFastAPI(event, `/me/devices/${id}/revoke`, {
    method: 'POST',
  })
})

// server/api/me/devices/revoke-all.post.ts
export default defineEventHandler(async (event) => {
  return await proxyToFastAPI(event, '/me/devices/revoke-all', {
    method: 'POST',
  })
})
```

## Composable voor client-side fetch

```typescript
// composables/useApi.ts
export function useApi<T = unknown>() {
  const { apiBaseUrl } = useRuntimeConfig().public

  return {
    async get(path: string): Promise<T> {
      return await $fetch<T>(`${apiBaseUrl}${path}`)
    },
    async post(path: string, body: unknown): Promise<T> {
      return await $fetch<T>(`${apiBaseUrl}${path}`, {
        method: 'POST',
        body,
      })
    },
    async patch(path: string, body: unknown): Promise<T> {
      return await $fetch<T>(`${apiBaseUrl}${path}`, {
        method: 'PATCH',
        body,
      })
    },
  }
}
```

## Beschermde pagina — Dashboard

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
const { user } = useOidcAuth()
const api = useApi<{ sub: string; email: string; consents: Record<string, any> }>()
const { data: me } = await useAsyncData('me', () => api.get('/me'))

const { data: workouts } = await useAsyncData('workouts', () =>
  api.get<{ workouts: unknown[] }>('/workouts/recent')
)
</script>

<template>
  <main>
    <h1>Welkom, {{ user?.claims?.name ?? user?.claims?.preferred_username }}</h1>
    <section v-if="me">
      <p>Consents actief: {{ Object.keys(me.consents).length }}</p>
    </section>
    <section v-if="workouts">
      <h2>Laatste workouts</h2>
      <!-- ... -->
    </section>
  </main>
</template>
```

## Privacy-pagina (consent-toggles)

```vue
<!-- pages/privacy.vue -->
<script setup lang="ts">
const api = useApi<{ consents: Record<string, any> }>()
const { data: me, refresh } = await useAsyncData('me', () => api.get('/me'))

const consents = ref(structuredClone(me.value?.consents ?? {}))

async function save() {
  await api.patch('/me/consents', consents.value)
  await refresh()
}
</script>

<template>
  <main>
    <h1>Privacy & consent</h1>
    <fieldset>
      <legend>Analytics</legend>
      <label>
        <input type="checkbox" v-model="consents.analytics" />
        Gebruik van product-analytics (geaggregeerd)
      </label>
    </fieldset>

    <fieldset>
      <legend>Gezondheidsdata</legend>
      <label>
        <input type="checkbox" v-model="consents.health_data.heart_rate" />
        Hartslag
      </label>
      <label>
        <input type="checkbox" v-model="consents.health_data.sleep" />
        Slaap
      </label>
    </fieldset>

    <fieldset>
      <legend>LLM-integraties</legend>
      <label>
        <input type="checkbox" v-model="consents.third_party.llm_claude" />
        Claude
      </label>
      <label>
        <input type="checkbox" v-model="consents.third_party.llm_chatgpt" />
        ChatGPT
      </label>
    </fieldset>

    <button @click="save">Opslaan</button>
  </main>
</template>
```

## Devices-pagina (step-up vereist)

```vue
<!-- pages/devices.vue -->
<script setup lang="ts">
// middleware enforce al dat acr=stepped_up_recent
const api = useApi<{ id: string; label: string; device_type: string; last_used: string }[]>()
const { data: sessions, refresh } = await useAsyncData('devices', () => api.get('/me/devices'))

async function revoke(id: string) {
  await $fetch(`/api/me/devices/${id}/revoke`, { method: 'POST' })
  await refresh()
}

async function revokeAll() {
  if (!confirm('Alle sessies (behalve deze) uitloggen?')) return
  await $fetch('/api/me/devices/revoke-all', { method: 'POST' })
  await refresh()
}
</script>

<template>
  <main>
    <h1>Apparaten & integraties</h1>
    <button @click="revokeAll">Alles uitloggen</button>
    <ul>
      <li v-for="s in sessions" :key="s.id">
        <strong>{{ s.label }}</strong> — {{ s.device_type }} — {{ s.last_used }}
        <button @click="revoke(s.id)">Uitloggen</button>
      </li>
    </ul>
  </main>
</template>
```

## Logout

`nuxt-oidc-auth` registreert `/auth/logout`. Standaard doet het een federated logout bij Zitadel en vernietigt de lokale sessie:

```vue
<!-- components/UserMenu.vue -->
<script setup lang="ts">
const { logout } = useOidcAuth()
</script>

<template>
  <button @click="logout('zitadel')">Uitloggen</button>
</template>
```

Onder de motorkap gaat Nuxt naar Zitadel's `/oauth/v2/end_session` met de `id_token_hint` en `post_logout_redirect_uri`.

## Sessie-verversing

Zet je `automaticRefresh: true` (zoals in `nuxt.config.ts`), dan vernieuwt Nitro het access-token automatisch ~60 seconden vóór expiry. Bij een succesvolle refresh wordt de cookie bijgewerkt. Bij `invalid_grant` (reuse-detection getriggerd in Zitadel) wordt de sessie gewist en gebruikt Nuxt de volgende auth-check om naar `/auth/login` te redirecten.

## Waarom dit werkt

- **Browser krijgt nooit een token** — alleen de encrypted session-cookie, `HttpOnly`, `Secure`, `SameSite=Lax`.
- **Nuxt server is de BFF** — net zoals de Node-Fastify-BFF in variant A/B. De Nitro-server is alleen binnen dezelfde deployment actief; `apiInternalUrl` wijst naar FastAPI via private networking.
- **Nuxt- en Zitadel-integratie is standaard** — geen eigen OAuth-code, geen eigen session-management. `nuxt-oidc-auth` doet PKCE, rotation, encrypted cookies, validation.
- **Composables werken zowel server-side als client-side** — `useOidcAuth()` kan je in pages én middleware gebruiken; `useApi()` abstracteert of je tijdens SSR of CSR praat.
- **Mobile / voice / LLM gaan niet via Nuxt** — die kanalen praten rechtstreeks met Zitadel en rechtstreeks met FastAPI (met een Bearer-token die ze zelf hebben). Zie de andere bestanden van deze variant.
