import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, type App } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { useTimelineUrl } from './use-timeline-url'

const apps: App[] = []

async function setup(path: string, onReset = vi.fn()) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const empty = { render: () => null }
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/zaman-cizelgesi', name: 'work.timeline', component: empty }],
  })
  await router.push(path)
  let api!: ReturnType<typeof useTimelineUrl>
  const app = createApp(
    defineComponent({
      setup() {
        api = useTimelineUrl(onReset)
        return () => h('div')
      },
    }),
  )
  app.use(pinia).use(router)
  app.mount(document.createElement('div'))
  apps.push(app)
  return { api, router, store, onReset }
}

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
})

describe('zaman çizelgesi URL durumu (K10)', () => {
  it('rota sorgusundan okur; güncelleme varsayılanları yazmaz', async () => {
    const { api, router } = await setup('/zaman-cizelgesi?olcek=gun&secili=w1')
    expect(api.state.value).toMatchObject({ scale: 'gun', selected: 'w1', status: 'tumu' })
    await api.update({ scale: 'hafta', selected: null, status: 'biten' })
    expect(router.currentRoute.value.query).toEqual({ durum: 'biten' })
  })

  it('süzgeç değişimi replace, seçim push (geri tuşu paneli kapatır)', async () => {
    const { api, router } = await setup('/zaman-cizelgesi')
    await api.update({ status: 'acik' })
    await api.update({ selected: 'w1' }, 'push')
    expect(router.currentRoute.value.query).toEqual({ durum: 'acik', secili: 'w1' })
    router.back()
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ durum: 'acik' })
  })

  it('kapsam değişince onReset çağrılır; departman ve seçim düşer, ölçek/durum/altgörev kalır', async () => {
    const { router, store, onReset } = await setup(
      '/zaman-cizelgesi?departman=d1&secili=w1&olcek=ay&durum=geciken',
    )
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({ olcek: 'ay', durum: 'geciken' })
  })

  it('sökülünce kapsam dinleyicisi kalmaz', async () => {
    const { store, onReset } = await setup('/zaman-cizelgesi')
    for (const app of apps.splice(0)) app.unmount()
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    expect(onReset).not.toHaveBeenCalled()
  })
})
