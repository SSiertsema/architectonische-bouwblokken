# Vue frontend — Auth0

De Vue 3 SPA houdt **geen tokens** vast (BFF-patroon). Deze pagina beschrijft de concrete Vue-componentstructuur en API-interactie.

## Stack

- Vue 3 + Vite + TypeScript
- Pinia voor state
- Vue Router
- `axios` of `fetch` voor API-calls
- **Geen Auth0-SPA-SDK** — de BFF doet OIDC

## Directory

```
src/
├── main.ts
├── router/
│   └── index.ts             # route-guards
├── stores/
│   ├── auth.ts              # gebruikersinfo uit /api/me
│   ├── consent.ts           # consents-spiegel
│   └── devices.ts           # apparaten & integraties
├── lib/
│   └── api.ts               # fetch wrapper, credentials: include
├── views/
│   ├── SigninView.vue       # triggert full-page /signin
│   ├── DashboardView.vue
│   ├── ProfileView.vue
│   ├── DevicesView.vue      # "Apparaten & integraties"
│   └── PrivacyView.vue      # consent-toggles
└── components/
    ├── AuthGuard.vue
    ├── StepUpPrompt.vue
    └── ...
```

## Stappen

### 1. API-wrapper met cookie-support

```typescript
// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",            // stuur __Host-pulso_session mee
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    ...init
  });

  if (res.status === 401) {
    window.location.href = "/signin";  // full-page, BFF start OIDC
    throw new Error("auth_required");
  }
  if (res.status === 403 && res.headers.get("X-Stepup-Required")) {
    const stepup = new URL("/signin/stepup", window.location.origin);
    stepup.searchParams.set("return", window.location.href);
    stepup.searchParams.set("acr", res.headers.get("X-Stepup-Required")!);
    window.location.href = stepup.toString();
    throw new Error("stepup_required");
  }
  if (!res.ok) throw new Error(`api_error_${res.status}`);
  return res.json();
}
```

### 2. Auth-store

```typescript
// src/stores/auth.ts
import { defineStore } from "pinia";
import { api } from "@/lib/api";

type User = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  consents: Record<string, any>;
  region: "eu" | "us";
  acr?: string;
};

export const useAuthStore = defineStore("auth", {
  state: () => ({ user: null as User | null, loading: true }),
  actions: {
    async fetchMe() {
      this.loading = true;
      try {
        this.user = await api("/me");
      } finally {
        this.loading = false;
      }
    },
    async signOut() {
      await api("/signout", { method: "POST" });
      window.location.href = "/";
    }
  }
});
```

### 3. Route-guards

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  { path: "/", component: () => import("@/views/DashboardView.vue"), meta: { auth: true } },
  { path: "/profile", component: () => import("@/views/ProfileView.vue"), meta: { auth: true } },
  { path: "/privacy", component: () => import("@/views/PrivacyView.vue"), meta: { auth: true } },
  { path: "/devices", component: () => import("@/views/DevicesView.vue"), meta: { auth: true, acrMin: "urn:pulso:acr:stepped_up_recent" } },
  { path: "/signin", component: () => import("@/views/SigninView.vue") }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
  if (!to.meta.auth) return true;
  const auth = useAuthStore();
  if (!auth.user) await auth.fetchMe();
  if (!auth.user) return "/signin";

  if (to.meta.acrMin && auth.user.acr !== to.meta.acrMin) {
    const stepup = new URL("/signin/stepup", window.location.origin);
    stepup.searchParams.set("return", to.fullPath);
    stepup.searchParams.set("acr", to.meta.acrMin as string);
    window.location.href = stepup.toString();
    return false;
  }
  return true;
});

export default router;
```

### 4. SigninView — full-page redirect naar BFF

```vue
<!-- src/views/SigninView.vue -->
<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  // BFF start de OIDC-flow
  window.location.href = "/signin/start";
});
</script>

<template>
  <main class="signin">
    <p>Bezig met inloggen…</p>
  </main>
</template>
```

### 5. Consent-UI — PrivacyView

```vue
<!-- src/views/PrivacyView.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

const auth = useAuthStore();
const consents = ref<Record<string, any>>({});

onMounted(async () => {
  if (!auth.user) await auth.fetchMe();
  consents.value = structuredClone(auth.user!.consents);
});

async function save() {
  await api("/me/consents", {
    method: "PATCH",
    body: JSON.stringify(consents.value)
  });
  await auth.fetchMe();
}
</script>

<template>
  <section class="privacy">
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
        Hartslag-tijdreeksen
      </label>
      <label>
        <input type="checkbox" v-model="consents.health_data.sleep" />
        Slaapanalyse
      </label>
      <!-- ... overige ... -->
    </fieldset>

    <fieldset>
      <legend>Delen met derden</legend>
      <label>
        <input type="checkbox" v-model="consents.third_party.llm_claude" />
        Claude (LLM-coach)
      </label>
      <label>
        <input type="checkbox" v-model="consents.third_party.llm_chatgpt" />
        ChatGPT Actions
      </label>
    </fieldset>

    <button @click="save">Opslaan</button>
  </section>
</template>
```

### 6. DevicesView — apparaten en sessies intrekken

```vue
<!-- src/views/DevicesView.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api } from "@/lib/api";

type DeviceSession = {
  id: string;
  device_type: "web" | "ios" | "android" | "watch" | "voice" | "llm" | "glasses";
  label: string;
  last_used: string;
  location_estimate?: string;
};

const sessions = ref<DeviceSession[]>([]);

onMounted(async () => {
  sessions.value = await api("/me/devices");
});

async function revoke(id: string) {
  await api(`/me/devices/${id}/revoke`, { method: "POST" });
  sessions.value = sessions.value.filter((s) => s.id !== id);
}

async function revokeAll() {
  if (!confirm("Alle sessies (behalve deze) uitloggen?")) return;
  await api("/me/devices/revoke-all", { method: "POST" });
  sessions.value = await api("/me/devices");
}
</script>

<template>
  <section>
    <h1>Apparaten & integraties</h1>
    <button @click="revokeAll">Alles uitloggen</button>
    <ul>
      <li v-for="s in sessions" :key="s.id">
        <strong>{{ s.label }}</strong>
        <span>{{ s.device_type }}</span>
        <time>{{ s.last_used }}</time>
        <button @click="revoke(s.id)">Uitloggen</button>
      </li>
    </ul>
  </section>
</template>
```

Deze view vereist step-up (`acrMin` in de router). De BFF controleert dat ook server-side.

## Development-tips

- Gebruik `vite.config.ts` met een proxy naar de lokale BFF (port 3000) — zo blijft `credentials: "include"` in dev werken
- Mock BFF met MSW voor frontend-tests; dat houdt Auth0-kennis buiten de frontend-test-scope
- Error-boundaries in Vue router: 401 toont nooit een foutmelding maar navigeert altijd naar `/signin`
- Gebruik Strict Content-Security-Policy — scripts alleen vanuit eigen origin en Auth0's custom domain

## Wat het NIET doet

- Geen Auth0-SPA-SDK, geen `@auth0/auth0-vue` — de BFF doet authenticatie
- Geen token-storage in `localStorage` of `sessionStorage` — tokens leven nooit in de browser
- Geen eigen passkey-implementatie — Auth0's Universal Login doet dat
