// Program modülü testleri: GERÇEK API istemcisi (`@/shared/http` `api`) + MSW sahte backend,
// gerçek Pinia kapsam deposu ve TanStack Query bağlamı; standing tohumu (`['me']`,
// `['me','departments']`, `['programs']`). İstekler kaydedilir (başlık / gövde denetimi). Kalıp
// organizasyon harness'ıyla aynıdır (modül sınırı gereği ayrı dosya).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, nextTick, type App, type Component } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

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

export const ADMIN_SCOPE: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }
export const COORD_LENS_SCOPE: ScopeSelection = {
  programId: 'p1',
  lens: 'coordinator',
  departmentId: 'd1',
}

export interface ProgramSeed {
  program_id: string
  name: string
  year?: number
}

export const PROGRAMS: ProgramSeed[] = [
  { program_id: 'p1', name: 'Teknofest 2026', year: 2026 },
  { program_id: 'p2', name: 'Teknofest 2027', year: 2027 },
]

const apps: App[] = []
const wrappers: VueWrapper[] = []

/** Standing tohumu (oturum açık olmadığından standing sorguları ağa çıkmaz; tohum okunur). */
function seedStanding(
  queryClient: QueryClient,
  opts: { companyAdmin?: boolean; programs?: ProgramSeed[] },
): void {
  queryClient.setQueryData(queryKeys.me.root(), {
    account_id: 'acc-me',
    company_admin: opts.companyAdmin ?? true,
    email: 'ben@ornek.test',
    full_name: 'Ben',
  })
  queryClient.setQueryData(queryKeys.me.departments(), {
    data: { departments: [] },
    truncated: false,
  })
  const programs = (opts.programs ?? PROGRAMS).map((p) => ({
    programId: p.program_id,
    name: p.name,
    year: p.year ?? null,
  }))
  queryClient.setQueryData(queryKeys.programs.all(), { programs, truncated: false })
}

/** Pinia + kapsam + QueryClient + standing tohumu. */
export function harness(
  selection: ScopeSelection,
  opts: { companyAdmin?: boolean; programs?: ProgramSeed[] } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)
  seedStanding(queryClient, opts)

  /** Seçili programın departmanları (`listProgramDepartments`) önbellek tohumu. */
  function departments(list: ReadonlyArray<{ id: string; name: string }>): void {
    queryClient.setQueryData(queryKeys.departments.all(store.snapshot), {
      departments: list.map((d) => ({ department_id: d.id, display_name: d.name })),
    })
  }

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

  function mountIt<P extends Record<string, unknown>>(component: Component, props: P) {
    const wrapper = mount(component, {
      props,
      attachTo: document.body,
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
    })
    wrappers.push(wrapper)
    return wrapper
  }

  /** Onay kuyruğu (kabuk `ConfirmHost` yerine). */
  const confirmQueue = run(() => useConfirm()).result

  return {
    queryClient,
    store,
    run,
    mount: mountIt,
    departments,
    confirmQueue,
    flush: flushPromises,
  }
}

export function resetHarness(): void {
  for (const w of wrappers.splice(0)) w.unmount()
  for (const app of apps.splice(0)) app.unmount()
  useConfirm().clear()
  useToast().clear()
  requests.length = 0
  server.resetHandlers()
  document.body.innerHTML = ''
}

/** Teleport edilmiş pencere içinde seçici. */
export function $(selector: string): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(selector)
}

export async function setValue(selector: string, value: string): Promise<void> {
  const el = $(selector) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'))
  await nextTick()
}

export function click(selector: string): void {
  const el = $(selector)
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.click()
}

export function toasts(): string[] {
  return useToast().queue.value.map((t) => t.message)
}

export function bodyOf(r: Recorded | undefined): Record<string, unknown> {
  return (r?.body ?? {}) as Record<string, unknown>
}
