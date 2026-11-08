import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiStat from './UiStat.vue'

describe('UiStat', () => {
  it('etiket ve değer; yan alan yalnız yuva doluyken', () => {
    const stat = mount(UiStat, { props: { label: 'Açık görev', value: 12 } })
    expect(stat.get('.t-stat__label').text()).toBe('Açık görev')
    expect(stat.get('.t-stat__value').text()).toBe('12')
    expect(stat.find('.t-stat__aside').exists()).toBe(false)
    const withAside = mount(UiStat, {
      props: { label: 'x', value: '0' },
      slots: { aside: '<svg data-test="g" />' },
    })
    expect(withAside.get('.t-stat__aside').find('[data-test="g"]').exists()).toBe(true)
  })
})
