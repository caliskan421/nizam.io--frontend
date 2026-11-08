import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiCard from './UiCard.vue'

describe('UiCard', () => {
  it('başlık, alt satır ve içerik', () => {
    const card = mount(UiCard, {
      props: { title: 'Bu hafta', meta: 'Kapsamdaki görevler' },
      slots: { default: '<p>içerik</p>' },
    })
    expect(card.element.tagName).toBe('SECTION')
    expect(card.classes()).toEqual(['t-card'])
    expect(card.get('.t-card__title').text()).toBe('Bu hafta')
    expect(card.get('.t-card__meta').text()).toBe('Kapsamdaki görevler')
    expect(card.text()).toContain('içerik')
  })

  it('türler ve etiket; başlıksız kartta başlık öğesi yok', () => {
    for (const variant of ['inset', 'violet', 'gold'] as const) {
      expect(mount(UiCard, { props: { variant } }).classes()).toContain(`t-card--${variant}`)
    }
    const card = mount(UiCard, { props: { as: 'div' } })
    expect(card.element.tagName).toBe('DIV')
    expect(card.find('.t-card__title').exists()).toBe(false)
  })
})
