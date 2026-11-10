// Görev modülü testleri: GERÇEK API istemcisi (`@/shared/http` `api`) + MSW sahte backend,
// gerçek Pinia kapsam deposu ve TanStack Query bağlamı. İstekler kaydedilir (başlık/sorgu/gövde
// denetimi, fan-out sayımı).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, type App } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import type { WorkItemDetail, WorkItemNote, WorkItemSubtask } from '../types'

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
  // Yalnız JSON gövde kaydedilir (çok parçalı gövde başlık + sorgu ile denetlenir).
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    void clone.json().then((b: unknown) => (entry.body = b))
  }
})

/** Yol + yöntemle kayıtlı istekler. */
export function sent(method: string, path: string): Recorded[] {
  return requests.filter((r) => r.method === method && r.path === path)
}

export function json(body: JsonBodyType, status = 200) {
  return HttpResponse.json(body, { status })
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
    defaultOptions: { queries: { retryDelay: 0, retry: false }, mutations: { retry: false } },
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

export function workItem(over: Partial<WorkItemDetail> = {}): WorkItemDetail {
  return {
    description: '',
    work_item_id: 'w1',
    program_id: 'p1',
    department_id: 'd2',
    title: 'Rapor',
    priority: 'orta',
    status: 'baslanmadi',
    assignees: [{ account_id: 'acc-1', full_name: 'Ayşe' }],
    assignee_account_ids: ['acc-1'],
    start_on: '2026-11-01',
    end_on: '2026-11-10',
    is_overdue: false,
    days_overdue: 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
    completion_evidence_required: true,
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

export function subtask(over: Partial<WorkItemSubtask> = {}): WorkItemSubtask {
  return {
    subtask_id: 's1',
    work_item_id: 'w1',
    title: 'Taslak',
    done: false,
    done_by_full_name: null,
    assignee_full_name: null,
    created_by_account_id: 'acc-9',
    created_by_full_name: null,
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
    edit_revision: 5,
    ...over,
  }
}

export function note(over: Partial<WorkItemNote> = {}): WorkItemNote {
  return {
    note_id: 'n1',
    work_item_id: 'w1',
    author_account_id: 'acc-1',
    author_full_name: 'Ayşe',
    content: 'İlk',
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
    edit_revision: 2,
    ...over,
  }
}
