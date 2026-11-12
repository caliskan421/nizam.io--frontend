import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { fixtureRow } from '../__tests__/fixtures'
import { ORIGIN, requests, resetAll, server } from '../__tests__/harness'
import { useLifecycleWrites } from './use-lifecycle-writes'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() =>
  server.use(http.all(`${ORIGIN}/v1/admin/*`, () => HttpResponse.json({ status: 'ok' }))),
)
afterEach(resetAll)
afterAll(() => server.close())

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let writes!: ReturnType<typeof useLifecycleWrites>
  const app = createApp(
    defineComponent({
      setup() {
        writes = useLifecycleWrites()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { writes, app }
}

function currentContext() {
  return { scope: { ...useScopeStore().snapshot }, generation: authSession.generation }
}

describe('yaşam döngüsü gönderici tablosu (tür × eylem)', () => {
  it('sekiz uç, doğru yol ve kapsam; toplantı yazmaları meetings modülünden', async () => {
    const { writes, app } = setup()
    const cases = [
      ['gorev', 'restore', 'PATCH /v1/admin/restore/work-items/x1'],
      ['gorev', 'purge', 'DELETE /v1/admin/permanent/work-items/x1'],
      ['toplanti', 'restore', 'PATCH /v1/admin/restore/meetings/x1'],
      ['toplanti', 'purge', 'DELETE /v1/admin/permanent/meetings/x1'],
      ['koordinatorluk', 'restore', 'PATCH /v1/admin/restore/departments/x1'],
      ['koordinatorluk', 'purge', 'DELETE /v1/admin/permanent/departments/x1'],
      ['kullanici', 'restore', 'PATCH /v1/admin/restore/accounts/x1'],
      ['kullanici', 'purge', 'DELETE /v1/admin/permanent/accounts/x1'],
    ] as const
    for (const [kind, action, expected] of cases) {
      requests.length = 0
      const outcome = await writes.senders[kind][action](
        fixtureRow({ kind, id: 'x1' }),
        currentContext(),
      )
      expect(outcome.kind, expected).toBe('success')
      expect(
        requests.map((r) => `${r.method} ${r.path}`),
        expected,
      ).toEqual([expected])
      expect(requests[0]!.headers.get('X-Nizamio-Program'), expected).toBe(
        kind === 'kullanici' ? null : 'p1',
      )
      expect(requests[0]!.headers.get('Idempotency-Key'), expected).toBeNull()
    }
    expect(writes.pending.value).toBe(false)
    app.unmount()
  })

  it('kapsam eylem bağlamından sonra değişirse istek gönderilmez (scope_changed)', async () => {
    const { writes, app } = setup()
    const stale = {
      scope: { ...useScopeStore().snapshot, programId: 'p0' },
      generation: authSession.generation,
    }
    const outcome = await writes.senders.gorev.restore(fixtureRow(), stale)
    expect(outcome.kind).toBe('scope_changed')
    expect(requests).toHaveLength(0)
    app.unmount()
  })
})
