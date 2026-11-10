// Zaman çizelgesi sayfa testleri: GERÇEK API istemcisi + MSW (timeline harness'ının sunucusu ve
// istek kaydı), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı. Kardeş
// bileşenler (W92 Gantt, W94 panel) GERÇEK bağlanır (taslak yok). Fikstürler örnek veridir, gerçek veri DEĞİLDİR.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { settleQueries, type HeldQuery } from '@/shared/http/__tests__/settle'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import type { Gantt, GanttTask } from '../../../model/types'
import { gantt, ganttTask, http, json, ORIGIN } from '../../../__tests__/harness'

export const ADMIN_GANTT = '/v1/work-items/gantt/admin'
export const COORD_GANTT = '/v1/work-items/gantt'
export const MEMBER_GANTT = '/v1/work-items/gantt/mine'

export const DEPARTMENTS = [
  { department_id: 'd1', display_name: 'Mekanik', code: 'MEK' },
  { department_id: 'd2', display_name: 'İdari işler' },
]

export interface StandingFixture {
  companyAdmin: boolean
  /** Ekip satırları; rol dizeleri test dosyalarında yazılır (K1 lint). */
  rows: { department_id: string; role: string }[]
}

export const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }

/** Standing (S1) + program departmanları (S2) uçları. */
export function standingHandlers(fixture: StandingFixture, year: number | null = 2026) {
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: 'acc-1',
        company_admin: fixture.companyAdmin,
        email: 'kisi@example.test',
        full_name: 'Deneme Kişi',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: fixture.rows.map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program Bir',
          display_name: DEPARTMENTS.find((d) => d.department_id === r.department_id)!.display_name,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program Bir', ...(year ? { year } : {}) }] }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: DEPARTMENTS })),
  ]
}

/** Gantt ucu: verilen yol için sabit yanıt; `truncated` ise `X-Result-Truncated: true` (BE-019). */
export function ganttHandler(path: string, body: Gantt, truncated = false) {
  return http.get(`${ORIGIN}${path}`, () =>
    json(body, 200, truncated ? { 'X-Result-Truncated': 'true' } : {}),
  )
}

/** `n` görevli Gantt (sıra numarasıyla kimlik). */
export function manyTasks(n: number, over: Partial<GanttTask> = {}): Gantt {
  return gantt({
    tasks: Array.from({ length: n }, (_, i) =>
      ganttTask({ work_item_id: `w${i}`, title: `Görev ${i}`, department_id: 'd1', ...over }),
    ),
  })
}

const mounted: VueWrapper[] = []
const clients: QueryClient[] = []

export interface PageContext {
  wrapper: VueWrapper
  router: Router
  store: ReturnType<typeof useScopeStore>
  queryClient: QueryClient
}

/** Sayfayı `path` üzerinde, `selection` kapsamıyla bağlar ve ilk okumaları bekler. */
export async function mountPage(
  page: Component,
  selection: ScopeSelection,
  path = '/zaman-cizelgesi',
  held?: HeldQuery,
): Promise<PageContext> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/zaman-cizelgesi', name: 'work.timeline', component: empty },
    ],
  })
  await router.push(path)
  const wrapper = mount(page, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], router],
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  clients.push(queryClient)
  await settle(held)
  return { wrapper, router, store, queryClient }
}

export function settle(held?: HeldQuery): Promise<void> {
  return settleQueries(clients, { held })
}

export function unmountPages(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  clients.length = 0
  document.body.innerHTML = ''
}
