import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeBackend } from '../../../tests/support/fake-backend'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
})
afterAll(() => backend.server.close())

// Depolar modül düzeyindeki tekil oturum nesnesini kullanır; her test taze modül yükler.
async function freshStores() {
  // Önceki testlerin modül örnekleri hâlâ yaşar; gerçek BroadcastChannel üzerinden birbirine
  // "kardeş sekme" gibi görünmesinler diye kanal bu dosyada kapatılır.
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  setActivePinia(createPinia())
  const { useSessionStore } = await import('./store')
  const { useScopeStore } = await import('@/shared/scope/store')
  const { useInstanceStore } = await import('@/shared/instance/store')
  return { session: useSessionStore(), scope: useScopeStore(), instance: useInstanceStore() }
}

describe('oturum deposu', () => {
  beforeEach(() => {
    expect(location.origin).toBe('http://localhost')
  })

  it('açılışta sessiz refresh: çerez geçerliyse oturum döner', async () => {
    const { session } = await freshStores()
    backend.seedAmbientSession()
    expect(session.status).toBe('unknown')
    await session.bootstrap()
    expect(session.status).toBe('authenticated')
    expect(session.accountId).toBe('acc-1')
    expect(backend.count('/v1/auth/refresh')).toBe(1)
  })

  it('açılışta çerez yoksa anonim (oturum sonlandı DEĞİL)', async () => {
    const { session } = await freshStores()
    backend.state.refreshMode = 'unauthorized'
    await session.bootstrap()
    expect(session.status).toBe('anonymous')
  })

  it('açılışta refresh 5xx → unavailable (ended değil); yeniden deneme oturumu döndürür', async () => {
    const { session } = await freshStores()
    backend.seedAmbientSession()
    backend.state.refreshMode = 'server_error'
    await session.bootstrap()
    expect(session.status).toBe('unavailable')

    backend.state.refreshMode = 'ok'
    await session.bootstrap()
    expect(session.status).toBe('authenticated')
  })

  it('açılışta ağ hatası → unavailable', async () => {
    const { session } = await freshStores()
    const { http, HttpResponse } = await import('msw')
    backend.server.use(http.post('http://localhost/v1/auth/refresh', () => HttpResponse.error()))
    await session.bootstrap()
    expect(session.status).toBe('unavailable')
  })

  it('giriş → /v1/me → çıkış: çıkış API çağrısı yapılır ve bellek temizlenir', async () => {
    const { session } = await freshStores()
    await session.login({ email: 'a@example.test', password: 'dogru-parola' })
    expect(session.isAuthenticated).toBe(true)
    const me = await session.loadMe()
    expect(me?.email).toBe('yonetici@example.test')

    await session.logout()
    expect(backend.count('/v1/auth/logout')).toBe(1)
    expect(session.status).toBe('anonymous')
    expect(session.me).toBeNull()
    const { authSession } = await import('@/shared/http')
    expect(authSession.token).toBeNull()
  })

  it('login yanıtındaki force_password_change bayrağı taşınır', async () => {
    const { session } = await freshStores()
    const { http, HttpResponse } = await import('msw')
    backend.server.use(
      http.post('http://localhost/v1/auth/login', () =>
        HttpResponse.json({
          token: 'tok-0000000000000001',
          account_id: 'acc-1',
          expires_at: Math.floor(Date.now() / 1000) + 900,
          force_password_change: true,
        }),
      ),
    )
    await session.login({ email: 'a@example.test', password: 'x' })
    expect(session.forcePasswordChange).toBe(true)
  })
})

describe('kapsam deposu', () => {
  it('program değişince departman sıfırlanır; sorgu anahtarları kapsamla ayrışır', async () => {
    const { scope } = await freshStores()
    scope.setProgram('prg-1')
    scope.setDepartment('dep-1')
    const keyA = scope.queryKey('tasks', { page: 1 })
    scope.setProgram('prg-2')
    expect(scope.departmentId).toBeNull()
    const keyB = scope.queryKey('tasks', { page: 1 })
    expect(keyA).not.toEqual(keyB)
    expect(keyA[1]).toEqual({ program: 'prg-1', department: 'dep-1' })
    expect(keyB[1]).toEqual({ program: 'prg-2', department: null })
  })

  it('program seçilmeden departman seçilemez (örtük kapsam yok)', async () => {
    const { scope } = await freshStores()
    expect(() => scope.setDepartment('dep-1')).toThrow()
  })
})

describe('kurulum profili / API sürümü', () => {
  it('desteklenen sürüm → ready', async () => {
    const { instance } = await freshStores()
    expect(await instance.load()).toBe('ready')
    expect(instance.profile?.display_name).toBe('Deneme A.Ş.')
  })

  it('desteklenmeyen api_version → update_required (sessiz düşüş yok)', async () => {
    const { instance } = await freshStores()
    const { http, HttpResponse } = await import('msw')
    backend.server.use(
      http.get('http://localhost/v1/instance/profile', () =>
        HttpResponse.json({
          display_name: 'X',
          brand_color: '#000000',
          timezone: 'UTC',
          api_version: 'v2',
          minimum_mobile_version: '0.0.0',
        }),
      ),
    )
    expect(await instance.load()).toBe('update_required')
    expect(instance.error?.code).toBe('client.unsupported_api_version')
  })
})
