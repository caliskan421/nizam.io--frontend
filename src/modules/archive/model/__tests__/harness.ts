// Arşiv veri katmanı testleri: GERÇEK API istemcisi (`@/shared/http` `api`) + MSW sahte backend,
// gerçek Pinia kapsam deposu ve TanStack Query bağlamı. İstekler kaydedilir (başlık/sorgu
// denetimi, başlıksız istek yokluğu). Standing (`/v1/me`, `/v1/me/departments`, `/v1/programs`)
// `standing()` ile sahte yanıtlanır.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, type App } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

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

/** S3 arşiv/dosya istekleri (departman başlığı zorunlu olanlar): başlıksız olanı yakalar. */
export function s3Requests(): Recorded[] {
  return requests.filter(
    (r) => r.path.startsWith('/v1/records/archive') || r.path.startsWith('/v1/files/'),
  )
}

export function json(body: JsonBodyType, status = 200) {
  return HttpResponse.json(body, { status })
}

export function errorEnvelope(code: string, status: number, headers: Record<string, string> = {}) {
  return HttpResponse.json(
    { code, message: 'sunucu iletisi', request_id: 'req-1', fields: [] },
    { status, headers },
  )
}

export { http, HttpResponse }

/** `useStanding` için üç S1 uç. */
export function standing(
  opts: { admin?: boolean; rows?: ReadonlyArray<readonly [string, string, string]> } = {},
) {
  const rows = opts.rows ?? []
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: 'me-1',
        company_admin: opts.admin === true,
        email: 'me@example.org',
        full_name: 'Ben',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: rows.map(([program, department, role]) => ({
          program_id: program,
          program_name: 'Program',
          department_id: department,
          display_name: `Dept ${department}`,
          role,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
  ]
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

  function run<T>(fn: () => T): { result: T; app: App } {
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

  return { queryClient, store, run, flush: flushPromises }
}

export function resetHarness(): void {
  for (const app of apps.splice(0)) {
    try {
      app.unmount()
    } catch {
      // zaten sökülmüş
    }
  }
  requests.length = 0
  server.resetHandlers()
}

export const ADMIN: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }
export const COORD: ScopeSelection = { programId: 'p1', lens: 'coordinator', departmentId: 'd1' }
export const MEMBER: ScopeSelection = { programId: 'p1', lens: 'member', departmentId: 'd1' }

export function folder(over: object = {}) {
  return { folder_id: 'd1', name: 'Koordinatörlük 1', file_count: 3, is_virtual: false, ...over }
}

export function archiveFile(over: object = {}) {
  return {
    file_id: 'f1',
    work_item_id: 'w1',
    display_name: 'rapor.pdf',
    content_type: 'application/pdf',
    size_bytes: 2048,
    tag: 'sonuc',
    uploaded_by_account_id: 'me-1',
    ...over,
  }
}

export const fileRecord = {
  file_id: 'f1',
  work_item_id: 'w1',
  display_name: 'rapor.pdf',
  content_type: 'application/pdf',
  size_bytes: 3,
  tag: 'sonuc',
}
