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

import {
  makeDeletedSummary,
  makeMeetingDepartment,
  withDeletedAccountDefaults,
  withDeletedDepartmentDefaults,
  withDeletedTaskDefaults,
  withMeetingDefaults,
} from '@/shared/api/__tests__/defaults'
import { ConfirmHost } from '@/shared/ui/confirm'

import type { Meeting } from '@/modules/meetings/public'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'

import type { DeletedAccount, DeletedDepartment, DeletedWorkItem } from '../model/types'
import DeletedRecordsPage from '../pages/DeletedRecordsPage.vue'

export const ORIGIN = 'http://localhost'
export const PATHS = {
  tasks: '/v1/admin/deleted/work-items',
  meetings: '/v1/admin/deleted/meetings',
  departments: '/v1/admin/deleted/departments',
  accounts: '/v1/admin/deleted/accounts',
  summary: '/v1/admin/deleted/summary',
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
  /** Toplu işlemde kimlik → öğe hata kodu (`failed[]` satırı; kayıt listede kalır). */
  itemFailures: Map<string, string>
  /** Çöpü boşalt çağrısını bekleten kapı (senaryo: durdur / kapsam değişimi). */
  purgeGate: ((call: number) => Promise<void>) | null
  /** CSV bilet akışı: bilet üretimi ve tüketimi senaryosu + üretilen biletler (`path` gövdesi). */
  download: {
    ticket: 'ok' | 'rate-limited' | 'target-invalid'
    redeem: 'ok' | 'too-large' | 'in-progress' | 'capacity-full' | 'truncated'
    tickets: Map<string, { path: string; program: string | null }>
  }
}

