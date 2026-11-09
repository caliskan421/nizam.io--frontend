import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { until } from '@/shared/http/__tests__/settle'

import UiNavItem from './UiNavItem.vue'

async function routerAt(path: string) {
  const component = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component },
      { path: '/gorevler', name: 'tasks', component },
    ],
  })
  await router.push(path)
  return router
}

function mountItem(router: Awaited<ReturnType<typeof routerAt>>, props: Record<string, unknown>) {
  return mount(UiNavItem, {
    props: { to: { name: 'tasks' }, label: 'Görevler', icon: 'tasks', ...props },
    slots: { default: '<span class="badge">3</span>' },
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('UiNavItem', () => {
  it('bağlantı; aria-current yalnız etkin öğede', async () => {
    const router = await routerAt('/gorevler')
    const active = mountItem(router, {}).get('a')
    expect(active.attributes('href')).toBe('/gorevler')
    expect(active.attributes('aria-current')).toBe('page')
    expect(active.text()).toContain('Görevler')
    const home = mountItem(router, { to: { name: 'home' }, label: 'Ana sayfa' }).get('a')
    expect(home.attributes('aria-current')).toBeUndefined()
  })

  it('active verilirse rota eşleşmesinin yerine geçer', async () => {
    const router = await routerAt('/')
    expect(mountItem(router, { active: true }).get('a').attributes('aria-current')).toBe('page')
  })

  it('klavye: sekmeyle odaklanır, etkinleştirince rotaya gider', async () => {
    const router = await routerAt('/')
    const link = mountItem(router, {}).get('a')
    ;(link.element as HTMLElement).focus()
    expect(document.activeElement).toBe(link.element)
    await link.trigger('click')
    // Koşul tabanlı: gezinme tamamlanınca (rota sonrası kancası) hedefte.
    await until(
      () => router.currentRoute.value.name === 'tasks',
      (notify) => router.afterEach(notify),
    )
    expect(router.currentRoute.value.name).toBe('tasks')
  })

  it('dar menü: yalnız simge, ad aria-label + title, rozet yok', async () => {
    const router = await routerAt('/')
    const link = mountItem(router, { rail: true }).get('a')
    expect(link.attributes('aria-label')).toBe('Görevler')
    expect(link.attributes('title')).toBe('Görevler')
    expect(link.find('.t-nav__label').exists()).toBe(false)
    expect(link.find('.badge').exists()).toBe(false)
  })

  it('devre dışı: bağlantısız, odaklanamaz, aria-disabled', async () => {
    const router = await routerAt('/')
    const link = mountItem(router, { disabled: true }).get('a')
    expect(link.attributes('href')).toBeUndefined()
    expect(link.attributes('aria-disabled')).toBe('true')
    ;(link.element as HTMLElement).focus()
    expect(document.activeElement).not.toBe(link.element)
    await link.trigger('click')
    expect(router.currentRoute.value.name).toBe('home')
  })
})
