import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { cardViews, trackingCounts } from './model'
import TrackingCards from './TrackingCards.vue'

const COUNTS = { total: 9, completed: 0, open: 9, overdue: 4, pending: 2 }

describe('özet kartları (E-05-49…52)', () => {
  it('dört kart, tek aria-pressed, tık seçimi yayar; çubuk doluluğu özel özellikle', async () => {
    const wrapper = mount(TrackingCards, { props: { cards: cardViews(COUNTS), selected: 'acik' } })
    const cards = wrapper.findAll('[data-card]')
    expect(cards.map((c) => c.attributes('data-card'))).toEqual([
      'tamamlanan',
      'acik',
      'geciken',
      'onayda',
    ])
    expect(cards.filter((c) => c.attributes('aria-pressed') === 'true')).toHaveLength(1)
    expect(cards[0]!.attributes('title')).toBe('Tamamlananları göster')
    expect(cards[0]!.find('[data-card-note]').text()).toBe('9 görevin 0’ı bitti')
    expect(cards[2]!.find('[data-card-note]').text()).toBe('Açık görevlerin %44’ü')
    expect(cards[2]!.find('[data-card-value]').classes()).toContain('pt-card__value--danger')
    expect(cards[3]!.find('[data-card-note]').exists()).toBe(false)
    expect(cards[2]!.find('[data-card-bar]').attributes('style')).toContain('--pt-fill: 44%')
    expect(wrapper.find('section').attributes('aria-label')).toBe('Görev özeti')

    await cards[2]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['geciken']])
  })

  it('toplam 0 → "%0" ve nötr not', () => {
    const wrapper = mount(TrackingCards, {
      props: { cards: cardViews(trackingCounts([])), selected: 'acik' },
    })
    expect(wrapper.find('[data-card="tamamlanan"] [data-card-value]').text()).toBe('%0')
    expect(wrapper.find('[data-card="tamamlanan"] [data-card-note]').text()).toBe('Henüz görev yok')
  })

  it('yüklenirken iskelet, düğme yok', () => {
    const wrapper = mount(TrackingCards, { props: { cards: null, selected: 'acik' } })
    expect(wrapper.findAll('[data-card-skeleton]')).toHaveLength(4)
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
