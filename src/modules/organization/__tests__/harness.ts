// Organizasyon modülü testleri: GERÇEK API istemcisi (`@/shared/http` `api`) + MSW sahte backend,
// gerçek Pinia kapsam deposu ve TanStack Query bağlamı. İstekler kaydedilir (başlık / sorgu /
// gövde denetimi, istek sayımı). Kalıp work modülünün harness'iyle aynıdır (modül sınırı gereği
// ayrı dosya).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, type App } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'
import { useConfirm } from '@/shared/ui/confirm'

import { isCompanyAdmin, serverRoleOf, userRoleFilterOf } from '../model/capabilities'

export const ORIGIN = 'http://localhost'

export interface Recorded {
  method: string
  path: string
  query: URLSearchParams
  headers: Headers
  body: unknown
}

export const server = setupServer()
export const requests: Recorded[] = []

server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url)
  const clone = request.clone()
  const entry: Recorded = {
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    headers: new Headers(request.headers),
    body: undefined,
  }
  requests.push(entry)
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    void clone.json().then((b: unknown) => (entry.body = b))
  }
})

export function sent(method: string, path: string): Recorded[] {
  return requests.filter((r) => r.method === method && r.path === path)
}

export function json(body: JsonBodyType, status = 200, headers: Record<string, string> = {}) {
  return HttpResponse.json(body, { status, headers })
}

export function errorEnvelope(code: string, status: number, fields: unknown[] = []) {
  return HttpResponse.json(
    { code, message: 'sunucu iletisi', request_id: 'req-1', fields },
    { status },
  )
}

export { http, HttpResponse }

/** JSON gövdesinde anahtar var ve doğru-sayılır değerde mi (tip literali yazmadan). */
export function bodyHas(body: unknown, key: string): boolean {
  return (
    typeof body === 'object' && body !== null && Boolean((body as Record<string, unknown>)[key])
  )
}

const apps: App[] = []

/** Pinia + kapsam + QueryClient; `run` composable'ı bir bileşen bağlamında koşturur. */
export function harness(selection: ScopeSelection) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0, retry: false }, mutations: { retry: false } },
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)

  function mount<T>(fn: () => T): { result: T; app: App } {
    let result: T | undefined
    const app = createApp(
      defineComponent({
        setup() {
          result = fn()
          return () => null
        },
      }),
    )
    app.use(pinia)
    app.use(VueQueryPlugin, { queryClient })
    app.mount(document.createElement('div'))
    apps.push(app)
    return { result: result as T, app }
  }

  function run<T>(fn: () => T): T {
    return mount(fn).result
  }

  /** Onay kuyruğu (kabuk `ConfirmHost` yerine): bekleyen onayı kabul / vazgeç. */
  const confirmQueue = run(() => useConfirm())

  return { queryClient, store, run, mount, flush: flushPromises, confirmQueue }
}

export function resetHarness(): void {
  for (const app of apps.splice(0)) app.unmount()
  requests.length = 0
  server.resetHandlers()
}

// --- Fikstürler ---------------------------------------------------------------------------

export const ADMIN_SCOPE: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }
export const COORD_LENS_SCOPE: ScopeSelection = {
  programId: 'p1',
  lens: 'coordinator',
  departmentId: 'd1',
}

export function rosterMember(id: string, name: string, role: string, status = 'active') {
  return { account_id: id, full_name: name, membership_id: `m-${id}`, role, status }
}

/** v0.14 `KnownUser` (e-posta, yönetici, hesap/kilit durumu, yapısal ekipler). */
export function knownUser(
  id: string,
  name: string,
  memberships: string[] | null = [],
  extra: Partial<{
    email: string
    company_admin: boolean
    account_status: 'active' | 'disabled'
    login_locked: boolean
  }> = {},
) {
  const teams = (memberships ?? []).map((label) => {
    const [program_id = '', department_id = '', role = ''] = label.split(':')
    return {
      program_id,
      program_name: program_id,
      department_id,
      display_name: department_id,
      role,
    }
  })
  return {
    account_id: id,
    full_name: name,
    email: `${id}@ornek.test`,
    company_admin: false,
    account_status: 'active' as const,
    login_locked: false,
    memberships,
    teams,
    ...extra,
  }
}

type FakeUser = ReturnType<typeof knownUser>

const ADMIN_FILTER = userRoleFilterOf('admin')
const COORDINATOR = serverRoleOf('coordinator')
const MEMBER = serverRoleOf('member')

const foldText = (text: string) => text.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').trim()

/**
 * Sözleşmeye sadık `listUsers` (v0.14): `search` (ad ya da e-posta), `role` (`company_admin` /
 * herhangi bir programda `koordinatorluk`…; program/departman verilirse o kapsamda),
 * `program_id` / `department_id`, imleç (`next_cursor` = başlangıç sırası), `total` ve
 * `role_counts` (rol hariç süzgeçlerle). Süzgeçsiz liste bütün hesaplardır (BE-045).
 */
export function userListHandler(users: readonly FakeUser[], options: { pageSize?: number } = {}) {
  return http.get(`${ORIGIN}/v1/admin/users`, ({ request }) => {
    const q = new URL(request.url).searchParams
    const programId = q.get('program_id')
    const departmentId = q.get('department_id')
    const needle = foldText(q.get('search') ?? '')
    const rolesOf = (u: FakeUser) =>
      (u.teams ?? [])
        .filter(
          (t) =>
            (!programId || t.program_id === programId) &&
            (!departmentId || t.department_id === departmentId),
        )
        .map((t) => t.role)
    const base = users.filter(
      (u) =>
        (!programId && !departmentId ? true : rolesOf(u).length > 0) &&
        (needle === '' || foldText(u.full_name).includes(needle) || u.email.includes(needle)),
    )
    const hasRole = (u: FakeUser, role: string) => rolesOf(u).includes(role)
    const wanted = q.get('role')
    const filtered = !wanted
      ? base
      : base.filter((u) => (wanted === ADMIN_FILTER ? isCompanyAdmin(u) : hasRole(u, wanted)))
    const start = Number(q.get('cursor') ?? 0)
    const size = options.pageSize ?? 200
    const page = filtered.slice(start, start + size)
    const next = start + size < filtered.length ? String(start + size) : undefined
    return json({
      users: page,
      ...(next ? { next_cursor: next } : {}),
      total: filtered.length,
      role_counts: {
        all: base.length,
        company_admin: base.filter((u) => isCompanyAdmin(u)).length,
        koordinator: base.filter((u) => hasRole(u, COORDINATOR)).length,
        uye: base.filter((u) => hasRole(u, MEMBER)).length,
      },
    })
  })
}

export const MEMBERSHIP_CHANGE = { membership_id: 'm-1', unassigned_tasks: 0, warning: false }

/** `confirmation_required` zarfı (görev başlıkları `fields[]`'te; ORGANIZATION-K17). */
export function confirmationRequired(titles: string[]) {
  return errorEnvelope(
    'organization.confirmation_required',
    409,
    titles.map((title) => ({
      field: 'work_item',
      code: 'organization.task_title',
      message: title,
    })),
  )
}
