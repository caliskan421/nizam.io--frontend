import type { RouteRecordRaw } from 'vue-router'

/** Rota adı/yolu katalogla (`app/routes.catalog.ts`) AYNIDIR; router sapmayı hata sayar. */
export const DELETED_RECORDS_ROUTE = {
  name: 'deleted-records.list',
  path: '/silinen-kayitlar',
} as const

/** 12 URL durumu (K10; `12-silinen-kayitlar/README.md` rota satırı). */
export const DELETED_RECORDS_QUERY_KEYS = [
  'tur',
  'q',
  'koordinatorluk',
  'kayit',
  'aralik',
  'silen',
] as const

export const deletedRecordsRoutes: RouteRecordRaw[] = [
  {
    ...DELETED_RECORDS_ROUTE,
    component: () => import('./pages/DeletedRecordsPage.vue'),
    meta: { scope: 'S2' },
  },
]
