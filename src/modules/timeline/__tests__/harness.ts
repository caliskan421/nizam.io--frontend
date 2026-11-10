// Zaman çizelgesi modülü testleri: GERÇEK API istemcisi (`@/shared/http` `api`) + MSW sahte
// backend, gerçek Pinia kapsam deposu ve TanStack Query bağlamı. İstekler kaydedilir (başlık /
// sorgu / gövde denetimi, fan-out sayımı). Kalıp work harness'ıyla aynıdır (modül sınırı gereği
// ayrı dosya). Fikstürler örnek veridir, gerçek veri DEĞİLDİR.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, type App } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import type { Gantt, GanttTask } from '../model/types'

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

/** Yol + yöntemle kayıtlı istekler. */
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

const apps: App[] = []

/** Pinia + kapsam + QueryClient; `run` composable'ı bir bileşen bağlamında koşturur. */
export function harness(selection: ScopeSelection) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 }, mutations: { retry: false } },
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)

  function run<T>(fn: () => T): T {
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
    return result as T
  }

  return { queryClient, store, run, flush: flushPromises }
}

/** Her test sonunda: uygulamalar sökülür, kayıt ve işleyiciler sıfırlanır. */
export function resetHarness(): void {
  for (const app of apps.splice(0)) app.unmount()
  requests.length = 0
  server.resetHandlers()
}

// --- Fikstürler ---------------------------------------------------------------------------

export const ADMIN_SCOPE: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }
export const COORD_SCOPE: ScopeSelection = {
  programId: 'p1',
  lens: 'coordinator',
  departmentId: 'd1',
}
export const MEMBER_SCOPE: ScopeSelection = { programId: 'p1', lens: 'member', departmentId: 'd1' }

export function ganttTask(over: Partial<GanttTask> = {}): GanttTask {
  return {
    work_item_id: 'w1',
    title: 'Rapor',
    program_id: 'p1',
    department_id: 'd2',
    priority: 'orta',
    status: 'devam_ediyor',
    start_on: '2026-11-01',
    end_on: '2026-11-10',
    planned_end_on: '',
    completed_on: '',
    assignee_account_ids: ['acc-1'],
    dates_revision: 1,
    pending_date_request: null,
    subtask_counts: { total: 0, done: 0 },
    lateness: {
      is_overdue: false,
      days_overdue: 0,
      is_completed_late: false,
      days_late: 0,
      is_completed_early: false,
      days_early: 0,
    },
    ...over,
  }
}

export function gantt(over: Partial<Gantt> = {}): Gantt {
  return { tasks: [ganttTask()], links: [], ...over }
}

/** `getWorkItem` yanıtı (yalnız tarih yazımı için gereken alanlar anlamlı). */
export function workItem(over: Record<string, unknown> = {}) {
  return {
    description: '',
    work_item_id: 'w1',
    program_id: 'p1',
    department_id: 'd2',
    title: 'Rapor',
    priority: 'orta',
    status: 'devam_ediyor',
    assignees: [],
    assignee_account_ids: [],
    start_on: '2026-11-01',
    end_on: '2026-11-10',
    is_overdue: false,
    days_overdue: 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
    completion_evidence_required: false,
    subtask_counts: { total: 0, done: 0 },
    pending_date_request: null,
    created_at: '2026-11-01T08:00:00Z',
    created_by_account_id: 'acc-9',
    created_by_full_name: 'Yönetici',
    edit_revision: 3,
    dates_revision: 7,
    ...over,
  }
}
