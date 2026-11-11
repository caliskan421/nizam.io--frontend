import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useInstanceStore } from '@/shared/instance/store'

import {
  createFakeLifecycle,
  mountWithScope,
  sideContext,
  type FakeScopeState,
} from '../side/__tests__/fake-lifecycle'
import { UNREAD_NOTIFICATIONS_KEY } from '../side/public'
import AppTopbar from './AppTopbar.vue'

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.dataset.theme = 'dark'
})

async function mountTopbar(
  path = '/oturum',
  state: Partial<FakeScopeState> = {},
  unread: number | null = 0,
) {
  const ctx = await sideContext(path)
  const { lifecycle, store } = createFakeLifecycle(state)
  store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
  if (unread !== null) ctx.queryClient.setQueryData([...UNREAD_NOTIFICATIONS_KEY], unread)
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const wrapper = mountWithScope(ctx, lifecycle, AppTopbar, { openState: null })
  await flushPromises()
  return { ctx, wrapper, fetchSpy, store }
}

describe('üst çubuk', () => {
  it('sıra: [menü, dar ekran] → geri/ileri → konum izi → tema → zil; Asistan/Yardım yok (P2)', async () => {
    const { wrapper } = await mountTopbar()
    const bar = wrapper.get('[data-testid="topbar"]')
    expect(bar.classes()).toContain('rp-topbar')
    const order = bar.element.children
    expect(order[0]?.getAttribute('data-testid')).toBe('topbar-menu')
    expect(order[1]?.getAttribute('aria-label')).toBe('Gezinme geçmişi')
    expect(order[2]?.getAttribute('aria-label')).toBe('Konum')
    expect(order[3]?.getAttribute('data-testid')).toBe('theme-toggle')
    expect(order[4]?.getAttribute('data-testid')).toBe('topbar-bell')
    expect(wrapper.text()).not.toContain('Asistan')
    expect(wrapper.find('[title="Asistana sor"]').exists()).toBe(false)
  })

  it('konum izi: program adı kabuk verisinden (ek istek yok), ana sayfaya bağlantı', async () => {
    const { wrapper, fetchSpy } = await mountTopbar()
    const crumbs = wrapper.get('[data-testid="topbar-crumbs"]')
    const link = crumbs.get('a')
    expect(link.text()).toBe('Program Bir')
    expect(link.attributes('href')).toBe('/')
    expect(crumbs.get('strong').text()).toBe('Oturum')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('toplantı detay derin bağlantısından filtreleri kırıntıyla listeye taşır', async () => {
    const { ctx, wrapper } = await mountTopbar(
      '/toplantilar/m?zaman=gecmis&koordinatorluk=d&from=2026-01-01&to=2026-12-31&notlar=benim',
    )
    const link = wrapper
      .get('[data-testid="topbar-crumbs"]')
      .findAll('a')
      .find((a) => a.text() === 'Toplantılar')!
    await ctx.router.push(link.attributes('href')!)
    expect(ctx.router.currentRoute.value.name).toBe('collaboration.meetings')
    expect(ctx.router.currentRoute.value.query).toEqual({
      zaman: 'gecmis',
      koordinatorluk: 'd',
      from: '2026-01-01',
      to: '2026-12-31',
    })
  })

  it('açık durumda son parça açık durum başlığı', async () => {
    const { wrapper } = await mountTopbar()
    await wrapper.setProps({ openState: 'state.no-program' })
    expect(wrapper.get('[data-testid="topbar-crumbs"] strong').text()).toBe('Program yok')
  })

  it('menü düğmesi kenar menüsünü denetler; tık toggle-nav yayar, durum aria-expanded', async () => {
    const { wrapper } = await mountTopbar()
    const button = wrapper.get('[data-testid="topbar-menu"]')
    expect(button.attributes('aria-controls')).toBe('app-side')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Menü')
    await button.trigger('click')
    expect(wrapper.emitted('toggle-nav')).toHaveLength(1)
    await wrapper.setProps({ navOpen: true })
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  it('ilk açılışta geri ve ileri devre dışı', async () => {
    const { wrapper } = await mountTopbar()
    expect(wrapper.get('[data-testid="topbar-back"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="topbar-forward"]').attributes('disabled')).toBeDefined()
  })

  it('tema düğmesi anlık geçiş: data-theme kökte değişir, iki simge CSS ile seçilir', async () => {
    document.documentElement.dataset.theme = 'dark'
    const { wrapper } = await mountTopbar()
    const button = wrapper.get('[data-testid="theme-toggle"]')
    expect(button.attributes('aria-label')).toBe('Temayı değiştir')
    expect(button.find('.rp-ic-sun').exists()).toBe(true)
    expect(button.find('.rp-ic-moon').exists()).toBe(true)
    await button.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    await button.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('zil: sayaç canlı (nokta + sayılı ad), panel devre dışı', async () => {
    const { wrapper } = await mountTopbar('/oturum', {}, 2)
    const bell = wrapper.get('[data-testid="topbar-bell"]')
    expect(bell.attributes('disabled')).toBeDefined()
    expect(bell.attributes('aria-label')).toBe('Bildirimler, 2 okunmamış')
    expect(bell.find('.topbar-bell__dot').exists()).toBe(true)
  })

  it('zil: okunmamış yoksa nokta yok, ad sayısız', async () => {
    const { wrapper } = await mountTopbar('/oturum', {}, 0)
    const bell = wrapper.get('[data-testid="topbar-bell"]')
    expect(bell.attributes('aria-label')).toBe('Bildirimler')
    expect(bell.find('.topbar-bell__dot').exists()).toBe(false)
  })

  it('tarih yalnız ana sayfada, kurulum saat dilimiyle', async () => {
    const ctx = await sideContext('/oturum')
    // F0'da ana sayfa oturum sayfasına yönlenir; ana sayfa içeriği (F1) bağlanmış gibi kurulur.
    const Empty = { render: () => null }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: Empty },
        { path: '/oturum', name: 'identity.session', component: Empty },
      ],
    })
    await router.push('/oturum')
    const { lifecycle } = createFakeLifecycle()
    useInstanceStore().profile = {
      display_name: 'X',
      brand_color: '#000000',
      timezone: 'Europe/Istanbul',
      api_version: 'v1',
      minimum_mobile_version: '0.0.0',
    }
    const wrapper = mountWithScope({ ...ctx, router }, lifecycle, AppTopbar)
    await flushPromises()
    expect(wrapper.find('[data-testid="topbar-date"]').exists()).toBe(false)
    await router.push('/')
    await flushPromises()
    const date = wrapper.get('[data-testid="topbar-date"]')
    expect(date.text()).toMatch(/^\d{1,2} \S+ \d{4}, \S+$/)
    expect(date.classes()).toContain('rp-kicker')
  })
})
