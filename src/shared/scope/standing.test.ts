import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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
    const queryClient = newQueryClient()
    const { result } = withSetup(() => m.standing.useStanding(), m.pinia, queryClient)
    await nextTick()
    // Etkin sorgu abonelikte eşzamanlı getirmeye başlar; zaman beklemesi gerekmez.
    expect(result.status.value).toBe('idle')
    expect(queryClient.isFetching()).toBe(0)
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

describe('useProgramDepartmentGap (K7 yönetici "departman yok")', () => {
  async function setup(departments: string[] | 'forbidden') {
    const { http } = await import('msw')
    const { ref } = await import('vue')
    const { flushPromises } = await import('@vue/test-utils')
    const handlers = standingHandlers(backend, {
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
      programDepartments: departments === 'forbidden' ? {} : { p1: departments },
    })
    backend.server.use(...handlers)
    if (departments === 'forbidden') {
      backend.server.use(
        http.get('http://localhost/v1/program/departments', () =>
          backend.envelope('program.not_found', 404),
        ),
      )
    }
    const m = await freshModules()
    const queryClient = newQueryClient()
    const ready = ref(false)
    const { result } = withSetup(
      () => m.standing.useProgramDepartmentGap(() => ready.value),
      m.pinia,
      queryClient,
    )
    const store = m.store.useScopeStore()
    const count = () => backend.count('/v1/program/departments')
    return { m, result, ready, store, queryClient, count, flushPromises }
  }

  it('kapsam hazır değilken ya da Admin dışı mercekte istek yok, sonuç "none"', async () => {
    const { result, ready, store, count, flushPromises } = await setup([])
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    await flushPromises()
    expect(result.value).toBe('none')
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    ready.value = true
    await flushPromises()
    expect(result.value).toBe('none')
    expect(count()).toBe(0)
  })

  it('Admin merceği + boş liste → "empty"; kapsamlı anahtar, program başlığı', async () => {
    const { result, ready, store, queryClient, count } = await setup([])
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    ready.value = true
    await vi.waitFor(() => expect(result.value).toBe('empty'))
    expect(count()).toBe(1)
    const { queryKeys } = await import('@/shared/http/query-keys')
    expect(queryClient.getQueryData(queryKeys.departments.all(store.snapshot))).toBeDefined()
    const request = backend.state.requests.find((r) => r.path === '/v1/program/departments')
    expect(request?.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('bağlı departman var → "none"; okuma hatası yanlış açık durum üretmez', async () => {
    const linked = await setup(['d1'])
    linked.store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    linked.ready.value = true
    expect(linked.result.value).toBe('checking')
    await vi.waitFor(() => expect(linked.count()).toBe(1))
    await vi.waitFor(() => expect(linked.result.value).toBe('none'))

    backend.server.resetHandlers()
    backend.reset()
    const failed = await setup('forbidden')
    failed.store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    failed.ready.value = true
    expect(failed.result.value).toBe('checking')
    // 404 bir hükümdür (tekrar yok); hata → "none" (içerik kendi hatasını gösterir).
    await vi.waitFor(() => expect(failed.result.value).toBe('none'))
  })
})
