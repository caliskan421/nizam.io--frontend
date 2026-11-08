import type { RouteRecordRaw } from 'vue-router'

// Yol, ad ve kapsam rota kataloğuyla (`app/routes.catalog.ts`) aynı olmalı; router uyuşmazlığı reddeder.
export const identityRoutes: RouteRecordRaw[] = [
  {
    path: '/oturum',
    name: 'identity.session',
    component: () => import('./pages/SessionPage.vue'),
    meta: { scope: 'S0' },
  },
]
