// Pencere bileşen testleri: GERÇEK API istemcisi + MSW + Pinia kapsam + QueryClient + bellek
// yönlendirici; standing (`['me']`, `['me','departments']`) tohumdan okunur, `ChatPage` bağlamı
// (`CHAT_PAGE_KEY`) sahte pencereyle sağlanır. Pencereler Teleport edilir → `$` belge gövdesinde arar.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, shallowRef, type Component, type ShallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import { http, ORIGIN, server } from '../../../__tests__/harness'
import { CHAT_PAGE_KEY, type ChatPageContext } from '../../../model/context'
import { emptyWindow, type MessageWindow } from '../../../model/window'

export * from '../../../__tests__/harness'
export { msg } from '../../../__tests__/fixtures'

export interface TeamRowSeed {
  departmentId: string
  /** Sunucu rol dizesi: `koordinator` | `uye`. */
  role: string
  displayName?: string
}

export interface WhoSeed {
  accountId?: string
  companyAdmin?: boolean
  rows?: readonly TeamRowSeed[]
}

export const ME = 'acc-me'

export interface RecordedCall {
  method: string
  path: string
  headers: Headers
  query: URLSearchParams
  body: unknown
}
export const calls: RecordedCall[] = []
export const called = (method: string, path: string) =>
  calls.filter((c) => c.method === method && c.path === path)

type WriteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** Uç: isteği kaydeder (JSON gövde ayrıştırılır; çok parçalı gövde ham metin) ve yanıtlar. */
export function on(
  method: WriteMethod,
  path: string,
  respond: (call: RecordedCall) => Response | Promise<Response>,
): void {
  server.use(
    http[method](`${ORIGIN}${path}`, async ({ request }) => {
      const url = new URL(request.url)
      const text = request.method === 'GET' ? '' : await request.clone().text()
      let body: unknown = text
      try {
        body = text === '' ? null : (JSON.parse(text) as unknown)
      } catch {
        body = text
      }
      const call = {
        method: request.method,
        path: url.pathname,
        headers: request.headers,
        query: url.searchParams,
        body,
      }
      calls.push(call)
      return respond(call)
    }),
  )
}

/**
 * Gövdesi OKUNMAYAN uç (çok parçalı yükleme): jsdom `FormData` + msw gövde okuması asılır (work
 * `files.test.ts` kalıbı); başlık ve sorgu kaydedilir.
 */
export function onRaw(
  method: WriteMethod,
  path: string,
  respond: (call: RecordedCall) => Response | Promise<Response>,
): void {
  server.use(
    http[method](`${ORIGIN}${path}`, ({ request }) => {
      const url = new URL(request.url)
      const call = {
        method: request.method,
        path: url.pathname,
        headers: request.headers,
        query: url.searchParams,
        body: null,
      }
      calls.push(call)
      return respond(call)
    }),
  )
}

/**
 * Tarayıcıda `structuredClone(File)` yine `File` döndürür; jsdom'da Node'un özgün işlevi `FormData`'nın
 * kabul etmediği nesne üretir: Blob değişmez, aynen taşınır (chat `attachments.test.ts` kalıbı).
 */
const nativeClone = globalThis.structuredClone
export function browserLikeClone(value: unknown): unknown {
  if (value instanceof Blob) return value
  if (Array.isArray(value)) return value.map(browserLikeClone)
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, browserLikeClone(v)]))
  }
  return nativeClone(value)
}

const wrappers: VueWrapper[] = []

export interface MountOptions {
  who?: WhoSeed
  window?: Partial<MessageWindow>
  /** Açık sohbetin pencere okuması (`loadNewer` izlemek için; verilmezse boş). */
  loadNewer?: () => Promise<void>
}

function seedStanding(client: QueryClient, who: WhoSeed): void {
  client.setQueryData(queryKeys.me.root(), {
    account_id: who.accountId ?? ME,
    company_admin: who.companyAdmin === true,
    email: 'ben@ornek.test',
    full_name: 'Ben',
  })
  client.setQueryData(queryKeys.me.departments(), {
    data: {
      departments: (who.rows ?? []).map((r) => ({
        program_id: 'p1',
        program_name: 'Program',
        department_id: r.departmentId,
        display_name: r.displayName ?? `Birim ${r.departmentId}`,
        role: r.role,
      })),
    },
    truncated: false,
  })
  client.setQueryData(queryKeys.programs.all(), { programs: [], truncated: false })
}

function fakeContext(
  win: ShallowRef<MessageWindow>,
  loadNewer: () => Promise<void> = () => Promise.resolve(),
): ChatPageContext {
  return {
    chatId: () => 'c1',
    messages: {
      window: win,
      loadNewer,
      refreshMessage: () => Promise.resolve(),
      refreshPeerRead: () => Promise.resolve(),
      reconcile: () => Promise.resolve(),
      loadOlder: () => Promise.resolve(),
      jumpTo: () => Promise.resolve(),
      readFirstUnread: () => Promise.resolve(undefined),
      query: { isPending: ref(false), isError: ref(false), refetch: () => Promise.resolve() },
    },
    typingAccountIds: () => [],
    connection: () => 'open',
  }
}

function fakeRouter() {
  const stub = { template: '<div />' }
  const history = createMemoryHistory()
  history.replace('/mesajlar/c1')
  return createRouter({
    history,
    routes: [
      { name: 'collaboration.chats', path: '/mesajlar', component: stub },
      { name: 'collaboration.chat', path: '/mesajlar/:chatId', component: stub },
      { name: 'work.tasks', path: '/gorevler', component: stub },
      { name: 'collaboration.meetings', path: '/toplantilar', component: stub },
    ],
  })
}

export function mountDialog<P extends Record<string, unknown>>(
  component: Component,
  props: P,
  options: MountOptions = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  seedStanding(client, options.who ?? { companyAdmin: true })
  const win = shallowRef<MessageWindow>({ ...emptyWindow(), ...options.window })
  const router = fakeRouter()
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: {
      plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]],
      provide: { [CHAT_PAGE_KEY as symbol]: fakeContext(win, options.loadNewer) },
    },
  })
  wrappers.push(wrapper)
  return { wrapper, client, router, window: win }
}

/** Her test sonunda: bileşenler sökülür, onay/bildirim kuyrukları ve belge sıfırlanır. */
export function resetDialogs(): void {
  for (const w of wrappers.splice(0)) w.unmount()
  useConfirm().clear()
  useToast().clear()
  calls.length = 0
  document.body.innerHTML = ''
}

export function $(selector: string): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(selector)
}

export function $$(selector: string): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>(selector)]
}

export function setValue(selector: string, value: string): void {
  const el = $(selector) as HTMLInputElement | HTMLSelectElement | null
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'))
}

export function click(selector: string): void {
  const el = $(selector)
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.click()
}

export function clickText(text: string, within: ParentNode = document.body): void {
  const el = [...within.querySelectorAll<HTMLElement>('button')].find(
    (b) => b.textContent?.trim() === text,
  )
  if (!el) throw new Error(`düğme yok: ${text}`)
  el.click()
}

export function pressEscape(): void {
  const panel = $('.t-modal')
  panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
}
