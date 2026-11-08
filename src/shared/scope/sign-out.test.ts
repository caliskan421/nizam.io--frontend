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

function expectCleared(ctx: Awaited<ReturnType<typeof signedIn>>) {
  expect(ctx.m.http.authSession.token).toBeNull()
  expect(ctx.m.session.useSessionStore().status).toBe('anonymous')
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
    const outcome = await ctx.m.signOut.signOut(ctx.queryClient)
    expect(outcome).toBe('verified')
    expect(ctx.m.signOut.signOutNotice.value).toBe('verified')
    const logout = backend.state.requests.find((r) => r.path === '/v1/auth/logout')
    expect(logout?.headers.get('X-Requested-With')).toBeTruthy()
    expectCleared(ctx)
  })

  it('sunucu hatası → "sunucu çıkışı doğrulanamadı"; sessiz yenileme denenmez', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () =>
        backend.envelope('platform.internal', 500),
      ),
    )
    const ctx = await signedIn()
    const refreshBefore = backend.count('/v1/auth/refresh')
    const outcome = await ctx.m.signOut.signOut(ctx.queryClient)
    expect(outcome).toBe('server_unverified')
    expect(ctx.m.signOut.signOutNotice.value).toBe('server_unverified')
    expect(backend.count('/v1/auth/refresh')).toBe(refreshBefore)
    expectCleared(ctx)

    ctx.m.signOut.acknowledgeSignOutNotice()
    expect(ctx.m.signOut.signOutNotice.value).toBeNull()
  })

  it('ağ hatası → doğrulanamadı', async () => {
    backend.server.use(http.post('http://localhost/v1/auth/logout', () => HttpResponse.error()))
    const ctx = await signedIn()
    expect(await ctx.m.signOut.signOut(ctx.queryClient)).toBe('server_unverified')
    expect(backend.count('/v1/auth/refresh')).toBe(0)
    expectCleared(ctx)
  })

  it('zaman aşımı → doğrulanamadı', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () => new Promise<Response>(() => undefined)),
    )
    const ctx = await signedIn()
    expect(await ctx.m.signOut.signOut(ctx.queryClient, { timeoutMs: 20 })).toBe(
      'server_unverified',
    )
    expectCleared(ctx)
  })
})
