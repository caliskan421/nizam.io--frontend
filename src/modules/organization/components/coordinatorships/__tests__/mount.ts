// 08 bileşen/sayfa testleri: GERÇEK API istemcisi + MSW (organizasyon harness'ının sunucusu ve
// istek kaydı), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı. Oturum deposu test
// dosyasında `vi.mock` ile "giriş yapılmış" yapılır (standing sorguları açılır).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, type Component, type VNode } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { http, json, ORIGIN } from '../../../__tests__/harness'
import type { CoordinatorshipStat } from '../../../model/types'

export interface StandingFixture {
  companyAdmin: boolean
  /** Ekip satırları; rol dizeleri test dosyalarında yazılır (K1 lint). */
  rows: { department_id: string; role: string }[]
  /** Program kaydının yılı (E-08-03 "‹YYYY› sezonu"); `null` → alan yok. */
  year?: number | null
}

export const ADMIN: StandingFixture = { companyAdmin: true, rows: [], year: 2026 }

/** Standing (S1) uçları: `me`, `me/departments`, `programs`. */
export function standingHandlers(fixture: StandingFixture) {
  const year = fixture.year === undefined ? 2026 : fixture.year
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
          display_name: `Birim ${r.department_id}`,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({
        programs: [{ program_id: 'p1', name: 'Program Bir', ...(year === null ? {} : { year }) }],
      }),
    ),
  ]
}

/** `reportDashboard` gövdesi (sözleşme şekli; süzmesiz). */
export function dashboard(stats: CoordinatorshipStat[], totalUsers = 12) {
  return {
    active_tasks: 0,
    completed_tasks: 0,
    coordinatorship_stats: stats,
    deleted_records: 0,
    generated_at: '2026-11-09T08:00:00Z',
    overdue_tasks: 0,
    overdue_tasks_list: [],
    pending_approvals: 0,
    pending_date_changes: 0,
    priority_distribution: {},
    program_id: 'p1',
    program_name: 'Program Bir',
    task_status_distribution: {},
    total_admins: 1,
    total_coordinators: 1,
    total_coordinatorships: stats.length,
    total_members: 3,
    total_tasks: 0,
    total_users: totalUsers,
  }
}

/**
 * Komşu W bileşeninin sözleşme adlı taslağı (TASLAK; O4 entegrasyon turu girdisi). Prop'lar
 * tipsiz kabul edilir; render yalnız gözlem öznitelikleri basar.
 */
export function stubComponent(
  name: string,
  props: string[],
  emits: string[],
  render: (p: Record<string, unknown>) => VNode,
) {
  return defineComponent({
    name,
    props: Object.fromEntries(props.map((p) => [p, { type: null }])),
    emits,
    setup: (p) => () => render(p),
  })
}

const mounted: VueWrapper[] = []

export interface MountContext {
  wrapper: VueWrapper
  router: Router
  store: ReturnType<typeof useScopeStore>
  queryClient: QueryClient
}

export const ADMIN_SELECTION: ScopeSelection = {
  programId: 'p1',
  lens: 'admin',
  departmentId: null,
}

/** Bileşeni `path` üzerinde, `selection` kapsamıyla bağlar ve ilk okumaları bekler. */
export async function mountWith(
  component: Component,
  options: {
    props?: Record<string, unknown>
    selection?: ScopeSelection
    path?: string
    stubs?: Record<string, Component>
  } = {},
): Promise<MountContext> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(options.selection ?? ADMIN_SELECTION)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/koordinatorlukler', name: 'organization.coordinatorships', component: empty },
      {
        path: '/koordinatorlukler/:departmentId',
        name: 'organization.coordinatorship',
        component: empty,
      },
    ],
  })
  await router.push(options.path ?? '/koordinatorlukler')
  const wrapper = mount(component, {
    props: options.props,
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], router],
      stubs: options.stubs ?? {},
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

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}
