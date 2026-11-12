// 12 Silinen kayıtlar test düzeneği: GERÇEK API istemcisi (`@/shared/http`) + MSW durumlu sahte
// backend (silinen listeleri + yaşam döngüsü uçları; yetkili görünürlükle süzmeden döndüren
// sunucu), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı. Oturum deposu test
// dosyasında taklit edilir (`useStanding` yalnız oturum açıkken okur). Örnek veri gerçek değildir.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent, h } from 'vue'

import { ConfirmHost } from '@/shared/ui/confirm'

import type { Meeting } from '@/modules/meetings/public'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'

import type { DeletedAccount, DeletedDepartment, DeletedWorkItem } from '../model/types'
import DeletedRecordsPage from '../pages/DeletedRecordsPage.vue'

export const ORIGIN = 'http://localhost'
export const PATHS = {
  tasks: '/v1/admin/deleted/work-items',
  meetings: '/v1/meetings/deleted',
  departments: '/v1/admin/deleted/departments',
  accounts: '/v1/admin/deleted/accounts',
  dictionary: '/v1/program/departments',
  dashboard: '/v1/reports/dashboard',
} as const

export interface Recorded {
  method: string
  path: string
  query: URLSearchParams
  headers: Headers
}

export const server = setupServer()
export const requests: Recorded[] = []

server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url)
  requests.push({
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    headers: new Headers(request.headers),
  })
})

export const sent = (path: string, method = 'GET') =>
  requests.filter((r) => r.path === path && r.method === method)

// --- Sahte backend durumu ----------------------------------------------------------------

export interface World {
  admin: boolean
  /** Sayfalar (imleç = sonraki sayfa dizini). */
  tasks: DeletedWorkItem[][]
  meetings: Meeting[][]
  departments: DeletedDepartment[][]
  accounts: DeletedAccount[][]
  dictionary: Array<{ department_id: string; display_name: string; code?: string }>
  /** `METHOD /yol` → zorunlu hata. */
  failures: Map<string, { status: number; code: string }>
}

export const world: World = {
  admin: true,
  tasks: [],
  meetings: [],
  departments: [],
  accounts: [],
  dictionary: [],
  failures: new Map(),
}

export function resetWorld(): void {
  Object.assign(world, {
    admin: true,
    tasks: [],
    meetings: [],
    departments: [],
    accounts: [],
    dictionary: [],
  })
  world.failures.clear()
}

export const json = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status })

export const errorEnvelope = (code: string, status: number) =>
  HttpResponse.json(
    { code, message: 'sunucu iletisi', request_id: 'req-9', fields: [] },
    { status },
  )

function failure(method: string, path: string) {
  const forced = world.failures.get(`${method} ${path}`)
  return forced ? errorEnvelope(forced.code, forced.status) : null
}

function page<T>(pages: T[][], request: Request, key: string, endEmpty = false) {
  const cursor = new URL(request.url).searchParams.get('cursor')
  const index = cursor ? Number(cursor) : 0
  const next = index + 1 < pages.length ? String(index + 1) : endEmpty ? '' : undefined
  return { [key]: pages[index] ?? [], ...(next !== undefined ? { next_cursor: next } : {}) }
}

/** Kaydı ilgili listeden düşürür (geri yükleme / kalıcı silme sonrası liste yeniden okunur). */
function drop<T>(pages: T[][], matches: (item: T) => boolean): void {
  for (let i = 0; i < pages.length; i += 1) pages[i] = pages[i]!.filter((item) => !matches(item))
}

const FORBIDDEN = (code: string) => errorEnvelope(code, 403)

/** Silinen liste uçları (yetkili görünürlük: yönetici değilse 403). */
function listHandlers() {
  const list = (path: string, code: string, answer: (request: Request) => JsonBodyType) =>
    http.get(`${ORIGIN}${path}`, ({ request }) =>
      world.admin ? json(answer(request)) : FORBIDDEN(code),
    )
  return [
    list(PATHS.tasks, 'work.not_authorized', (r) => page(world.tasks, r, 'items')),
    list(PATHS.meetings, 'collaboration.not_authorized', (r) =>
      page(world.meetings, r, 'items', true),
    ),
    list(PATHS.departments, 'organization.not_authorized', (r) =>
      page(world.departments, r, 'departments'),
    ),
    list(PATHS.accounts, 'organization.not_authorized', (r) => page(world.accounts, r, 'accounts')),
    http.get(`${ORIGIN}${PATHS.dictionary}`, () => json({ departments: world.dictionary })),
  ]
}

interface LifecycleSpec {
  segment: string
  code: string
  idField: string
  purgeExtra?: JsonBodyType
  remove: (id: string) => void
}

const LIFECYCLES: LifecycleSpec[] = [
  {
    segment: 'work-items',
    code: 'work.not_authorized',
    idField: 'work_item_id',
    purgeExtra: { files_deleted: 2 },
    remove: (id) => drop(world.tasks, (t) => t.work_item_id === id),
  },
  {
    segment: 'meetings',
    code: 'collaboration.not_authorized',
    idField: 'meeting_id',
    remove: (id) => drop(world.meetings, (m) => m.meeting_id === id),
  },
  {
    segment: 'departments',
    code: 'organization.not_authorized',
    idField: 'department_id',
    remove: (id) => drop(world.departments, (d) => d.department_id === id),
  },
  {
    segment: 'accounts',
    code: 'organization.not_authorized',
    idField: 'account_id',
    remove: (id) => drop(world.accounts, (a) => a.account_id === id),
  },
]

