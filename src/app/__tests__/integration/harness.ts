// W82a entegrasyon harness'i (web-1 Codex Ö-02 kalan borç, iş 10): ÜRETİM uygulama kökü
// (`App.vue` → `AppShell` → kenar menüsü, üst çubuk, K7 durumları, `UiToast`, `ConfirmHost`) +
// ÜRETİM router'ı (`createAppRouter`, katalog + modül kayıtları + tembel sayfalar + rota kapıları)
// + GERÇEK oturum (sahte `/v1/auth/login` ile açık giriş; belirteç yalnız bellekte) + GERÇEK
// Teleport + durumlu sahte backend (`fake-org*.ts`, sunucu görünürlüğüyle). Taslak bileşen yok.
//
// Deterministik: gerçek süre beklemesi ve `setTimeout(0)` yerleşme döngüsü YOK. Beklemeler DOM /
// durum KOŞULUNA bağlıdır (`until`: söz kuyruğu + tembel içe aktarım yerleşmesi; üst sınır tur
// sayısıdır, saat değil). Modül grafiği her açılışta tazelenir (tekil oturum/kapsam/onay nesneleri);
// soğuk dönüşüm maliyeti test dosyasının `beforeAll` ısınmasında ödenir (W81 kalıbı).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { http, type RequestHandler } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import { createMemoryHistory, type Router } from 'vue-router'

import type { ScopeLens } from '@/shared/scope/scope'

import { createDb, fakeOrg, item, ORIGIN, PASSWORD, type OrgDb, type ServerRoles } from './fake-org'
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

/** Hesaplar (e-posta = giriş). */
export const PEOPLE = {
  admin: { account_id: 'acc-admin', full_name: 'Yasemin Yönetici', email: 'yonetici@example.test' },
  coord: { account_id: 'acc-coord', full_name: 'Kerem Kaya', email: 'koord@example.test' },
  member: { account_id: 'acc-member', full_name: 'Ayşe Demir', email: 'ayse@example.test' },
  second: { account_id: 'acc-cem', full_name: 'Cem Tan', email: 'cem@example.test' },
  free: { account_id: 'acc-bora', full_name: 'Bora Yılmaz', email: 'bora@example.test' },
} as const

/**
 * Ortak dünya: iki program, üç katalog birimi (p1'e Mekanik + Yazılım bağlı, p2'ye Fuar), dört
 * kişilik yetki (yönetici aynı zamanda Mekanik koordinatörü — Koordinatör merceği için), açık
 * görevler. Testler gerektiğinde `db`'yi değiştirir.
 */
export function seedWorld(db: OrgDb): void {
  const p = PEOPLE
  db.accounts = [
    { ...p.admin, admin: true },
    { ...p.coord, admin: false },
    { ...p.member, admin: false },
    { ...p.second, admin: false },
    { ...p.free, admin: false },
  ]
  db.programs = [
    { program_id: 'p1', name: 'Teknofest 2026', year: 2026 },
    { program_id: 'p2', name: 'Teknofest 2027', year: 2027 },
  ]
  db.catalog = [
    { department_id: 'd1', name: 'Mekanik', kind: 'koordinatorluk', code: 'MEK' },
    { department_id: 'd2', name: 'Yazılım', kind: 'koordinatorluk', code: 'YAZ' },
    { department_id: 'd3', name: 'Fuar', kind: 'koordinatorluk', code: 'FUA' },
  ]
  db.links = [
    { program_id: 'p1', department_id: 'd1', display_name: 'Mekanik' },
    { program_id: 'p1', department_id: 'd2', display_name: 'Yazılım' },
    { program_id: 'p2', department_id: 'd3', display_name: 'Fuar' },
  ]
  const row = (
    account: string,
    department: string,
    team: 'coordinator' | 'member',
    program = 'p1',
  ) => ({
    program_id: program,
    department_id: department,
    account_id: account,
    team,
    membership_id: `m-${account}-${program}-${department}`,
  })
  db.memberships = [
    row(p.admin.account_id, 'd1', 'coordinator'),
    row(p.coord.account_id, 'd1', 'coordinator'),
    row(p.member.account_id, 'd1', 'member'),
    row(p.member.account_id, 'd2', 'member'),
    row(p.second.account_id, 'd2', 'member'),
    row(p.second.account_id, 'd3', 'member', 'p2'),
  ]
  const acc = (id: string) => db.accounts.find((a) => a.account_id === id)!
  db.items = [
    item('w1', 'p1', 'd1', acc(p.member.account_id), { title: 'Motor testi' }),
    item('w2', 'p1', 'd1', acc(p.coord.account_id), { title: 'Şasi çizimi' }),
    item('w3', 'p1', 'd2', acc(p.member.account_id), { title: 'Yazılım planı' }),
    item('w4', 'p1', 'd2', acc(p.second.account_id), { title: 'Arayüz taslağı' }),
  ]
}

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

/** Yerleşme: koşul tabanlı (sorgu ve yazma kalmayana dek, en az iki boş tur). */
export async function idle(client: QueryClient): Promise<void> {
  let quiet = 0
  await until(() => {
    quiet = client.isFetching() === 0 && client.isMutating() === 0 ? quiet + 1 : 0
    return quiet >= 3
  }, 'sorgu yerleşmesi')
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
