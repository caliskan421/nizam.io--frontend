import type { RouteRecordRaw } from 'vue-router'

export const CALENDAR_ROUTE = { name: 'calendar', path: '/takvim' } as const

export const calendarRoutes: RouteRecordRaw[] = [
  { ...CALENDAR_ROUTE, component: () => import('./pages/CalendarPage.vue'), meta: { scope: 'S2' } },
]
