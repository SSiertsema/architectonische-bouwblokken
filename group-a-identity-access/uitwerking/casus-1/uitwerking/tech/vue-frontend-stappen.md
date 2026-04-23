# Vue-frontend — implementatiestappen

Stappenplan voor het bouwen van de Vue-frontend binnen het BFF-patroon uit casus 1. Uitgangspunt: de backend regelt de OIDC-flow en zet een sessiecookie. De Vue-app hoeft zelf niets van Entra, MSAL, tokens of PKCE te weten — zij communiceert alleen met het eigen backend-API via die cookie.

> **Scope.** Dit bestand beschrijft uitsluitend het authenticatie-aspect van de Vue-frontend: hoe de applicatie vaststelt of er een geldige sessie is, hoe inloggen en uitloggen verlopen, en hoe de identiteit van de gebruiker wordt ontsloten. Wat de applicatie vervolgens mag doen op basis van die identiteit — welke menu-items getoond worden, welke routes beperkt zijn, welke acties geblokkeerd worden — valt onder **A2 — Autorisatie** en wordt daar uitgewerkt.

## 0. Voorwaarden aan de backend-kant

Voordat het Vue-werk start moet de backend deze endpoints aanbieden:

| Endpoint | Doel |
|----------|------|
| `GET /signin` | Start de OIDC-flow, redirect naar Entra |
| `GET /signin-oidc` | Entra-redirect-URI, wisselt code om en zet sessiecookie |
| `GET /signout` | Beëindigt de sessie, redirect naar Entra end-session-endpoint |
| `GET /signout-oidc` | Opruimen na Entra-signout |
| `GET /api/me` | Retourneert `{oid, name, preferredUsername}` op basis van de sessiecookie, of 401 |

## 1. Projectopzet

```bash
npm create vue@latest beheertool-frontend -- --ts --router --pinia --eslint
cd beheertool-frontend
npm install
```

Kies bij de scaffolder: TypeScript, Vue Router, Pinia, ESLint + Prettier. Vitest is optioneel maar aanbevolen voor de auth-store-tests.

## 2. Dev-proxy naar de backend

In `vite.config.ts` een proxy configureren zodat `/api` en `/signin*` tijdens development naar de lokale backend wijzen en de cookie dezelfde origin deelt:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api':           { target: 'http://localhost:5000', changeOrigin: false },
      '/signin':        { target: 'http://localhost:5000', changeOrigin: false },
      '/signin-oidc':   { target: 'http://localhost:5000', changeOrigin: false },
      '/signout':       { target: 'http://localhost:5000', changeOrigin: false },
      '/signout-oidc':  { target: 'http://localhost:5000', changeOrigin: false },
    },
  },
})
```

In productie serveert de backend de statische build (of Front Door routeert beide naar dezelfde origin); cross-origin is dan niet nodig.

## 3. Typed user-model

`src/types/auth.ts`:

```ts
export interface CurrentUser {
  oid: string
  name: string
  preferredUsername: string
}
```

Dit model bevat alleen de identiteit die door Entra is bevestigd. Aanvullende claims die relevant zijn voor autorisatiebeslissingen worden niet door deze laag afgehandeld.

## 4. HTTP-client met cookie en 401-gedrag

`src/lib/api.ts`:

```ts
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include', // cookie meesturen
    headers: {
      'Accept': 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (res.status === 401) {
    // sessie vervallen of nog niet gestart — full-page redirect
    window.location.assign('/signin?returnUrl=' + encodeURIComponent(location.pathname + location.search))
    return new Promise<T>(() => {}) // nooit terugkeren — de browser navigeert
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text())
  }

  return res.status === 204 ? (undefined as T) : res.json()
}
```

Belangrijk: de 401-handler doet een **full-page navigation**, geen SPA-route. OIDC vereist een echte browser-redirect naar Entra, en de server zet de cookie alleen op een top-level request.

## 5. Pinia auth-store

`src/stores/auth.ts`:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { CurrentUser } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(null)
  const isReady = ref(false)

  async function loadCurrentUser() {
    try {
      user.value = await api<CurrentUser>('/api/me')
    } catch {
      user.value = null
    } finally {
      isReady.value = true
    }
  }

  function signIn() {
    const returnUrl = location.pathname + location.search
    location.assign('/signin?returnUrl=' + encodeURIComponent(returnUrl))
  }

  function signOut() {
    location.assign('/signout')
  }

  return { user, isReady, loadCurrentUser, signIn, signOut }
})
```

De store doet twee dingen: vaststellen of er een geauthenticeerde sessie is, en de identiteit beschikbaar maken voor weergave (naam in de header, welkomsttekst, et cetera).

## 6. App bootstrap

`src/main.ts`:

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Eerst de identiteit ophalen, dán mounten — voorkomt flash of unauthenticated UI
const auth = useAuthStore()
auth.loadCurrentUser().finally(() => app.mount('#app'))
```

## 7. Router-guards

`src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',             component: () => import('@/views/Dashboard.vue'), meta: { requiresAuth: true } },
    { path: '/dossier/:id',  component: () => import('@/views/Dossier.vue'),   meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) {
    auth.signIn()
    return false
  }
})

export default router
```

De route-guard kijkt uitsluitend of er *überhaupt* een geauthenticeerde sessie is. De vraag "mag deze gebruiker déze route zien" valt onder A2.

## 8. Uitloggen

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <button @click="auth.signOut()">Uitloggen</button>
</template>
```

De backend verwijdert de sessie, stuurt de gebruiker door naar Entra's end-session-endpoint, Entra beëindigt de SSO-sessie en roept eventuele front-channel logout-URL's aan van andere apps (single logout, zie `../06-sessie-en-tokens.md`).

## 9. Ontwikkelcheck

Vooraf aan opleveren:

- [ ] Geen tokens, JWT's of MSAL-cache in `localStorage`, `sessionStorage` of `IndexedDB`
- [ ] 401-response leidt tot full-page redirect naar `/signin`, niet tot witte pagina of oneindige loop
- [ ] `returnUrl` parameter wordt meegegeven bij `/signin` en na login gehonoreerd door de backend
- [ ] Logout leidt tot verwijderde cookie én afgemelde Entra-sessie
- [ ] Dev-proxy gebruikt dezelfde origin als de SPA zodat de cookie meereist
- [ ] CSP-headers (zie `B4 — Security Headers`) blokkeren inline scripts en externe origins

## 10. Teststrategie

- **Unit** (Vitest): auth-store methoden, HTTP-client 401-gedrag
- **E2E** (Playwright): volledige flow van `/` → `/signin` → Entra → terug naar app met cookie; logout via `/signout` naar Entra end-session → cookie weg

Voor E2E wordt in een acceptatie-tenant een dedicated testaccount gebruikt. Uitzonderingen op interactieve MFA-policies voor dit account worden vastgelegd en periodiek gereviewd conform `../04-conditional-access-en-mfa.md`.

## Aanvullende beveiliging buiten A1-scope

- **Cross-Site Request Forgery (CSRF)** — bescherming van de authenticated sessie tegen cross-site misbruik valt onder **A3 — Sessiemanagement** en **B — Application Hardening**
- **Autorisatie in de UI** — welke menu-items, routes en acties zichtbaar of uitvoerbaar zijn valt onder **A2 — Autorisatie**
- **Security headers** (CSP, HSTS, etc.) — zie **B4 — Security Headers**
