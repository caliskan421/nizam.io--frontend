import { defineComponent, h } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import ReportsGate from './routing/ReportsGate.vue'

/**
 * Rota adları/yolları katalogla (`app/routes.catalog.ts`) AYNIDIR; router sapmayı hata sayar.
 * Yalnız iki rapor rotası vardır (K10): ikisi de yalnız şirket yöneticisi için (rota kapısı
 * `ReportsGate`, `me.company_admin`); `/raporlar` rotası yoktur (E-13-76).
 */
export const REPORT_SEASON_ROUTE = { name: 'reports.season', path: '/arsiv/donem-raporu' } as const
export const REPORT_MEETING_ROUTE = {
  name: 'reports.meeting',
  path: '/toplantilar/:meetingId/rapor',
} as const

/** Sayfa gövdesini yönetici kapısıyla sarar (gövde W138'de dolar; kapı gövdeden bağımsızdır). */
function gated(load: () => Promise<{ default: object }>, name: string) {
  return () =>
    load().then(({ default: page }) =>
      defineComponent({
        name,
        setup: () => () => h(ReportsGate, null, { default: () => h(page) }),
      }),
    )
}

export const reportsRoutes: RouteRecordRaw[] = [
  {
    ...REPORT_SEASON_ROUTE,
    component: gated(() => import('./pages/SeasonReportPage.vue'), 'ReportsSeasonRoute'),
    meta: { scope: 'S2' },
  },
  {
    ...REPORT_MEETING_ROUTE,
    component: gated(() => import('./pages/MeetingReportPage.vue'), 'ReportsMeetingRoute'),
    meta: { scope: 'S2' },
  },
]
