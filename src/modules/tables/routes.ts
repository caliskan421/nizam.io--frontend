import type { RouteRecordRaw } from 'vue-router'

export const TABLES_ROUTE = { name: 'tables.list', path: '/tablolar' } as const
export const TABLE_ROUTE = { name: 'tables.detail', path: '/tablolar/:tableId' } as const

export const TABLE_DESIGN_ROUTE = { name: 'tables.design', path: '/tablolar/tasarim' } as const

const loadPage = () => import('./pages/TablesPage.vue')

export const tablesRoutes: RouteRecordRaw[] = [
  { ...TABLES_ROUTE, component: loadPage, meta: { scope: 'S2' } },
  {
    ...TABLE_DESIGN_ROUTE,
    component: () => import('./pages/TablesDesignPage.vue'),
    meta: { scope: 'S2' },
  },
  { ...TABLE_ROUTE, component: loadPage, meta: { scope: 'S2' } },
]
