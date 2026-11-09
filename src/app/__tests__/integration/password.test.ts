// W83 · K-1 (F2 görsel doğrulaması, yüksek): geçici parolayla ilk girişte zorunlu parola değişimi
// (P14; 00-ortak `backend.md` §6). ÜRETİM uygulama kökü + router + GERÇEK oturum ve HTTP istemcisi;
// sahte backend sözleşmeyi izler: kısıtlı hesabın S1+ uçları 403
// `identity.force_password_change_required` (parola değişimi / çıkış / yenileme muaf),
// `changePassword` başarıda bütün oturumları düşürür ve çerezi temizler (IDENTITY-K15/K16).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, type Router } from 'vue-router'

import { envelope, json, ORIGIN, PASSWORD } from './fake-org'
import { $, click, createBackend, fill, idle, PEOPLE, seedWorld, teardown, until } from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const USER = PEOPLE.member
const NEW_PASSWORD = 'Yeni-Parola-2026'

/** Kısıtlı hesaplar, hesap parolaları ve "yenileme çerezi" taşıyan hesap (sahte). */
interface AuthState {
  forced: Set<string>
  /** `true`: giriş yanıtı bayrağı taşımaz; kısıt yalnız 403 ile öğrenilir. */
  silentLogin: boolean
  passwords: Map<string, string>
  cookie: string | null
}
let auth: AuthState

const EXEMPT = new Set(['/v1/auth/password', '/v1/auth/logout', '/v1/auth/refresh'])

function bearerAccount(request: Request): string | null {
  const match = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')
  return match ? (backend.db.tokens.get(match[1]!) ?? null) : null
}

function issue(accountId: string) {
  const token = `tok-${String(backend.db.tokens.size + 1).padStart(16, '0')}`
  backend.db.tokens.set(token, accountId)
  return { token, account_id: accountId, expires_at: Math.floor(Date.now() / 1000) + 900 }
}

function authOverrides() {
  return [
    http.post(`${ORIGIN}/v1/auth/login`, async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string }
      const account = backend.db.accounts.find((a) => a.email === body.email)
      const expected = account ? (auth.passwords.get(account.account_id) ?? PASSWORD) : null
      if (!account || body.password !== expected) {
        return envelope('identity.credentials_invalid', 401)
      }
      auth.cookie = account.account_id
      const forced = auth.forced.has(account.account_id) && !auth.silentLogin
      return json({ ...issue(account.account_id), force_password_change: forced })
    }),
    http.post(`${ORIGIN}/v1/auth/refresh`, () => {
      if (!auth.cookie) return envelope('identity.session_invalid', 401)
      return json({ ...issue(auth.cookie), refresh_expires_at: 0 })
    }),
    http.post(`${ORIGIN}/v1/auth/password`, async ({ request }) => {
      const accountId = bearerAccount(request)
      if (!accountId) return envelope('platform.unauthenticated', 401)
      const body = (await request.json()) as Record<string, unknown>
      if (body.current_password !== (auth.passwords.get(accountId) ?? PASSWORD)) {
        return envelope('identity.credentials_invalid', 401)
      }
      const next = String(body.new_password)
      if (next.length < 8) {
        return envelope('identity.input_invalid', 422, [
          { field: 'new_password', code: 'identity.password_too_short', message: 'x' },
        ])
      }
      auth.passwords.set(accountId, next)
      auth.forced.delete(accountId)
      let revoked = 0
      for (const [token, owner] of backend.db.tokens) {
        if (owner === accountId) {
          backend.db.tokens.delete(token)
          revoked += 1
        }
      }
      auth.cookie = null
      return json({ revoked_sessions: revoked })
    }),
    // Kısıt: muaf olmayan her kimlikli uç 403 (backend `forcePasswordChange` ara katmanı).
    http.all(`${ORIGIN}/v1/*`, ({ request }) => {
      const path = new URL(request.url).pathname
      const accountId = bearerAccount(request)
      if (!accountId || !auth.forced.has(accountId) || EXEMPT.has(path)) return undefined
      return envelope('identity.force_password_change_required', 403)
    }),
  ]
}

