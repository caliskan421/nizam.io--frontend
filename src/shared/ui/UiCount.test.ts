import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiCount from './UiCount.vue'

describe('UiCount', () => {
  it('düz ve parantezli sayaç', () => {
    expect(mount(UiCount, { props: { value: 4 } }).text()).toBe('4')
    const parens = mount(UiCount, { props: { value: 263, parens: true } })
    expect(parens.text()).toBe('(263)')
    expect(parens.classes()).toEqual(['rp-count'])
  })
})
