import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import RequestBand from './RequestBand.vue'

const empty = { render: () => null }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/gorevler', name: 'work.tasks', component: empty }],
})
const plugins = { global: { plugins: [router] } }

describe('tarih talebi bandı (E-03-13/14)', () => {
  it('sayı + koordinatörlük adları; bölge etiketi', () => {
    const band = mount(RequestBand, {
      props: { count: 3, departments: ['Eğitim', 'Ulaşım'], canReview: false, complete: true },
      ...plugins,
    })
    expect(band.get('[role="region"]').attributes('aria-label')).toBe(
      'Bekleyen tarih değişikliği talepleri',
    )
    expect(band.text()).toContain('3 tarih değişikliği talebi onay bekliyor')
    expect(band.text()).toContain('· Eğitim, Ulaşım')
    expect(band.text()).not.toContain('Talepleri incele')
  })

  it('Talepleri incele (P20): yalnız yöneticide, canlı; tık E-03-09 talep süzgecini açar, diğer süzgeçler korunur', async () => {
    await router.push('/gorevler?durum=geciken')
    const band = mount(RequestBand, {
      props: { count: 1, departments: [], canReview: true, complete: true },
      ...plugins,
    })
    const button = band.get('[data-testid="request-review"]')
    expect(button.text()).toBe('Talepleri incele')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('data-phase')).toBeUndefined()
    expect(band.find('[data-design-stub]').exists()).toBe(false)
    await button.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/gorevler?durum=geciken&talep=1')
  })

  it('imleç bitmediyse (kısmi küme) sayının yanında "yüklenen kayıtlar içinde"; bitince yok', async () => {
    const band = mount(RequestBand, {
      props: { count: 2, departments: ['Eğitim'], canReview: false, complete: false },
      ...plugins,
    })
    const partial = band.get('[data-testid="request-band-partial"]')
    expect(partial.text()).toBe('· yüklenen kayıtlar içinde')
    expect(band.get('.rp-reqbar__text').text()).toBe(
      '2 tarih değişikliği talebi onay bekliyor · yüklenen kayıtlar içinde · Eğitim',
    )
    await band.setProps({ complete: true })
    expect(band.find('[data-testid="request-band-partial"]').exists()).toBe(false)
    expect(band.text()).not.toContain('yüklenen kayıtlar içinde')
  })
})
