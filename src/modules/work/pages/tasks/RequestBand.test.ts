import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestBand from './RequestBand.vue'

describe('tarih talebi bandı (E-03-13/14)', () => {
  it('sayı + koordinatörlük adları; bölge etiketi', () => {
    const band = mount(RequestBand, {
      props: { count: 3, departments: ['Eğitim', 'Ulaşım'], canReview: false, complete: true },
    })
    expect(band.get('[role="region"]').attributes('aria-label')).toBe(
      'Bekleyen tarih değişikliği talepleri',
    )
    expect(band.text()).toContain('3 tarih değişikliği talebi onay bekliyor')
    expect(band.text()).toContain('· Eğitim, Ulaşım')
    expect(band.text()).not.toContain('Talepleri incele')
  })

  it('Talepleri incele: yalnız yöneticide, devre dışı + F3 notu, stub yok', () => {
    const band = mount(RequestBand, {
      props: { count: 1, departments: [], canReview: true, complete: true },
    })
    const button = band.get('[data-phase="F3"]')
    expect(button.text()).toBe('Talepleri incele')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toBe('Talepleri incele — F3’te açılacak')
    expect(band.find('[data-design-stub]').exists()).toBe(false)
  })

  it('imleç bitmediyse (kısmi küme) sayının yanında "yüklenen kayıtlar içinde"; bitince yok', async () => {
    const band = mount(RequestBand, {
      props: { count: 2, departments: ['Eğitim'], canReview: false, complete: false },
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
