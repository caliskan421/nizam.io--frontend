/**
 * Program modülünün rota tarafı ("Teknofest ve sezon", E-00-25). Yol, ad, kapsam SPESİFİKASYONU
 * rota kataloğundadır (`app/routes.catalog.ts`, K10); burada sayfa kaydı durur. Rota S1'dir
 * (program uçları kapsamsız); seçili programa bağlı bölümler (departmanlar, aktarım kaynağı)
 * sayfa içinde kapsam hazırken çizilir. Kapı `company_admin` olgusu (P1; `routing/ProgramGate`).
 */
import { defineComponent, h } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import ProgramGate from './routing/ProgramGate.vue'

/** Katalog adı ve yolu (katalogla aynı olmak zorunda; router uyuşmazlığı reddeder). */
export const PROGRAMS_ROUTE = { name: 'program.programs', path: '/programlar' } as const

export const programRoutes: RouteRecordRaw[] = [
  {
    path: PROGRAMS_ROUTE.path,
    name: PROGRAMS_ROUTE.name,
    component: () =>
      import('./pages/ProgramsPage.vue').then(({ default: page }) =>
        defineComponent({
          name: 'ProgramProgramsRoute',
          setup: () => () => h(ProgramGate, null, { default: () => h(page) }),
        }),
      ),
    meta: { scope: 'S1' },
  },
]
