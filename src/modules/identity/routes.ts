import type { RouteRecordRaw } from 'vue-router'

export const identityRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'identity.session',
    component: () => import('./pages/SessionPage.vue'),
    meta: { scope: 'S0' },
  },
]
