import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'

import { PATHS, resetAll, sent, server, serverDefaults, task, world } from '../__tests__/harness'
import { MAX_AUTO_PAGES, useDeletedView } from './use-deleted-view'

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
  it('URL süzgeci ve yabancı sorgu anahtarları korunur', async () => {
    world.tasks = [[task('w1', { title: 'Motor' }), task('w2', { title: 'Şasi' })]]
    const { view, router, client, app } = await setup('/silinen-kayitlar?q=motor&x=1')
    expect(view.visible.value.map((r) => r.id)).toEqual(['w1'])
    view.update({ q: '' })
    await settleQueries(client)
    expect(router.currentRoute.value.query).toEqual({ x: '1' })
    expect(view.visible.value).toHaveLength(2)
    view.setKind('toplanti')
    await settleQueries(client)
    expect(router.currentRoute.value.query).toEqual({ x: '1', tur: 'toplanti' })
    app.unmount()
  })

  it('sayaç: yükleme sürerken yok; imleç bitince kesin', async () => {
    world.tasks = [[task('w1')], [task('w2')]]
    const { view, client, app } = await setup('/silinen-kayitlar')
    expect(view.count.value).toBe('1+')
    await view.list.fetchMore()
    await settleQueries(client)
    expect(view.count.value).toBe('2')
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

  it('aralık otomatik yükleme tavanı ve dispose sonrası sayaç', async () => {
    expect(MAX_AUTO_PAGES).toBe(5)
    world.tasks = Array.from({ length: 8 }, (_, i) => [
      task(`w${i}`, { deleted_at: '2026-11-12T08:00:00Z' }),
    ])
    const { view, app } = await setup('/silinen-kayitlar?aralik=bugun')
    expect(sent(PATHS.tasks)).toHaveLength(1 + MAX_AUTO_PAGES)
    expect(view.autoLoading.value).toBe(false)
    view.dispose()
    app.unmount()
  })
})
