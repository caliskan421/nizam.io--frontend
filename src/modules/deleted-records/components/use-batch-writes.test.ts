import { fixtureRow } from '../__tests__/fixtures'
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
  requests,
  resetAll,
  sent,
  server,
  serverDefaults,
  world,
} from '../__tests__/harness'
import type { DeletedRow } from '../model/types'
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
const POST = (segment: string, action: string) => `/v1/admin/deleted/${segment}/${action}`
const KIND_OF: Record<string, NonNullable<DeletedRow['kind']>> = {
  'work-items': 'tasks',
  meetings: 'meetings',
  departments: 'departments',
  accounts: 'accounts',
  files: 'files',
  subtasks: 'subtasks',
  'task-notes': 'task_notes',
  'meeting-notes': 'meeting_notes',
  'agenda-items': 'agenda_items',
}
const rowsOf = (segment: string, n: number): DeletedRow[] =>
  Array.from({ length: n }, (_, i) =>
    fixtureRow({
      kind: KIND_OF[segment]!,
      rawKind: KIND_OF[segment]!,
      id: `k${i}`,
      key: `${KIND_OF[segment]}:k${i}`,
    }),
  )

describe('useBatchWrites (BE-114)', () => {
  it('250 kayıt 100 + 100 + 50 ardışık istekte; başarılar kind:id anahtarına çevrilip birleşir', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    const result = await writes.run('restore', rowsOf('work-items', 250), ctx())
    const posts = sent(POST('work-items', 'restore'), 'POST')
    expect(posts).toHaveLength(3)
    expect(result.stopped).toBeNull()
    expect(result.run.succeeded).toEqual(rowsOf('work-items', 250).map((row) => row.key))
    app.unmount()
  })

  it('kısmi başarı zarfı birleşir; başarısız kayıt anahtarıyla; işlem anahtarı yok', async () => {
    server.use(...serverDefaults())
    world.itemFailures.set('k1', 'work.not_deleted')
    const { writes, app } = setup()
    const result = await writes.run('purge', rowsOf('work-items', 3), ctx())
    expect(result.run).toEqual({
      succeeded: ['tasks:k0', 'tasks:k2'],
      failed: [{ id: 'tasks:k1', code: 'work.not_deleted' }],
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
    const result = await writes.run('restore', rowsOf('meetings', 250), ctx())
    expect(calls).toBe(2)
    expect(result.run.succeeded).toHaveLength(100)
    expect(result.stopped?.kind).toBe('unknown_outcome')
    app.unmount()
  })

  it('hesap ucu S1: program başlığı yok; diğer türler S2 başlığıyla', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    await writes.run('restore', rowsOf('accounts', 1), ctx())
    await writes.run('purge', rowsOf('departments', 1), ctx())
    expect(
      sent(POST('accounts', 'restore'), 'POST')[0]!.headers.get('X-Nizamio-Program'),
    ).toBeNull()
    expect(sent(POST('departments', 'purge'), 'POST')[0]!.headers.get('X-Nizamio-Program')).toBe(
      'p1',
    )
    app.unmount()
  })

  it('karma seçim türe göre gruplanır: geri yüklemede ebeveyn önce, kalıcı silmede çocuk önce; aynı kimlik iki türde çakışmaz', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    const mixed = [
      fixtureRow({ kind: 'files', rawKind: 'files', id: '7', key: 'files:7' }),
      fixtureRow({ kind: 'tasks', rawKind: 'tasks', id: '7', key: 'tasks:7' }),
      fixtureRow({ kind: 'subtasks', rawKind: 'subtasks', id: '7', key: 'subtasks:7' }),
    ]
    requests.length = 0
    const restored = await writes.run('restore', mixed, ctx())
    expect(requests.filter((r) => r.method === 'POST').map((r) => r.path)).toEqual([
      POST('work-items', 'restore'),
      POST('subtasks', 'restore'),
      POST('files', 'restore'),
    ])
    expect(restored.run.succeeded).toEqual(['tasks:7', 'subtasks:7', 'files:7'])
    requests.length = 0
    await writes.run('purge', mixed, ctx())
    expect(requests.filter((r) => r.method === 'POST').map((r) => r.path)).toEqual([
      POST('files', 'purge'),
      POST('subtasks', 'purge'),
      POST('work-items', 'purge'),
    ])
    app.unmount()
  })

  it('bilinmeyen (kind null) satır hiç gönderilmez', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    requests.length = 0
    const unknown = fixtureRow({
      kind: null,
      rawKind: 'calendar_events',
      id: 'z',
      key: 'calendar_events:z',
    })
    const result = await writes.run('restore', [unknown], ctx())
    expect(requests.filter((r) => r.method === 'POST')).toHaveLength(0)
    expect(result.run).toEqual({ succeeded: [], failed: [] })
    app.unmount()
  })

  it('bağlam bayatlarsa ilk parçadan sonra yeni istek gitmez ve işlenen korunur', async () => {
    server.use(...serverDefaults())
    const { writes, app } = setup()
    const stale = {
      scope: { ...useScopeStore().snapshot, programId: 'p0' },
      generation: authSession.generation,
    }
    const result = await writes.run('restore', rowsOf('work-items', 250), stale)
    expect(result.stopped?.kind).toBe('scope_changed')
    expect(sent(POST('work-items', 'restore'), 'POST')).toHaveLength(0)
    app.unmount()
  })

  it('ilk parça uçuştayken sahip sökülürse sonraki parça gönderilmez; işlenen korunur', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${POST('files', 'purge')}`, async ({ request }) => {
        calls += 1
        const body = (await request.json()) as { ids: string[] }
        if (calls === 1) await gate
        return Response.json({ succeeded: body.ids, failed: [] })
      }),
      ...serverDefaults(),
    )
    const { writes, app } = setup()
    const running = writes.run('purge', rowsOf('files', 250), ctx())
    await vi.waitFor(() => expect(calls).toBe(1))
    app.unmount()
    release()
    const result = await running
    expect(calls).toBe(1)
    expect(result.stopped?.kind).toBe('owner_disposed')
  })
})