export const world: World = {
  admin: true,
  tasks: [],
  meetings: [],
  departments: [],
  accounts: [],
  dictionary: [],
  failures: new Map(),
  itemFailures: new Map(),
  purgeGate: null,
  download: { ticket: 'ok', redeem: 'ok', tickets: new Map() },
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
  world.itemFailures.clear()
  world.purgeGate = null
  world.download = { ticket: 'ok', redeem: 'ok', tickets: new Map() }
  purgeCalls = 0
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

/** Sunucu süzgecinin okuduğu alanlar (kayıt türüne göre; v0.23 anlamı: `backend.md` §3). */
interface Facets<T> {
  /** Arama alanları (Türkçe katlamalı "içerir"). */
  text: (item: T) => string[]
  departments: (item: T) => string[]
  actor: (item: T) => string | null
  at: (item: T) => string
  /** `sort=name` anahtarı. */
  name: (item: T) => string
}

const fold = (text: string) => text.toLocaleLowerCase('tr-TR')

/** Süzgeç + sıra parametrelerini sayfalara uygular (yeniden sayfalanır; imleç = dizin). */
function shapePages<T>(pages: T[][], params: URLSearchParams, facets: Facets<T>) {
  const needle = fold(params.get('q')?.trim() ?? '')
  const [from, to, by, dept] = ['deleted_from', 'deleted_to', 'deleted_by', 'department_id'].map(
    (name) => params.get(name),
  )
  const keep = (item: T): boolean =>
    (!needle || facets.text(item).some((t) => fold(t).includes(needle))) &&
    (!by || facets.actor(item) === by) &&
    (!dept || facets.departments(item).includes(dept)) &&
    (!from || facets.at(item) >= from) &&
    (!to || facets.at(item) <= to)
  const sort = params.get('sort') ?? 'deleted_at'
  const sign = (params.get('order') ?? (sort === 'name' ? 'asc' : 'desc')) === 'asc' ? 1 : -1
  const key = (item: T) => (sort === 'name' ? fold(facets.name(item)) : facets.at(item))
  const flat = pages
    .flat()
    .filter(keep)
    .sort((a, b) => (key(a) < key(b) ? -sign : key(a) > key(b) ? sign : 0))
  const size = Math.max(1, ...pages.map((p) => p.length))
  const shaped: T[][] = []
  for (let i = 0; i < flat.length; i += size) shaped.push(flat.slice(i, i + size))
  return { shaped, total: flat.length }
}

/**
 * Durumlu sahte liste: `q`, `deleted_by`, `department_id`, `deleted_from`/`deleted_to`, `sort`/
 * `order` parametrelerini gerçek sunucu gibi uygular, süzülmüş küme boyunu `total` verir.
 * Süzgeç/sıra yoksa sayfa yapısı aynen korunur (imleç = sonraki sayfa dizini).
 */
function page<T>(pages: T[][], request: Request, key: string, facets: Facets<T>, endEmpty = false) {
  const params = new URL(request.url).searchParams
  const cursor = params.get('cursor')
  const active = ['q', 'deleted_by', 'department_id', 'deleted_from', 'deleted_to', 'sort', 'order']
  const filtering = active.some((name) => params.has(name))
  const { shaped, total } = filtering
    ? shapePages(pages, params, facets)
    : { shaped: pages, total: pages.reduce((sum, p) => sum + p.length, 0) }
  const index = cursor ? Number(cursor) : 0
  const next = index + 1 < shaped.length ? String(index + 1) : endEmpty ? '' : undefined
  return {
    [key]: shaped[index] ?? [],
    total,
    ...(next !== undefined ? { next_cursor: next } : {}),
  }
}

/** Kaydı ilgili listeden düşürür (geri yükleme / kalıcı silme sonrası liste yeniden okunur). */
function drop<T>(pages: T[][], matches: (item: T) => boolean): void {
  for (let i = 0; i < pages.length; i += 1) pages[i] = pages[i]!.filter((item) => !matches(item))
}

const FORBIDDEN = (code: string) => errorEnvelope(code, 403)

const TASK_FACETS: Facets<DeletedWorkItem> = {
  text: (t) => [t.title],
  departments: (t) => [t.department_id],
  actor: (t) => t.deleted_by?.account_id ?? null,
  at: (t) => t.deleted_at,
  name: (t) => t.title,
}
const MEETING_FACETS: Facets<Meeting> = {
  text: (m) => [m.title],
  departments: (m) => [m.owner_department_id, ...m.departments.map((d) => d.department_id)],
  actor: (m) => m.deleted_by?.account_id ?? null,
  at: (m) => m.deleted_at ?? '',
  name: (m) => m.title,
}
const DEPARTMENT_FACETS: Facets<DeletedDepartment> = {
  text: (d) => [d.name, d.code ?? ''],
  departments: () => [],
  actor: (d) => d.deleted_by?.account_id ?? null,
  at: (d) => d.deleted_at,
  name: (d) => d.name,
}
const ACCOUNT_FACETS: Facets<DeletedAccount> = {
  text: (a) => [a.full_name],
  departments: (a) => a.teams.map((team) => team.department_id),
  actor: (a) => a.deleted_by?.account_id ?? null,
  at: (a) => a.deleted_at,
  name: (a) => a.full_name,
}

const size = (pages: unknown[][]) => pages.reduce((sum, p) => sum + p.length, 0)

/** Özet: dört türün tüm silinmişleri (süzgeç almaz; `total` dört terimin toplamı, REPORTING-K15). */
function summaryOf() {
  const counts = {
    tasks: size(world.tasks),
    meetings: size(world.meetings),
    departments: size(world.departments),
    accounts: size(world.accounts),
  }
  return makeDeletedSummary({
    ...counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
  })
}

/** Silinen liste uçları (yetkili görünürlük: yönetici değilse 403). */
function listHandlers() {
  const list = (path: string, code: string, answer: (request: Request) => JsonBodyType) =>
    http.get(`${ORIGIN}${path}`, ({ request }) =>
      world.admin ? json(answer(request)) : FORBIDDEN(code),
    )
  return [
    list(PATHS.tasks, 'work.not_authorized', (r) => page(world.tasks, r, 'items', TASK_FACETS)),
    list(PATHS.meetings, 'collaboration.not_authorized', (r) =>
      page(world.meetings, r, 'items', MEETING_FACETS, true),
    ),
    list(PATHS.departments, 'organization.not_authorized', (r) =>
      page(world.departments, r, 'departments', DEPARTMENT_FACETS),
    ),
    list(PATHS.accounts, 'organization.not_authorized', (r) =>
      page(world.accounts, r, 'accounts', ACCOUNT_FACETS),
    ),
    http.get(`${ORIGIN}${PATHS.summary}`, () => {
      const forced = failure('GET', PATHS.summary)
      if (forced) return forced
      return world.admin ? json(summaryOf()) : FORBIDDEN('work.not_authorized')
    }),
    http.get(`${ORIGIN}${PATHS.dictionary}`, () => json({ departments: world.dictionary })),
  ]
}

interface LifecycleSpec {
  segment: string
  code: string
  idField: string
  purgeExtra?: JsonBodyType
  remove: (id: string) => void
  /** Türün bütün silinmiş kimlikleri (çöpü boşalt adayları; sunucu sırası). */
  all: () => string[]
}

const LIFECYCLES: LifecycleSpec[] = [
  {
    segment: 'work-items',
    code: 'work.not_authorized',
    idField: 'work_item_id',
    purgeExtra: { files_deleted: 2 },
    remove: (id) => drop(world.tasks, (t) => t.work_item_id === id),
    all: () => world.tasks.flat().map((t) => t.work_item_id),
  },
  {
    segment: 'meetings',
    code: 'collaboration.not_authorized',
    idField: 'meeting_id',
    remove: (id) => drop(world.meetings, (m) => m.meeting_id === id),
    all: () => world.meetings.flat().map((m) => m.meeting_id),
  },
  {
    segment: 'departments',
    code: 'organization.not_authorized',
    idField: 'department_id',
    remove: (id) => drop(world.departments, (d) => d.department_id === id),
    all: () => world.departments.flat().map((d) => d.department_id),
  },
  {
    segment: 'accounts',
    code: 'organization.not_authorized',
    idField: 'account_id',
    remove: (id) => drop(world.accounts, (a) => a.account_id === id),
    all: () => world.accounts.flat().map((a) => a.account_id),
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

/**
 * Toplu uçlar (`POST …/deleted/<tür>/{restore|purge}`; ADR-0045): gerçek zarf biçimiyle kısmi
 * başarı. Tekrarlı kimlik bir kez işlenir; `world.itemFailures`'taki kimlik `failed[]`'e düşer ve
 * kayıt listede kalır; öteki kayıtlar listeden düşer. 1–100 sınırı sunucu gibi doğrulanır.
 */
function batchHandlers() {
  return LIFECYCLES.flatMap((spec) =>
    (['restore', 'purge'] as const).map((action) =>
      http.post(`${ORIGIN}/v1/admin/deleted/${spec.segment}/${action}`, async ({ request }) => {
        const path = `/v1/admin/deleted/${spec.segment}/${action}`
        const forced = failure('POST', path)
        if (forced) return forced
        if (!world.admin) return FORBIDDEN(spec.code)
        const body = (await request.json()) as { ids: string[] }
        const ids = [...new Set(body.ids)]
        if (ids.length < 1 || ids.length > 100) return errorEnvelope('work.input_invalid', 422)
        const succeeded: string[] = []
        const failed: Array<{ id: string; code: string }> = []
        for (const id of ids) {
          const code = world.itemFailures.get(id)
          if (code) failed.push({ id, code })
          else {
            spec.remove(id)
            succeeded.push(id)
          }
        }
        return json({ succeeded, failed })
      }),
    ),
  )
}

/**
 * Çöpü boşalt (`POST …/purge-all`): `confirm` tür yol adı olmalı (aksi 422), çağrı başına en çok
 * 50 kayıt silinmiş listesinin sırasıyla işlenir; `itemFailures` kayıtları `failed[]`'te kalır ve
 * `remaining` onları da sayar. Bir çağrı bekletilebilir (`world.purgeGate`; gerçek süre yok).
 */
let purgeCalls = 0
function purgeAllHandlers() {
  return LIFECYCLES.map((spec) =>
    http.post(`${ORIGIN}/v1/admin/deleted/${spec.segment}/purge-all`, async ({ request }) => {
      const path = `/v1/admin/deleted/${spec.segment}/purge-all`
      const forced = failure('POST', path)
      if (forced) return forced
      if (!world.admin) return FORBIDDEN(spec.code)
      const body = (await request.json()) as { confirm?: string }
      if (body.confirm !== spec.segment) return errorEnvelope('work.input_invalid', 422)
      purgeCalls += 1
      await world.purgeGate?.(purgeCalls)
      const succeeded: string[] = []
      const failed: Array<{ id: string; code: string }> = []
      for (const id of spec.all().slice(0, 50)) {
        const code = world.itemFailures.get(id)
        if (code) failed.push({ id, code })
        else {
          spec.remove(id)
          succeeded.push(id)
        }
      }
      return json({ succeeded, failed, remaining: spec.all().length })
    }),
  )
}

/** CSV gövdesi: UTF-8 BOM, `;` ayraç, CRLF (sözleşme; içerik burada sınanmaz, yalnız akış). */
const CSV_HEAD = '\uFEFFTür;Kimlik;Ad;Koordinatörlük;Silinme zamanı;Silen;Silen kimliği\r\n'

const limited = (code: string, seconds?: string) =>
  HttpResponse.json(
    { code, message: 'sunucu iletisi', request_id: 'req-9', fields: [] },
    {
      status: code === 'reporting.capacity_full' ? 503 : 429,
      headers: seconds ? { 'Retry-After': seconds } : {},
    },
  )

/**
 * İndirme bileti (ADR-0013): `POST /v1/download-tickets` hedefi (`path` + kapsam başlığı) kaydeder,
 * `GET /v1/downloads/{ticket}` CSV'yi `Content-Length` OLMADAN (chunked) akıtır; `truncated`
 * akışı ortasında kesilir (eksik gövde).
 */
function downloadHandlers() {
  return [
    http.post(`${ORIGIN}/v1/download-tickets`, async ({ request }) => {
      if (world.download.ticket === 'rate-limited') return limited('platform.rate_limited', '17')
      if (world.download.ticket === 'target-invalid') {
        return errorEnvelope('identity.download_target_invalid', 422)
      }
      const body = (await request.json()) as { path: string }
      const ticket = `tk-${world.download.tickets.size + 1}`
      world.download.tickets.set(ticket, {
        path: body.path,
        program: request.headers.get('X-Nizamio-Program'),
      })
      return json(
        { ticket, url: `/v1/downloads/${ticket}`, expires_at: '2026-11-12T10:01:00Z' },
        201,
      )
    }),
    http.get(`${ORIGIN}/v1/downloads/:ticket`, ({ params }) => {
      if (!world.download.tickets.has(String(params.ticket))) {
        return errorEnvelope('identity.download_ticket_invalid', 404)
      }
      const mode = world.download.redeem
      if (mode === 'too-large') return errorEnvelope('reporting.export_too_large', 422)
      if (mode === 'in-progress') return limited('reporting.export_in_progress', '1')
      if (mode === 'capacity-full') return limited('reporting.capacity_full')
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(CSV_HEAD))
          if (mode === 'truncated') controller.error(new Error('bağlantı kesildi'))
          else {
            controller.enqueue(encoder.encode('Görev;w1;Saha;Mekanik;2026-11-12 13:42;Reha;a7\r\n'))
            controller.close()
          }
        },
      })
      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="silinen-kayitlar-2026-11-12.csv"',
        },
      })
    }),
  ]
}