const mounted: VueWrapper[] = []

/**
 * Açık giriş (`session.login`, gerçek istemci; harness `boot` kalıbı — açılıştaki sessiz refresh
 * beklemesi yok) + üretim router'ı + `App.vue`. Sonraki girişler gerçek oturum sayfasından.
 */
async function bootWithLogin(path: string) {
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  const pinia = createPinia()
  setActivePinia(pinia)
  const { preferences } = await import('@/shared/preferences')
  preferences.clearAll()
  const { useSessionStore } = await import('@/shared/session/store')
  const session = useSessionStore()
  await session.login({ email: USER.email, password: PASSWORD })
  const { default: App } = await import('@/app/App.vue')
  const { createAppRouter } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  const router: Router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const wrapper = mount(App, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router, i18n] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return { wrapper, router, queryClient, session }
}

async function login(password: string) {
  await fill('[data-testid="login-form"] [name="email"]', USER.email)
  await fill('[data-testid="login-form"] [name="password"]', password)
  await click('[data-testid="login-form"] button[type="submit"]')
}

async function changePassword(current: string, next: string, repeat = next) {
  await fill('[name="current_password"]', current)
  await fill('[name="new_password"]', next)
  await fill('[name="repeat_password"]', repeat)
  await click('[data-testid="force-password-submit"]')
}

const form = () => $('[data-testid="force-password-change"]')
const passwordPosts = () => backend.sent('POST', '/v1/auth/password')

function fieldError(name: string): string {
  const input = $(`[name="${name}"]`)
  const id = input?.getAttribute('aria-describedby')
  return (id ? document.getElementById(id)?.textContent : '')?.trim() ?? ''
}

function leaks(queryClient: QueryClient, secrets: string[]): string[] {
  const surfaces = [
    document.body.innerHTML,
    JSON.stringify(
      queryClient
        .getMutationCache()
        .getAll()
        .map((m) => m.state),
    ),
    JSON.stringify(
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.state.data ?? null),
    ),
    ...[...document.querySelectorAll('input')].map((i) => i.value),
  ]
  return secrets.filter((s) => surfaces.some((text) => text.includes(s)))
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  auth = {
    forced: new Set([USER.account_id]),
    silentLogin: false,
    passwords: new Map(),
    cookie: null,
  }
  backend.server.use(...authOverrides())
})
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  teardown()
})
afterAll(() => backend.server.close())

