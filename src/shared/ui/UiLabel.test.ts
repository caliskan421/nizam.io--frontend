import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiLabel from './UiLabel.vue'

describe('UiLabel', () => {
  it('t-label, for bağı ve metin', () => {
    const label = mount(UiLabel, { props: { for: 'x' }, slots: { default: 'Ad' } }).get('label')
    expect(label.classes()).toEqual(['t-label'])
    expect(label.attributes('for')).toBe('x')
    expect(label.text()).toBe('Ad')
  })
})
