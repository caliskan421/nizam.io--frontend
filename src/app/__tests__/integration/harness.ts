// W82a entegrasyon harness'i (web-1 Codex Ö-02 kalan borç, iş 10): ÜRETİM uygulama kökü
// (`App.vue` → `AppShell` → kenar menüsü, üst çubuk, K7 durumları, `UiToast`, `ConfirmHost`) +
// ÜRETİM router'ı (`createAppRouter`, katalog + modül kayıtları + tembel sayfalar + rota kapıları)
// + GERÇEK oturum (sahte `/v1/auth/login` ile açık giriş; belirteç yalnız bellekte) + GERÇEK
// Teleport + durumlu sahte backend (`fake-org*.ts`, sunucu görünürlüğüyle). Taslak bileşen yok.
//
// Deterministik: gerçek süre beklemesi ve `setTimeout(0)` yerleşme döngüsü YOK. Sorgu yerleşmesi
// ortak olay tabanlı `settleQueries` ile (`idle`; Ö-04); DOM / durum koşulu `until` ile (söz kuyruğu
// + tembel içe aktarım yerleşmesi; üst sınır tur sayısıdır, saat değil). Modül grafiği her açılışta tazelenir (tekil oturum/kapsam/onay nesneleri);
// soğuk dönüşüm maliyeti test dosyasının `beforeAll` ısınmasında ödenir (W81 kalıbı).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { http, type RequestHandler } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import { createMemoryHistory, type Router } from 'vue-router'

import { settleQueries } from '@/shared/http/__tests__/settle'
import type { ScopeLens } from '@/shared/scope/scope'

import { createDb, fakeOrg, ORIGIN, PASSWORD, type OrgDb, type ServerRoles } from './fake-org'
import { teamHandlers } from './fake-org-team'
import { workHandlers } from './fake-org-work'

export interface Recorded {
  method: string
  path: string
  query: URLSearchParams
  headers: Headers
  body: unknown
  account: string | null
}

interface Hold {
  method: string
  path: string
  gate: Promise<void>
  arrived: () => void
}

/** Sahte backend + MSW sunucusu + istek kaydı + bekletme kapıları. */
export function createBackend(roles: ServerRoles) {
  const db: OrgDb = createDb(roles)
  const requests: Recorded[] = []
  const holds: Hold[] = []

  const holdHandler = http.all(`${ORIGIN}/v1/*`, async ({ request }) => {
    const path = new URL(request.url).pathname
    const at = holds.findIndex((h) => h.method === request.method && h.path === path)
    if (at < 0) return undefined
    const [hold] = holds.splice(at, 1)
    hold!.arrived()
    await hold!.gate
    return undefined
  })
  const handlers = (): RequestHandler[] => [
    holdHandler,
    ...fakeOrg.authHandlers(db),
    ...fakeOrg.standingHandlers(db),
    ...teamHandlers(db),
    ...workHandlers(db),
  ]
  const server = setupServer(...handlers())

  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    const entry: Recorded = {
      method: request.method,
      path: url.pathname,
      query: url.searchParams,
      headers: new Headers(request.headers),
      body: undefined,
      account: fakeOrg.actorOf(db, request)?.account_id ?? null,
    }
    requests.push(entry)
    if ((request.headers.get('content-type') ?? '').includes('application/json')) {
      void request
        .clone()
        .json()
        .then((b: unknown) => (entry.body = b))
    }
  })

  /**
   * `method path` isteğini sunucuya ulaştığı anda bekletir. `arrived` istek geldiğinde çözülür;
   * `release()` yanıtı serbest bırakır (geciktirilmiş yanıt senaryoları; gerçek süre yok).
   */
  function hold(method: string, path: string) {
    let release!: () => void
    let arrived!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    holds.push({ method, path, gate, arrived })
    return { release, arrived: reached }
  }

  function sent(method: string, path: string): Recorded[] {
    return requests.filter((r) => r.method === method && r.path === path)
  }

  function reset(): void {
    Object.assign(db, createDb(roles))
    requests.length = 0
    holds.length = 0
    server.resetHandlers(...handlers())
  }

  return { db, server, requests, sent, hold, reset }
}

export type Backend = ReturnType<typeof createBackend>

export { PEOPLE, seedWorld } from './world'

export interface BootOptions {
  /** Giriş yapacak hesabın e-postası (sahte backend `accounts`). */
  email: string
  path: string
  /** Hatırlanan kapsam (K2 tercih anahtarları); verilmezse kabuk kendisi çözer. */
  scope?: { programId: string; lens: ScopeLens; departmentId?: string }
}

const mounted: VueWrapper[] = []

