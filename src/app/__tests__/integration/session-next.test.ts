// W145 · KUSUR 1 (W144 gerçek sunucu tanığı): anonim `/` → kapı `/oturum`; giriş sonrası kullanıcı
// `/oturum`'da kalmaz, geldiği rotaya (yoksa ana sayfaya) `replace` ile döner. ÜRETİM uygulama kökü
// + router + GERÇEK oturum; sahte backend sözleşmeyi izler (yenileme 401 → anonim açılış).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, type Router } from 'vue-router'

import { PASSWORD } from './fake-org'
import { $, click, createBackend, fill, idle, PEOPLE, seedWorld, teardown, until } from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const USER = PEOPLE.member
const mounted: VueWrapper[] = []

/** Anonim açılış: belirteç yok, sessiz yenileme 401; üretim router'ı + `App.vue`. */
async function bootAnonymous(path: string) {
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  const pinia = createPinia()
  setActivePinia(pinia)
  const { preferences } = await import('@/shared/preferences')
  preferences.clearAll()
  const { default: App } = await import('@/app/App.vue')
  const { createAppRouter } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0, gcTime: Infinity } },
  })
  const router: Router = createAppRouter(createMemoryHistory())
  await router.push(path)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const wrapper = mount(App, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router, i18n] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  // Sessiz yenileme 401: kardeş sekme bekleme süreleri (150 ms eşitleme + 1 sn akran) sahte saatle
  // ilerletilir; bekleme kurulumu kurulum profili yanıtından sonra başladığı için tur tur.
  for (let round = 0; round < 40 && !$('[data-testid="login-form"]'); round += 1) {
    await vi.advanceTimersByTimeAsync(200)
    await until(() => true)
  }
  await until(() => $('[data-testid="login-form"]'), 'giriş formu')
  vi.useRealTimers()
  return { router, queryClient }
}

async function login(): Promise<void> {
  await fill('[data-testid="login-form"] [name="email"]', USER.email)
  await fill('[data-testid="login-form"] [name="password"]', PASSWORD)
  await click('[data-testid="login-form"] button[type="submit"]')
  await until(() => $('[data-testid="app-shell"]'), 'kabuk')
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(async () => {
  vi.useRealTimers()
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  teardown()
  await backend.settled()
})
afterAll(() => backend.server.close())

describe('giriş sonrası dönüş (KUSUR 1)', () => {
  it('anonim `/` → `/oturum?next=/` → giriş → ana sayfa (S0 sayfası değil)', async () => {
    const app = await bootAnonymous('/')
    await until(() => app.router.currentRoute.value.name === 'identity.session', 'oturum rotası')
    expect(app.router.currentRoute.value.query.next).toBe('/')
    await login()
    await until(() => app.router.currentRoute.value.name === 'home', 'ana sayfa')
    expect(app.router.currentRoute.value.query.next).toBeUndefined()
    expect($('[data-testid="session-page"]')).toBeNull()
    await idle(app.queryClient)
  })

  it('geldiği rota (sorguyla) korunur; geri düğmesi `/oturum`a dönmez (replace)', async () => {
    const app = await bootAnonymous('/zaman-cizelgesi?olcek=ay')
    await until(() => app.router.currentRoute.value.name === 'identity.session', 'oturum rotası')
    await login()
    await until(() => app.router.currentRoute.value.name === 'work.timeline', 'zaman çizelgesi')
    expect(app.router.currentRoute.value.query.olcek).toBe('ay')
    expect(app.router.currentRoute.value.query.next).toBeUndefined()
    app.router.back()
    await idle(app.queryClient)
    expect(app.router.currentRoute.value.name).not.toBe('identity.session')
  })

  it('dış ya da mutlak `next` reddedilir: giriş sonrası ana sayfa', async () => {
    for (const bad of ['https://kotu.example/', '//kotu.example', '/oturum']) {
      const app = await bootAnonymous(`/oturum?next=${encodeURIComponent(bad)}`)
      await login()
      await until(() => app.router.currentRoute.value.name === 'home', `ana sayfa (${bad})`)
      expect(app.router.currentRoute.value.fullPath).toBe('/')
      vi.useRealTimers()
      for (const wrapper of mounted.splice(0)) wrapper.unmount()
      teardown()
      await backend.settled()
      backend.reset()
      seedWorld(backend.db)
    }
  })

  it('`next`siz doğrudan `/oturum` ziyareti S0 sayfasında kalır (oturum bilgisi görünür)', async () => {
    const app = await bootAnonymous('/oturum')
    expect(app.router.currentRoute.value.query.next).toBeUndefined()
    await login()
    await until(() => $('[data-testid="session-info"]'), 'oturum bilgisi')
    expect(app.router.currentRoute.value.name).toBe('identity.session')
  })
})
