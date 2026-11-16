import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'

import {
  meeting,
  PATHS,
  resetAll,
  sent,
  server,
  serverDefaults,
  task,
  world,
} from '../__tests__/harness'
import { useDeletedView } from './use-deleted-view'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-12T12:00:00Z') })
  server.use(...serverDefaults())
})
afterEach(() => {
  vi.useRealTimers()
  resetAll()
})
afterAll(() => server.close())

async function setup(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/silinen-kayitlar', name: 'deleted-records.list', component: empty }],
  })
  await router.push(path)
  let view!: ReturnType<typeof useDeletedView>
  const app = createApp(
    defineComponent({
      setup() {
        view = useDeletedView(() => true)
        return () => null
      },
    }),
  )
  app
    .use(pinia)
    .use(router)
    .use(VueQueryPlugin, { queryClient: client })
    .mount(document.createElement('div'))
  await settleQueries(client)
  return { view, router, client, app }
}

describe('useDeletedView', () => {
  it('URL süzgeci sunucuya gider; yabancı sorgu anahtarları korunur', async () => {
    world.tasks = [[task('w1', { title: 'Motor' }), task('w2', { title: 'Şasi' })]]
    const { view, router, client, app } = await setup('/silinen-kayitlar?q=motor&x=1')
    expect(sent(PATHS.tasks).at(-1)!.query.get('q')).toBe('motor')
    expect(view.list.rows.value.map((r) => r.id)).toEqual(['w1'])
    view.update({ q: '' })
    await settleQueries(client)
    expect(router.currentRoute.value.query).toEqual({ x: '1' })
    expect(view.list.rows.value).toHaveLength(2)
    view.setKind('toplanti')
    await settleQueries(client)
    expect(router.currentRoute.value.query).toEqual({ x: '1', tur: 'toplanti' })
    app.unmount()
  })

  it('aralık sunucu deleted_from olarak gider (kurulum günü başı); sayfa yükleme döngüsü yok', async () => {
    world.tasks = [[task('w1')], [task('w2')], [task('w3')]]
    const { view, app } = await setup('/silinen-kayitlar?aralik=bugun')
    const only = sent(PATHS.tasks)
    // 2026-11-12 12:00Z = Istanbul 15:00; gün başı 11 Kasım 21:00Z.
    expect(only).toHaveLength(1)
    expect(only[0]!.query.get('deleted_from')).toBe('2026-11-11T21:00:00Z')
    expect(view.list.hasMore.value).toBe(true)
    view.dispose()
    app.unmount()
  })

  it('sıralama başlığı: ilk tık ters yön, ikinci tık geri; tür değişince varsayılan', async () => {
    world.tasks = [[task('w1', { title: 'B' }), task('w2', { title: 'A' })]]
    const { view, client, app } = await setup('/silinen-kayitlar')
    view.setSort('name')
    await settleQueries(client)
    let last = sent(PATHS.tasks).at(-1)!.query
    expect([last.get('sort'), last.get('order')]).toEqual(['name', 'asc'])
    expect(view.list.rows.value.map((r) => r.title)).toEqual(['A', 'B'])
    view.setSort('name')
    await settleQueries(client)
    last = sent(PATHS.tasks).at(-1)!.query
    expect([last.get('sort'), last.get('order')]).toEqual(['name', 'desc'])
    view.setKind('toplanti')
    expect(view.sort.value).toEqual({ key: 'deleted_at', order: 'desc' })
    app.unmount()
  })

  it('seçili kayıt yüklenen kümeden; olmayan kayıt null', async () => {
    world.tasks = [[task('w1')]]
    const a = await setup('/silinen-kayitlar?kayit=w1')
    expect(a.view.selected.value?.id).toBe('w1')
    a.app.unmount()
    const b = await setup('/silinen-kayitlar?kayit=yok')
    expect(b.view.selected.value).toBeNull()
    b.app.unmount()
  })

  it('süzgeç adayları birikir: arama silenleri daraltsa da seçenekler kaybolmaz', async () => {
    world.meetings = [
      [
        meeting('m1', { title: 'Fuar', deleted_by: { account_id: 'a7', full_name: 'Reha Koçak' } }),
        meeting('m2', { title: 'Yemek', deleted_by: { account_id: 'a8', full_name: 'Ali Avcı' } }),
      ],
    ]
    const { view, client, app } = await setup('/silinen-kayitlar?tur=toplanti')
    expect(view.candidates.actors.value.map((a) => a.name)).toEqual(['Reha Koçak', 'Ali Avcı'])
    view.update({ q: 'fuar' })
    await settleQueries(client)
    expect(view.list.rows.value).toHaveLength(1)
    expect(view.candidates.actors.value.map((a) => a.name)).toEqual(['Reha Koçak', 'Ali Avcı'])
    app.unmount()
  })
})
