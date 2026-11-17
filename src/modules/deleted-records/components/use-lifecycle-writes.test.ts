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
  it('dokuz türün on sekiz ucu, doğru yol ve kapsam; toplantı yazmaları meetings modülünden', async () => {
    const { writes, app } = setup()
    const cases = [
      ['tasks', 'work-items'],
      ['meetings', 'meetings'],
      ['departments', 'departments'],
      ['accounts', 'accounts'],
      ['subtasks', 'subtasks'],
      ['files', 'files'],
      ['task_notes', 'task-notes'],
      ['meeting_notes', 'meeting-notes'],
      ['agenda_items', 'agenda-items'],
    ] as const
    for (const [kind, path] of cases) {
      for (const [action, expected] of [
        ['restore', `PATCH /v1/admin/restore/${path}/x1`],
        ['purge', `DELETE /v1/admin/permanent/${path}/x1`],
      ] as const) {
        requests.length = 0
        const outcome = await writes.senders[kind][action](
          fixtureRow({ kind, rawKind: kind, id: 'x1' }),
          currentContext(),
        )
        expect(outcome.kind, expected).toBe('success')
        expect(
          requests.map((r) => `${r.method} ${r.path}`),
          expected,
        ).toEqual([expected])
        expect(requests[0]!.headers.get('X-Nizamio-Program'), expected).toBe(
          kind === 'accounts' ? null : 'p1',
        )
        expect(requests[0]!.headers.get('Idempotency-Key'), expected).toBeNull()
      }
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
    const outcome = await writes.senders.tasks.restore(fixtureRow(), stale)
    expect(outcome.kind).toBe('scope_changed')
    expect(requests).toHaveLength(0)
    app.unmount()
  })
})
