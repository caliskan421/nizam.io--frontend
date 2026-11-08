import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createFakeBackend } from '../../../tests/support/fake-backend'
import { freshModules, newQueryClient, row, standingHandlers, withSetup } from './__tests__/harness'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
})
afterAll(() => backend.server.close())

describe('useStanding', () => {
  it('me + me/departments + programlar; kapsamsız anahtarlar; kesilme bayrağı', async () => {
    backend.server.use(
      ...standingHandlers(backend, {
        companyAdmin: false,
        rows: [row('p1', 'd1', 'koordinator'), row('p1', 'd2', 'bilinmeyen')],
        programs: [{ program_id: 'p1', name: 'Bir' }],
        programsTruncated: true,
      }),
    )
    const m = await freshModules()
    const queryClient = newQueryClient()
    const { result } = withSetup(() => m.standing.useStanding(), m.pinia, queryClient)
    expect(result.status.value).toBe('loading')
    await vi.waitFor(() => expect(result.status.value).toBe('ready'))

    expect(result.standing.value?.companyAdmin).toBe(false)
    expect(result.standing.value?.fullName).toBe('Deneme Kişi')
    expect(result.standing.value?.rows.map((r) => r.departmentId)).toEqual(['d1'])
    expect(result.programsTruncated.value).toBe(true)
    expect(result.departmentsTruncated.value).toBe(false)
    expect(queryClient.getQueryData(['me'])).toBeDefined()
    expect(queryClient.getQueryData(['me', 'departments'])).toBeDefined()
    expect(queryClient.getQueryData(['programs'])).toBeDefined()
    expect(m.standing.isStandingKey(['me', 'departments'])).toBe(true)
    expect(m.standing.isStandingKey(['me', 'x'])).toBe(false)
  })

  it('oturum yokken istek atılmaz (idle)', async () => {
    backend.server.use(...standingHandlers(backend, { companyAdmin: true, rows: [], programs: [] }))
    const m = await freshModules()
    await m.session.useSessionStore().logout()
    backend.reset()
    const { result } = withSetup(() => m.standing.useStanding(), m.pinia, newQueryClient())
    await new Promise((r) => setTimeout(r, 20))
    expect(result.status.value).toBe('idle')
    expect(backend.count('/v1/me')).toBe(0)
  })

  it('membership_required (G14) hata değil, sinyaldir; 4xx tekrarlanmaz', async () => {
    backend.server.use(
      ...standingHandlers(backend, {
        companyAdmin: false,
        rows: [],
        programs: 'membership_required',
      }),
    )
    const m = await freshModules()
    const { result } = withSetup(() => m.standing.useStanding(), m.pinia, newQueryClient())
    await vi.waitFor(() => expect(result.status.value).toBe('ready'))
    expect(result.membershipRequired.value).toBe(true)
    expect(result.error.value).toBeNull()
    expect(backend.count('/v1/programs')).toBe(1)
  })

  it('me okunamazsa (503) durum error; normalize hata kodu taşınır', async () => {
    const { http } = await import('msw')
    backend.server.use(
      http.get('http://localhost/v1/me', () => backend.envelope('identity.unavailable', 503)),
      ...standingHandlers(backend, { companyAdmin: true, rows: [], programs: [] }).slice(1),
    )
    const m = await freshModules()
    // Varsayılan istemci: standing kendi tekrar ilkesini uygular (5xx'te en çok iki tekrar).
    const client = new (await import('@tanstack/vue-query')).QueryClient({
      defaultOptions: { queries: { retryDelay: 0 } },
    })
    const { result } = withSetup(() => m.standing.useStanding(), m.pinia, client)
    await vi.waitFor(() => expect(result.status.value).toBe('error'))
    expect((result.error.value as { code: string }).code).toBe('identity.unavailable')
  })
})
