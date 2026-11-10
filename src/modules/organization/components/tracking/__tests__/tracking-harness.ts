// 05b bileşen testleri: GERÇEK API istemcisi + MSW (organizasyon harness'ının sunucusu ve istek
// kaydı), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı. Komşu O2b bileşeni
// `UserPanel` (W75) sözleşme adıyla TASLAKLANIR (rapor: TASLAK satırı).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, type Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'
import { ConfirmHost } from '@/shared/ui/confirm'

import { http, json, knownUser, ORIGIN, sent, server } from '../../../__tests__/harness'
import { UserPanelStub } from './user-panel-stub'

export const LIST = '/v1/program/work-items'
export const USERS = '/v1/admin/users'
export const DEPARTMENTS = [
  { department_id: 'd1', display_name: 'Mekanik', code: 'MEK' },
  { department_id: 'd2', display_name: 'İdari işler' },
]
export const ADMIN_SCOPE: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }

/** Standing (yönetici ya da değil) + program departmanları. Rol dizeleri testte (K1 lint). */
export function standingHandlers(
  companyAdmin = true,
  rows: { department_id: string; role: string }[] = [],
) {
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({ account_id: 'me', company_admin: companyAdmin, email: 'k@x.test', full_name: 'Ben' }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: rows.map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program',
          display_name: r.department_id,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program', year: 2026 }] }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: DEPARTMENTS })),
  ]
}

export interface ItemPatch {
  status?: string
  end_on?: string
  is_overdue?: boolean
  days_overdue?: number
  department_id?: string
  title?: string
}

/** Sözleşmeye birebir görev satırı (`WorkItem`). */
export function workItem(id: string, assignees: [string, string | null][], patch: ItemPatch = {}) {
  return {
    work_item_id: id,
    program_id: 'p1',
    department_id: patch.department_id ?? 'd1',
    title: patch.title ?? `Görev ${id}`,
    priority: 'orta',
    status: patch.status ?? 'devam_ediyor',
    assignees: assignees.map(([account_id, full_name]) => ({ account_id, full_name })),
    assignee_account_ids: assignees.map(([a]) => a),
    start_on: '2026-11-01',
    end_on: patch.end_on ?? '2026-11-20',
    is_overdue: patch.is_overdue ?? false,
    days_overdue: patch.days_overdue ?? 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
    completion_evidence_required: false,
    subtask_counts: { total: 0, done: 0 },
    pending_date_request: null,
    created_at: '2026-11-01T08:00:00Z',
  }
}

type Item = ReturnType<typeof workItem>

/** Liste ucu: imleçsiz istek `first` (+ `next_cursor`), imleçli istek `next` (gate'i bekler). */
export function listHandler(
  first: Item[],
  next: Item[] | null = null,
  gate: Promise<void> = Promise.resolve(),
) {
  return http.get(`${ORIGIN}${LIST}`, async ({ request }) => {
    if (!new URL(request.url).searchParams.get('cursor')) {
      return json({ items: first, ...(next ? { next_cursor: 'c1' } : {}) })
    }
    await gate
    return json({ items: next ?? [] })
  })
}

/**
 * `listUsers` (`/v1/admin/users`) ve `readUser` (`/v1/admin/users/{id}`, BE-043): tek işleyici;
 * tekil okuma listede olmayan kimlik için 404 `organization.account_not_found` döner. Gövde v0.14
 * `KnownUser` şeklidir (e-posta, yönetici, hesap/kilit durumu, yapısal ekipler).
 */
export function usersHandler(
  users: { account_id: string; full_name: string; memberships: string[] | null }[],
) {
  const full = users.map((u) => knownUser(u.account_id, u.full_name, u.memberships))
  return http.get(new RegExp(`${ORIGIN}${USERS}(/[^/]+)?$`), ({ request }) => {
    const id = new URL(request.url).pathname.split('/')[4]
    if (id === undefined) return json({ users: full, total: full.length })
    const hit = full.find((u) => u.account_id === id)
    return hit
      ? json(hit)
      : json(
          { code: 'organization.account_not_found', message: 'x', request_id: 'r', fields: [] },
          404,
        )
  })
}

export const listRequests = () => sent('GET', LIST)

export { UserPanelStub }

const mounted: VueWrapper[] = []

export interface MountContext {
  wrapper: VueWrapper
  router: Router
  store: ReturnType<typeof useScopeStore>
  queryClient: QueryClient
}

export function createTestRouter(): Router {
  const empty = { render: () => null }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/kullanicilar', name: 'organization.users', component: empty },
      { path: '/kullanicilar/:accountId', name: 'organization.user', component: empty },
    ],
  })
}

/** Bileşeni `path` üzerinde bağlar (`queryClient` verilirse önbellek paylaşılır). */
export async function mountAt(
  component: Component,
  props: Record<string, unknown>,
  path = '/kullanicilar/u1',
  options: {
    selection?: ScopeSelection
    queryClient?: QueryClient
    /** Gerçek W75 `UserPanel` + onay penceresi (taslak yok). */
    realPanel?: boolean
  } = {},
): Promise<MountContext> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(options.selection ?? ADMIN_SCOPE)
  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retryDelay: 0, retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    })
  const router = createTestRouter()
  await router.push(path)
  const host = defineComponent({
    setup:
      (_, { attrs }) =>
      () => [h(component, attrs), options.realPanel ? h(ConfirmHost) : null],
  })
  const wrapper = mount(host, {
    attrs: props,
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], router],
      stubs: options.realPanel ? {} : { UserPanel: UserPanelStub },
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settle()
  return { wrapper, router, store, queryClient }
}

/** Ağ + render turlarını boşaltır. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}

export { server }
