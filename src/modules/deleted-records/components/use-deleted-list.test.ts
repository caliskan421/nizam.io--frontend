import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, ref } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'

import {
  account,
  department,
  errorEnvelope,
  meeting,
  ORIGIN,
  PATHS,
  resetAll,
  sent,
  server,
  serverDefaults,
  task,
  world,
} from '../__tests__/harness'
import type { DeletedKind } from '../model/kinds'
import { useDeletedList } from './use-deleted-list'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.dictionary = [{ department_id: 'd1', display_name: 'Mekanik' }]
})
afterEach(resetAll)
afterAll(() => server.close())

function setup(initial: DeletedKind, enabled = true) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  useInstanceStore().profile = { timezone: 'Europe/Istanbul' } as NonNullable<
    ReturnType<typeof useInstanceStore>['profile']
  >
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const kind = ref<DeletedKind>(initial)
  const on = ref(enabled)
  let list!: ReturnType<typeof useDeletedList>
  const app = createApp(
    defineComponent({
      setup() {
        list = useDeletedList(kind, on)
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { list, kind, on, client, app }
}

describe('useDeletedList (P42/P43: açık sekme, fan-out yok)', () => {
  it('dört tür tek satır modeline çevrilir; yalnız açık türün ucu çağrılır', async () => {
    world.tasks = [[task('w1')]]
    world.meetings = [[meeting('m1')]]
    world.departments = [[department('d5')]]
    world.accounts = [[account('a1')]]
    const { list, kind, client, app } = setup('gorev')
    await settleQueries(client)
    expect(list.rows.value.map((r) => r.key)).toEqual(['gorev:w1'])
    expect(list.rows.value[0]!.subLine).toBe('Mekanik › Görevler')
    for (const wanted of ['toplanti', 'koordinatorluk', 'kullanici'] as const) {
      kind.value = wanted
      await settleQueries(client)
      expect(list.rows.value.map((r) => r.kind)).toEqual([wanted])
    }
    expect(sent(PATHS.tasks)).toHaveLength(1)
    expect(sent(PATHS.accounts)).toHaveLength(1)
    app.unmount()
  })

  it('enabled=false ise hiçbir uç çağrılmaz', async () => {
    world.tasks = [[task('w1')]]
    const { client, app, list } = setup('gorev', false)
    await settleQueries(client)
    expect(sent(PATHS.tasks)).toHaveLength(0)
    expect(list.rows.value).toEqual([])
    app.unmount()
  })

  it('imleç: hasMore ve fetchMore sonraki sayfayı ekler', async () => {
    world.tasks = [[task('w1')], [task('w2')]]
    const { list, client, app } = setup('gorev')
    await settleQueries(client)
    expect(list.hasMore.value).toBe(true)
    await list.fetchMore()
    expect(list.rows.value.map((r) => r.id)).toEqual(['w1', 'w2'])
    expect(list.hasMore.value).toBe(false)
    app.unmount()
  })

  it('koordinatörlük adı: sözlükte yoksa önbellekteki silinmiş departmanlardan, o da yoksa bilinmeyen', async () => {
    world.tasks = [[task('w1', { department_id: 'd5' }), task('w2', { department_id: 'dx' })]]
    const { list, client, app } = setup('gorev')
    client.setQueryData(queryKeys.deletedDepartments.all(useScopeStore().snapshot), {
      pages: [{ departments: [department('d5', { name: 'Operasyon' })] }],
      pageParams: [undefined],
    })
    await settleQueries(client)
    expect(list.rows.value.map((r) => r.subLine)).toEqual([
      'Operasyon › Görevler',
      'Bilinmeyen koordinatörlük › Görevler',
    ])
    expect(list.departmentName('d1')).toBe('Mekanik')
    expect(list.departmentName('zz')).toBeNull()
    app.unmount()
  })

  it('ilk yükleme hatası: error normalize edilir, satır yok; yenileme sonrası düzelir', async () => {
    server.use(
      http.get(`${ORIGIN}${PATHS.accounts}`, () => errorEnvelope('platform.internal', 500)),
    )
    const { list, client, app } = setup('kullanici')
    await settleQueries(client)
    expect(list.error.value).toMatchObject({ code: 'platform.internal' })
    expect(list.loading.value).toBe(false)
    expect(list.moreFailed.value).toBe(false)
    server.resetHandlers(...serverDefaults())
    world.accounts = [[account('a1')]]
    await list.refetch()
    expect(list.error.value).toBeNull()
    expect(list.rows.value).toHaveLength(1)
    app.unmount()
  })

  it('sonraki sayfa hatası: satırlar korunur, moreFailed', async () => {
    world.tasks = [[task('w1')], [task('w2')]]
    const { list, client, app } = setup('gorev')
    await settleQueries(client)
    server.use(http.get(`${ORIGIN}${PATHS.tasks}`, () => errorEnvelope('platform.internal', 500)))
    await list.fetchMore()
    expect(list.rows.value).toHaveLength(1)
    expect(list.moreFailed.value).toBe(true)
    expect(list.error.value).toBeNull()
    app.unmount()
  })
})
