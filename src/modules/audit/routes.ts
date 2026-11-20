import type { RouteRecordRaw } from 'vue-router'

export const AUDIT_ROUTE = { name: 'auditHistory', path: '/islem-gecmisi' } as const

export const auditRoutes: RouteRecordRaw[] = [
  {
    ...AUDIT_ROUTE,
    component: () => import('./pages/AuditHistoryPage.vue'),
    meta: { scope: 'S1' },
  },
]
