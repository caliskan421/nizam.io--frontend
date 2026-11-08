import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { createFakeBackend } from '../../../tests/support/fake-backend'
import { freshModules, newQueryClient } from './__tests__/harness'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
})
afterAll(() => backend.server.close())

async function signedIn() {
  const m = await freshModules()
  const prefs = m.preferences.preferences
  prefs.write('scope.programId', 'p1')
  prefs.write('scope.lens', 'member')
  prefs.write('scope.departmentId', 'd1')
  prefs.write('ui.theme', 'light')
  const store = m.store.useScopeStore()
  store.commit({ programId: 'p1', lens: 'member', departmentId: 'd1' })
  const queryClient = newQueryClient()
  queryClient.setQueryData(['me'], { account_id: 'acc-1' })
  queryClient.setQueryData(m.scope.scopedKey(store.snapshot, 'work-items'), [1])
  return { m, prefs, store, queryClient }
}

function expectCleared(ctx: Awaited<ReturnType<typeof signedIn>>, unverified: boolean) {
  expect(ctx.m.http.authSession.token).toBeNull()
  const session = ctx.m.session.useSessionStore()
  expect(session.status).toBe('anonymous')
  expect(session.serverLogoutUnverified).toBe(unverified)
  expect(session.me).toBeNull()
  expect(ctx.store.snapshot).toEqual({ programId: null, lens: null, departmentId: null })
  expect(ctx.queryClient.getQueryCache().getAll()).toEqual([])
  expect(ctx.prefs.read('scope.programId')).toBeNull()
  expect(ctx.prefs.read('scope.lens')).toBeNull()
  expect(ctx.prefs.read('scope.departmentId')).toBeNull()
  expect(ctx.prefs.read('ui.theme')).toBe('light')
}

describe('çıkış (E-00-29, ortak-kurallar §8)', () => {
  it('204 → doğrulandı; X-Requested-With gider; bellek, önbellek ve scope.* temizlenir', async () => {
    const ctx = await signedIn()
    const outcome = await ctx.m.session.useSessionStore().logout(ctx.queryClient)
    expect(outcome).toBe('verified')
    const logout = backend.state.requests.find((r) => r.path === '/v1/auth/logout')
    expect(logout?.headers.get('X-Requested-With')).toBeTruthy()
    expectCleared(ctx, false)
  })

  it('sunucu hatası → "sunucu çıkışı doğrulanamadı"; sessiz yenileme denenmez', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () =>
        backend.envelope('platform.internal', 500),
      ),
    )
    const ctx = await signedIn()
    const refreshBefore = backend.count('/v1/auth/refresh')
    const outcome = await ctx.m.session.useSessionStore().logout(ctx.queryClient)
    expect(outcome).toBe('server_unverified')
    expect(backend.count('/v1/auth/refresh')).toBe(refreshBefore)
    expectCleared(ctx, true)
  })

  it('doğrulanamadı → 401 sonrası refresh yok, açılış bootstrap yok; açık giriş normale döndürür', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () =>
        backend.envelope('platform.internal', 500),
      ),
    )
    const ctx = await signedIn()
    const session = ctx.m.session.useSessionStore()
    // Çerez sunucuda hâlâ geçerli (çıkış doğrulanmadı): sessiz yenileme olsaydı oturum dönerdi.
    backend.seedAmbientSession()
    await session.logout(ctx.queryClient)
    const refreshBefore = backend.count('/v1/auth/refresh')

    const me = await ctx.m.http.api.GET('/v1/me')
    expect(me.response.status).toBe(401)
    await session.bootstrap()
    expect(backend.count('/v1/auth/refresh')).toBe(refreshBefore)
    expect(session.status).toBe('anonymous')
    expect(session.serverLogoutUnverified).toBe(true)

    // Kardeş sekmeden gelen belirteç de kabul edilmez (yalnız açık giriş).
    expect(await ctx.m.http.authSession.refresh(null)).toBe('ended')
    expect(backend.count('/v1/auth/refresh')).toBe(refreshBefore)

    await session.login({ email: 'kisi@example.test', password: 'dogru-parola' })
    expect(session.status).toBe('authenticated')
    expect(session.serverLogoutUnverified).toBe(false)
    backend.expireAccess()
    const again = await ctx.m.http.api.GET('/v1/me')
    expect(again.response.status).toBe(200)
    expect(backend.count('/v1/auth/refresh')).toBe(refreshBefore + 1)
  })

  it('ağ hatası → doğrulanamadı', async () => {
    backend.server.use(http.post('http://localhost/v1/auth/logout', () => HttpResponse.error()))
    const ctx = await signedIn()
    expect(await ctx.m.signOut.signOut(ctx.queryClient)).toBe('server_unverified')
    expect(backend.count('/v1/auth/refresh')).toBe(0)
    expectCleared(ctx, true)
  })

  it('zaman aşımı → doğrulanamadı', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () => new Promise<Response>(() => undefined)),
    )
    const ctx = await signedIn()
    expect(await ctx.m.signOut.signOut(ctx.queryClient, { timeoutMs: 20 })).toBe(
      'server_unverified',
    )
    expectCleared(ctx, true)
  })
})
