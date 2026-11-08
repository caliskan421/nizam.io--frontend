import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { useTasksUrl } from './use-tasks-url'

afterEach(() => {
  document.body.innerHTML = ''
})

async function setup(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/gorevler', name: 'work.tasks', component: { render: () => null } }],
  })
  await router.push(path)
  const onReset = vi.fn()
  let url!: ReturnType<typeof useTasksUrl>
  const wrapper = mount(
    defineComponent({
      setup() {
        url = useTasksUrl(onReset)
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, router] } },
  )
  return { url, router, store, onReset, wrapper }
}

describe('useTasksUrl', () => {
  it('durum URL’den okunur; süzgeç replace, panel push ile yazılır', async () => {
    const { url, router } = await setup('/gorevler?durum=geciken')
    expect(url.state.value.tab).toBe('geciken')
    await url.update({ search: 'rapor' })
    expect(router.currentRoute.value.query).toEqual({ durum: 'geciken', q: 'rapor' })
    await url.update({ open: 'w1' }, 'push')
    expect(router.currentRoute.value.query).toEqual({ durum: 'geciken', q: 'rapor', gorev: 'w1' })
    expect(url.href({ open: 'w2' })).toBe('/gorevler?durum=geciken&q=rapor&gorev=w2')
    // Geri: panel kapanır (push), arama kalır (replace geçmiş kaydı eklemedi).
    router.back()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(router.currentRoute.value.query).toEqual({ durum: 'geciken', q: 'rapor' })
  })

  it('kapsam değişimi: korunanlar kalır, bellek sıfırlanır; söküldükten sonra dinlemez', async () => {
    const { router, store, onReset, wrapper } = await setup(
      '/gorevler?durum=tamamlandi&q=a&koordinatorluk=d1&gorev=w1&kisi=x',
    )
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    await flushPromises()
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({ durum: 'tamamlandi', q: 'a' })
    wrapper.unmount()
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