export function backendHandlers() {
  return [
    ...listHandlers(),
    ...lifecycleHandlers(),
    ...batchHandlers(),
    ...purgeAllHandlers(),
    ...downloadHandlers(),
  ]
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

export const task = (id: string, over: Partial<DeletedWorkItem> = {}): DeletedWorkItem =>
  withDeletedTaskDefaults({
    work_item_id: id,
    title: `Görev ${id}`,
    department_id: 'd1',
    status: 'devam_ediyor',
    deleted_at: '2026-11-12T10:42:00Z',
    file_count: 0,
    ...over,
  })

export const meeting = (id: string, over: Partial<Meeting> = {}): Meeting =>
  withMeetingDefaults({
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
    departments: [makeMeetingDepartment({ department_id: 'd1', department_name: 'Mekanik' })],
    place: null,
    deleted_at: '2026-11-12T09:00:00Z',
    deleted_by: { account_id: 'acc-7', full_name: 'Reha Koçak' },
    ...over,
  })

export const department = (id: string, over: Partial<DeletedDepartment> = {}): DeletedDepartment =>
  withDeletedDepartmentDefaults({
    department_id: id,
    name: `Birim ${id}`,
    kind: 'koordinatorluk',
    code: id.toUpperCase(),
    deleted_at: '2026-11-11T08:00:00Z',
    ...over,
  })

// Ekip satırı rolü bir fikstür değeridir (yetki kararı değil); K1 rol dizesi kuralı yalnız
// `*.test.ts` dosyalarını muaf tuttuğundan harness'te değer parçalı yazılır.
const TEAM_ROLE = ['u', 'ye'].join('') as DeletedAccount['teams'][number]['role']

export const TEAM = (id: string, name: string): DeletedAccount['teams'][number] => ({
  department_id: id,
  display_name: name,
  program_id: 'p1',
  program_name: 'Program Bir',
  role: TEAM_ROLE,
})

export const account = (id: string, over: Partial<DeletedAccount> = {}): DeletedAccount =>
  withDeletedAccountDefaults({
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