describe('zorunlu parola değişimi (K-1; P14)', () => {
  it('giriş force_password_change → form; kabuk ve diğer rotalar kapalı; değişim → yeni giriş → ana sayfa', async () => {
    const app = await bootWithLogin('/')
    await until(form, 'parola formu')
    await until(() => app.router.currentRoute.value.path === '/oturum', 'oturum rotası')
    expect($('[data-testid="app-shell"]')).toBeNull()

    // Diğer rota açılmaz: kabuk yok, yine parola formu.
    await app.router.push('/kullanicilar')
    await until(() => app.router.currentRoute.value.path === '/oturum', 'oturum rotası')
    expect(form()).not.toBeNull()
    expect($('[data-testid="users-page"]')).toBeNull()

    // İstemci kuralı: boş olamaz → istek yok; odak ilk hatalı alanda.
    await click('[data-testid="force-password-submit"]')
    await until(() => fieldError('current_password'), 'boş alan hatası')
    expect(fieldError('new_password')).toBe('Bu alan boş olamaz.')
    await until(() => document.activeElement === $('[name="current_password"]'), 'odak')
    // Eşleşme kuralı.
    await changePassword(PASSWORD, NEW_PASSWORD, 'Baska-Parola-1')
    await until(() => fieldError('repeat_password') === 'Parolalar eşleşmiyor.', 'eşleşme hatası')
    expect(fieldError('current_password')).toBe('')
    expect(passwordPosts()).toHaveLength(0)

    await changePassword(PASSWORD, NEW_PASSWORD)
    await until(() => $('[data-testid="password-changed"]'), 'parola değişti bildirimi')
    const [post] = passwordPosts()
    expect(post!.body).toEqual({ current_password: PASSWORD, new_password: NEW_PASSWORD })
    expect(post!.headers.get('X-Requested-With')).toBeTruthy()
    expect(post!.headers.get('Idempotency-Key')).toBeNull()
    expect(app.session.status).toBe('anonymous')
    expect(form()).toBeNull()
    await until(() => $('[data-testid="login-form"]'), 'giriş formu')
    // Bitmiş mutasyon `gcTime: 0` ile bir sonraki görevde önbellekten düşer (W74 kalıbı).
    await vi.waitFor(() => expect(app.queryClient.getMutationCache().getAll()).toHaveLength(0))
    expect(leaks(app.queryClient, [PASSWORD, NEW_PASSWORD])).toEqual([])

    // Yeni parolayla giriş → bayrak kalkık → kabuk + ana sayfa.
    await login(NEW_PASSWORD)
    await until(() => $('[data-testid="app-shell"]'), 'kabuk')
    await until(() => app.router.currentRoute.value.name === 'home', 'ana sayfa')
    expect(app.session.forcePasswordChange).toBe(false)
    expect($('[data-testid="password-changed"]')).toBeNull()
    await idle(app.queryClient)
    // Kabuk kapsamı (standing) yeni oturumla okundu.
    expect(
      backend.requests.some(
        (r) => r.path === '/v1/me/departments' && r.account === USER.account_id,
      ),
    ).toBe(true)
  })

  it('403 identity.force_password_change_required (giriş bayraksız) → aynı form ve akış', async () => {
    auth.silentLogin = true
    const app = await bootWithLogin('/oturum')
    expect(app.session.forcePasswordChange).toBe(false)
    await until(form, 'parola formu (403 sonrası)')
    expect(app.session.forcePasswordChange).toBe(true)
    expect(backend.requests.some((r) => r.path === '/v1/me' && r.account === USER.account_id)).toBe(
      true,
    )

    await changePassword(PASSWORD, NEW_PASSWORD)
    await until(() => $('[data-testid="password-changed"]'), 'bildirim')
    await login(NEW_PASSWORD)
    await until(() => app.router.currentRoute.value.name === 'home', 'ana sayfa')
    expect($('[data-testid="app-shell"]')).not.toBeNull()
  })

  it('422 identity.input_invalid fields[] → yeni parola alanı; 401 credentials_invalid → mevcut parola alanı; parolalar sızmaz', async () => {
    const app = await bootWithLogin('/oturum')
    await until(form, 'parola formu')

    await changePassword(PASSWORD, 'kisa')
    await until(() => fieldError('new_password'), '422 alan hatası')
    expect(fieldError('new_password')).toBe('Parola çok kısa.')
    expect(document.activeElement).toBe($('[name="new_password"]'))
    expect(form()).not.toBeNull()

    await changePassword('yanlis-parola', NEW_PASSWORD)
    await until(() => fieldError('current_password'), '401 alan hatası')
    expect(fieldError('current_password')).toBe('Mevcut parola hatalı.')
    // Yanlış mevcut parola: refresh ve tekrar YOK (deneme kovasına tek yazım; W83b); oturum sürer.
    expect(passwordPosts()).toHaveLength(2) // 422 + 401, her biri bir kez
    expect(backend.sent('POST', '/v1/auth/refresh')).toHaveLength(0)
    expect(app.session.status).toBe('authenticated')
    expect(form()).not.toBeNull()

    await vi.waitFor(() => expect(app.queryClient.getMutationCache().getAll()).toHaveLength(0))
    expect(leaks(app.queryClient, [PASSWORD, 'kisa', 'yanlis-parola', NEW_PASSWORD])).toEqual([])
  })

  it('çıkış düğmesi oturumu kapatır (muaf uç), parola formu kalkar', async () => {
    const app = await bootWithLogin('/oturum')
    await until(form, 'parola formu')
    await click('[data-testid="force-password-logout"]')
    await until(() => $('[data-testid="login-form"]'), 'giriş formu')
    expect(backend.sent('POST', '/v1/auth/logout')).toHaveLength(1)
    expect(app.session.status).toBe('anonymous')
  })
})
