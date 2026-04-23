# Vue-frontend — implementatiestappen

Stappenplan voor het bouwen van de Vue-frontend binnen het BFF-patroon uit casus 1. Uitgangspunt: de backend regelt de OIDC-flow en zet een sessiecookie. De Vue-app hoeft zelf niets van Entra, MSAL, tokens of PKCE te weten — zij communiceert alleen met het eigen backend-API via die cookie.

## 0. Voorwaarden aan de backend-kant

Voordat het Vue-werk start moet de backend deze endpoints aanbieden:

| Endpoint | Doel |
|----------|------|
| `GET /signin` | Start de OIDC-flow, redirect naar Entra |
| `GET /signin-oidc` | Entra-redirect-URI, wisselt code om en zet sessiecookie |
| `GET /signout` | Beëindigt sessie + redirect naar Entra end-session-endpoint |
| `GET /signout-oidc` | Opruimen na Entra-signout |
| `GET /api/me` | Retourneert `{oid, name, preferred_username, roles}` op basis van de sessiecookie, of 401 |
| `POST /api/...` | Alle applicatie-API's; verplichten cookie-auth én anti-forgery token |

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

In productie serveert de backend de statische build (of Front Door routeert beide naar dezelfde App Service); cross-origin is dan niet nodig.

## 3. Typed user-model

`src/types/auth.ts`:

```ts
export type UserRole = 'Lezer' | 'Verrijker' | 'Goedkeurder' | 'Beheerder'

export interface CurrentUser {
  oid: string
  name: string
  preferredUsername: string
  roles: UserRole[]
}
```

De rol-namen komen één-op-één overeen met de `value`-velden van de app roles uit `../05-rollen-en-claims.md`.

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
    // nooit terugkeren — de browser navigeert
    return new Promise<T>(() => {})
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text())
  }

  return res.status === 204 ? (undefined as T) : res.json()
}
```

Belangrijk: de 401-handler doet een **full-page navigation**, geen SPA-route. OIDC vereist een echte browser-redirect naar Entra en de server zet de cookie alleen op een top-level request.

## 5. Pinia auth-store

`src/stores/auth.ts`:

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import type { CurrentUser, UserRole } from '@/types/auth'

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

  function hasRole(role: UserRole): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  function signIn() {
    const returnUrl = location.pathname + location.search
    location.assign('/signin?returnUrl=' + encodeURIComponent(returnUrl))
  }

  function signOut() {
    location.assign('/signout')
  }

  return { user, isReady, loadCurrentUser, hasRole, signIn, signOut }
})
```

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

// Eerst de user ophalen, dán mounten — voorkomt flash of unauthenticated UI
const auth = useAuthStore()
auth.loadCurrentUser().finally(() => app.mount('#app'))
```

## 7. Router-guards

`src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresRole?: UserRole
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',             component: () => import('@/views/Dashboard.vue'),  meta: { requiresAuth: true } },
    { path: '/dossier/:id',  component: () => import('@/views/Dossier.vue'),    meta: { requiresAuth: true, requiresRole: 'Lezer' } },
    { path: '/goedkeuren',   component: () => import('@/views/Goedkeuren.vue'), meta: { requiresAuth: true, requiresRole: 'Goedkeurder' } },
    { path: '/forbidden',    component: () => import('@/views/Forbidden.vue') },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) {
    auth.signIn()
    return false
  }
  if (to.meta.requiresRole && !auth.hasRole(to.meta.requiresRole)) {
    return { path: '/forbidden' }
  }
})

export default router
```

De route-guards zijn **UX-laag**: ze voorkomen dat Sanne een pagina ziet waar ze niets mag. De werkelijke autorisatiebeslissing valt altijd aan de backend-kant (A2). De Vue-controle mag nooit de enige poort zijn.

## 8. Rol-afhankelijke UI

Helpercomponent `src/components/RequireRole.vue`:

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/auth'

const props = defineProps<{ role: UserRole }>()
const auth = useAuthStore()
</script>

<template>
  <slot v-if="auth.hasRole(props.role)" />
</template>
```

Gebruik:

```vue
<RequireRole role="Goedkeurder">
  <button @click="approve">Goedkeuren</button>
</RequireRole>
```

## 9. Anti-forgery (CSRF)

Cookie-auth zonder CSRF-bescherming is onveilig. De backend levert een anti-forgery-token (bijv. header `X-CSRF-TOKEN` of via een cookie + header), en de HTTP-client stuurt die op elke niet-GET-request mee:

```ts
// bij bootstrap één keer ophalen
const { token } = await api<{ token: string }>('/api/antiforgery')

// in api():
headers: { ..., 'X-CSRF-TOKEN': token }
```

De exacte mechanismen worden afgestemd met de ASP.NET-Core-configuratie aan backend-zijde.

## 10. Uitloggen

```vue
<button @click="auth.signOut()">Uitloggen</button>
```

De backend verwijdert de sessie, stuurt de gebruiker door naar Entra's end-session-endpoint, Entra beëindigt de SSO-sessie en roept eventuele front-channel logout-URL's aan van andere apps (single logout, zie `../06-sessie-en-tokens.md`).

## 11. Ontwikkelcheck

Vooraf aan opleveren:

- [ ] Geen tokens, JWT's of MSAL-cache in `localStorage`, `sessionStorage` of `IndexedDB`
- [ ] 401-response leidt tot full-page redirect naar `/signin`, niet tot witte pagina of oneindige loop
- [ ] `returnUrl` parameter wordt meegegeven bij `/signin` en na login daadwerkelijk gehonoreerd door de backend
- [ ] Rol-afhankelijke UI verbergt acties die de gebruiker niet mag (UX), maar de bijbehorende API calls worden bovendien afgewezen aan backend-zijde (security)
- [ ] Logout leidt tot verwijderde cookie én afgemelde Entra-sessie
- [ ] Dev-proxy gebruikt dezelfde origin als de SPA zodat de cookie meereist
- [ ] CSP-headers (zie `B4 — Security Headers`) blokkeren inline scripts en externe origins

## 12. Teststrategie

- **Unit**: auth-store methoden (Vitest, happy-dom)
- **Component**: `RequireRole` met gemockte store
- **E2E**: Playwright/Cypress met een testaccount in een acceptatie-tenant; volledige flow van `/` → `/signin` → MFA-uitgezonderd testaccount → terug naar app

Voor E2E wordt in de acceptatie-tenant een dedicated testaccount gebruikt dat is uitgezonderd van interactieve MFA-policies (via een gerichte Conditional Access-exclusion op basis van app én gebruiker). Deze uitzondering staat gedocumenteerd en wordt periodiek gereviewd.