/** Geri yükle / kalıcı sil uçları: kaydı listeden düşürür, zorunlu hata tablosuna uyar. */
function lifecycleHandlers() {
  return LIFECYCLES.flatMap((spec) =>
    (
      [
        ['patch', `/v1/admin/restore/${spec.segment}/:id`, 'restored', undefined],
        ['delete', `/v1/admin/permanent/${spec.segment}/:id`, 'purged', spec.purgeExtra],
      ] as const
    ).map(([method, path, status, extra]) =>
      http[method](`${ORIGIN}${path}`, ({ params }) => {
        const id = String(params.id)
        const forced = failure(method.toUpperCase(), path.replace(':id', id))
        if (forced) return forced
        if (!world.admin) return FORBIDDEN(spec.code)
        spec.remove(id)
        return json({ [spec.idField]: id, status, ...(extra as object | undefined) })
      }),
    ),
  )
}

export function backendHandlers() {
  return [...listHandlers(), ...lifecycleHandlers()]
}

export function standingHandlers(options: {
  companyAdmin: boolean
  rows?: { department_id: string; role: string }[]
}) {
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: 'acc-1',
        company_admin: options.companyAdmin,
        email: 'kisi@example.test',
        full_name: 'Ayşe Nur Yılmaz',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: (options.rows ?? []).map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program Bir',
          display_name: `Birim ${r.department_id}`,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program Bir', year: 2026 }] }),
    ),
  ]
}

// --- Fikstürler ---------------------------------------------------------------------------

export const task = (id: string, over: Partial<DeletedWorkItem> = {}): DeletedWorkItem => ({
  work_item_id: id,
  title: `Görev ${id}`,
  department_id: 'd1',
  status: 'devam_ediyor',
  deleted_at: '2026-11-12T10:42:00Z',
  file_count: 0,
  ...over,
})

export const meeting = (id: string, over: Partial<Meeting> = {}): Meeting => ({
  meeting_id: id,
  program_id: 'p1',
  title: `Toplantı ${id}`,
  meeting_date: '2026-10-24T07:00:00Z',
  created_at: '2026-10-01T07:00:00Z',
  updated_at: '2026-10-01T07:00:00Z',
  created_by_account_id: 'acc-9',
  created_by_role: 'admin',
  invite_mode: 'coordinatorship',
  members_included: false,
  owner_department_id: 'd1',
  departments: [{ department_id: 'd1', department_name: 'Mekanik' }],
  place: null,
  deleted_at: '2026-11-12T09:00:00Z',
  deleted_by: { account_id: 'acc-7', full_name: 'Reha Koçak' },
  ...over,
})

export const department = (
  id: string,
  over: Partial<DeletedDepartment> = {},
): DeletedDepartment => ({
  department_id: id,
  name: `Birim ${id}`,
  kind: 'koordinatorluk',
  code: id.toUpperCase(),
  deleted_at: '2026-11-11T08:00:00Z',
  ...over,
})

export const account = (id: string, over: Partial<DeletedAccount> = {}): DeletedAccount => ({
  account_id: id,
  full_name: `Kişi ${id}`,
  ...over,
})

// --- Bağlama ------------------------------------------------------------------------------

const mounted: VueWrapper[] = []
const clients: QueryClient[] = []

export interface Mounted {
  wrapper: VueWrapper
  router: Router
  queryClient: QueryClient
  store: ReturnType<typeof useScopeStore>
}

export interface MountOptions {
  path?: string
  /** Onay penceresi yuvası (`ConfirmHost`) sayfayla birlikte bağlanır (odak testleri). */
  host?: boolean
  /** Seçili kapsam; verilmezse Admin merceği, program p1. */
  scope?: {
    programId: string
    lens: 'admin' | 'coordinator' | 'member'
    departmentId: string | null
  }
}

export async function mountPage(options: MountOptions = {}): Promise<Mounted> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(options.scope ?? { programId: 'p1', lens: 'admin', departmentId: null })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/silinen-kayitlar', name: 'deleted-records.list', component: DeletedRecordsPage },
    ],
  })
  await router.push(options.path ?? '/silinen-kayitlar')
  const root = options.host
    ? defineComponent({ render: () => h('div', [h(DeletedRecordsPage), h(ConfirmHost)]) })
    : DeletedRecordsPage
  const app = mount(root, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
    attachTo: document.body,
  })
  mounted.push(app)
  clients.push(queryClient)
  await settle()
  return { wrapper: app, router, queryClient, store }
}

export function settle(): Promise<void> {
  return settleQueries(clients)
}

export async function flush(): Promise<void> {
  await flushPromises()
}

export function resetAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  clients.length = 0
  requests.length = 0
  resetWorld()
  server.resetHandlers(...serverDefaults())
  document.body.innerHTML = ''
}

export function serverDefaults() {
  return [...standingHandlers({ companyAdmin: true }), ...backendHandlers()]
}
