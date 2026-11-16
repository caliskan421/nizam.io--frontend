import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import {
  errorEnvelope,
  ORIGIN,
  resetAll,
  sent,
  server,
  serverDefaults,
  world,
} from '../__tests__/harness'
import { useBatchWrites } from './use-batch-writes'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let writes!: ReturnType<typeof useBatchWrites>
  const app = createApp(
    defineComponent({
      setup() {
        writes = useBatchWrites()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { writes, app }
}

const ctx = () => ({ scope: { ...useScopeStore().snapshot }, generation: authSession.generation })
const idsOf = (n: number) => Array.from({ length: n }, (_, i) => `k${i}`)
const POST = (segment: string, action: string) => `/v1/admin/deleted/${segment}/${action}`

describe('useBatchWrites (BE-114)', () => {
  it('250 kimlik 100 + 100 + 50 ardışık istekte; başarılar birleşir; her istek aynı bağlamla', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    const result = await writes.run('gorev', 'restore', idsOf(250), ctx())
    const posts = sent(POST('work-items', 'restore'), 'POST')
    expect(posts).toHaveLength(3)
    expect(result.stopped).toBeNull()
    expect(result.run.succeeded).toEqual(idsOf(250))
    app.unmount()
  })

  it('kısmi başarı zarfı birleşir; işlem anahtarı yok', async () => {
    server.use(...serverDefaults())
    world.itemFailures.set('k1', 'work.not_deleted')
    const { writes, app } = setup()
    const result = await writes.run('gorev', 'purge', ['k0', 'k1', 'k2'], ctx())
    expect(result.run).toEqual({
      succeeded: ['k0', 'k2'],
      failed: [{ id: 'k1', code: 'work.not_deleted' }],
    })
    expect(sent(POST('work-items', 'purge'), 'POST')[0]!.headers.get('Idempotency-Key')).toBeNull()
    app.unmount()
  })

  it('ikinci parça 5xx: döngü durur, birinci parçanın sonucu korunur, üçüncü istek gitmez', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${POST('meetings', 'restore')}`, async ({ request }) => {
        calls += 1
        const body = (await request.json()) as { ids: string[] }
        if (calls === 2) return errorEnvelope('platform.internal', 500)
        return Response.json({ succeeded: body.ids, failed: [] })
      }),
      ...serverDefaults(),
    )
    const { writes, app } = setup()
    const result = await writes.run('toplanti', 'restore', idsOf(250), ctx())
    expect(calls).toBe(2)
    expect(result.run.succeeded).toHaveLength(100)
    expect(result.stopped?.kind).toBe('unknown_outcome')
    app.unmount()
  })

  it('hesap ucu S1: program başlığı yok; diğer türler S2 başlığıyla', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    await writes.run('kullanici', 'restore', ['a1'], ctx())
    await writes.run('koordinatorluk', 'purge', ['d1'], ctx())
    expect(
      sent(POST('accounts', 'restore'), 'POST')[0]!.headers.get('X-Nizamio-Program'),
    ).toBeNull()
    expect(sent(POST('departments', 'purge'), 'POST')[0]!.headers.get('X-Nizamio-Program')).toBe(
      'p1',
    )
    app.unmount()
  })
})