/** Taze modül grafiği + açık giriş + üretim router'ı + `App.vue`; kabuk görünene dek bekler. */
export async function boot(options: BootOptions) {
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  const pinia = createPinia()
  setActivePinia(pinia)
  const { preferences } = await import('@/shared/preferences')
  preferences.clearAll()
  if (options.scope) {
    preferences.write('scope.programId', options.scope.programId)
    preferences.write('scope.lens', options.scope.lens)
    if (options.scope.departmentId) {
      preferences.write('scope.departmentId', options.scope.departmentId)
    }
  }
  const { useSessionStore } = await import('@/shared/session/store')
  const session = useSessionStore()
  await session.login({ email: options.email, password: PASSWORD })
  const { default: App } = await import('@/app/App.vue')
  const { createAppRouter } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const { useScopeStore } = await import('@/shared/scope/store')
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  const router: Router = createAppRouter(createMemoryHistory())
  await router.push(options.path)
  const wrapper = mount(App, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router, i18n] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await until(() => $('[data-testid="app-shell"]'))
  return { wrapper, router, queryClient, session, scope: useScopeStore(), pinia }
}

export type Booted = Awaited<ReturnType<typeof boot>>

/** Test sonu: uygulama sökülür, gövde temizlenir. */
export function teardown(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
}

// --- Bekleme ve DOM yardımcıları -------------------------------------------------------------

/**
 * Koşul sağlanana dek söz kuyruğunu ve tembel içe aktarımları boşaltır. Gerçek süre beklemesi
 * yok; üst sınır tur sayısıdır (sahte backend anında yanıtlar).
 */
export async function until<T>(
  probe: () => T | null | undefined | false,
  label = 'koşul',
  rounds = 400,
): Promise<T> {
  for (let i = 0; i < rounds; i += 1) {
    const value = probe()
    if (value) return value
    await flushPromises()
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    await vi.dynamicImportSettled()
  }
  throw new Error(`${label} sağlanmadı`)
}

/**
 * Yerleşme: ortak olay tabanlı bekleme (`settleQueries`, Ö-04): uçuştaki sorgu/yazmalar bitene ve
 * sonuçla tetiklenen yeniden okumalar işlenene dek; meşgulken yalnız önbellek olayı beklenir.
 * Tembel rota bileşenlerinin içe aktarımı da yerleşir.
 */
export async function idle(client: QueryClient): Promise<void> {
  await vi.dynamicImportSettled()
  await settleQueries(client)
}

export const $ = (selector: string, root: ParentNode = document.body) =>
  root.querySelector<HTMLElement>(selector)

export const $$ = (selector: string, root: ParentNode = document.body) => [
  ...root.querySelectorAll<HTMLElement>(selector),
]

/** Görünür metniyle öğe (`selector` içinde, tam eşleşme ya da önek). */
export function byText(selector: string, text: string, root: ParentNode = document.body) {
  return (
    $$(selector, root).find((el) => {
      const own = el.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      return own === text || own.startsWith(text)
    }) ?? null
  )
}

/** Öğe görünene dek bekler ve tıklar. */
export async function click(target: string | (() => HTMLElement | null)): Promise<HTMLElement> {
  const probe = typeof target === 'string' ? () => $(target) : target
  const el = await until(probe, `tıklanacak öğe ${String(target)}`)
  el.click()
  await flushPromises()
  return el
}

/** Metin alanı / seçim kutusu değeri (girdi olayıyla). */
export async function fill(selector: string, value: string): Promise<void> {
  const el = await until(() => $(selector) as HTMLInputElement | HTMLSelectElement | null, selector)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  await flushPromises()
}

/** Kişi seçici: aramayı odaklar, kişi satırını seçer. */
export async function pickPerson(accountId: string, root = '[role="dialog"]'): Promise<void> {
  const input = await until(() => $(`${root} [name="person-search"]`), 'kişi seçici')
  input.dispatchEvent(new Event('focus'))
  await click(() => $(`${root} [data-account="${accountId}"]`))
}

/** Kenar menüsü kapsam kartı → menü öğesi (gerçek kabuk seçicisi; `kind` kartın erişilebilir adı). */
export async function switchScope(kind: 'Program' | 'Rol' | 'Koordinatörlük', option: string) {
  const card = await until(() => $(`aside button.side-card[aria-label^="${kind}:"]`), kind)
  // Seçim bekleyen kapsamda kabuk menüyü kendisi açmış olabilir (K2): yeniden tıklamak kapatır.
  if (card.getAttribute('aria-expanded') !== 'true') await click(() => card)
  await click(
    () =>
      $$('[role="menuitem"], [role="menuitemradio"]').find((el) =>
        el.textContent?.includes(option),
      ) ?? null,
  )
}

/** Kabuk bildirimleri (UiToast) metni. */
export function toasts(): string {
  return $$('.rp-toast')
    .map((el) => el.textContent ?? '')
    .join(' | ')
}
