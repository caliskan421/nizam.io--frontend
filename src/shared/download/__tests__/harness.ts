// İndirme akışı testleri: GERÇEK API istemcisi (`@/shared/http` `api`) + MSW sahte backend, gerçek
// Pinia kapsam deposu ve TanStack Query bağlamı. İstekler kaydedilir (başlık/gövde denetimi).
// Rapor modülü testleri de bu aracı kullanır (`modules/reports/__tests__/harness.ts`).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, type App } from 'vue'
import { vi } from 'vitest'

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

/** Tarayıcı kaydetme yüzeyi: oluşturulan blob'lar, serbest bırakılan URL'ler, tıklanan dosya adları. */
export function browserSave() {
  const state = { created: [] as Blob[], revoked: [] as string[], clicked: [] as string[] }
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      state.created.push(blob)
      return `blob:${state.created.length}`
    },
    revokeObjectURL: (url: string) => state.revoked.push(url),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    state.clicked.push(this.download)
  })
  return state
}

/** `issueDownloadTicket` 201 yanıtı. */
export const ticketOk = (url = '/v1/downloads/tk_1') =>
  http.post(`${ORIGIN}/v1/download-tickets`, () =>
    json({ ticket: 'tk_1', url, expires_at: '2026-11-12T12:01:00Z' }, 201),
  )

/** `redeemDownloadTicket` PDF yanıtı. */
export const pdf = (headers: HeadersInit = {}) =>
  http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([37, 80, 68, 70]).buffer, {
      headers: { 'Content-Type': 'application/pdf', ...headers },
    }),
  )
