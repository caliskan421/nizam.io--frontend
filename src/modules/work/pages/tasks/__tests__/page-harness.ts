// Görev listesi sayfa testleri: GERÇEK API istemcisi + MSW (görev harness'ının sunucusu ve
// istek kaydı), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı. O2b kardeş
// bileşenleri (panel, yeni görev, alt görev bloğu) sözleşme adlarıyla taslaklanır.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, type Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { http, json, ORIGIN, sent } from '../../../model/__tests__/harness'
import type { WorkItem } from '../../../model/types'

export const LIST = '/v1/program/work-items'
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
export function standingHandlers(fixture: StandingFixture) {
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
      json({ programs: [{ program_id: 'p1', name: 'Program Bir', year: 2026 }] }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: DEPARTMENTS })),
  ]
}

/** Liste ucu: imleçsiz istek `first`, imleçli istek `next` sayfasını alır. */
export function listHandler(first: WorkItem[], nextCursor?: string, next: WorkItem[] = []) {
  return http.get(`${ORIGIN}${LIST}`, ({ request }) => {
    const cursor = new URL(request.url).searchParams.get('cursor')
    return cursor ? json({ items: next }) : json({ items: first, next_cursor: nextCursor })
  })
}

export const listRequests = () => sent('GET', LIST)

const stub = (name: string, props: string[], render: (p: Record<string, unknown>) => unknown) =>
  defineComponent({
    name,
    props: Object.fromEntries(props.map((p) => [p, { type: null }])),
    emits: ['close', 'created', 'update:open', 'openSubtasks'],
    setup: (p) => () => render(p),
  })

export const STUBS = {
  WorkDetailPanel: stub('WorkDetailPanel', ['workItemId', 'initialTab'], (p) =>
    h('div', { 'data-panel': p.workItemId, 'data-tab': p.initialTab }),
  ),
  NewTaskDialog: stub('NewTaskDialog', ['open', 'departmentId'], (p) =>
    h('div', { 'data-new-task': p.open ? 'open' : 'closed', 'data-dept': p.departmentId ?? '' }),
  ),
  SubtaskBlock: stub('SubtaskBlock', ['item'], () => h('div', { 'data-subtasks': '' })),
}

const mounted: VueWrapper[] = []

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
  path = '/gorevler',
): Promise<PageContext> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
    ],
  })
  await router.push(path)
  const wrapper = mount(page, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], router],
      stubs: STUBS,
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settle()
  return { wrapper, router, store, queryClient }
}

/** Ağ + render turlarını boşaltır. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

export function unmountPages(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}
