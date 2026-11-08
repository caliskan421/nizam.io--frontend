import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiKbd from './UiKbd.vue'

describe('UiKbd', () => {
  it('kbd öğesi', () => {
    const kbd = mount(UiKbd, { slots: { default: '⌘K' } })
    expect(kbd.element.tagName).toBe('KBD')
    expect(kbd.classes()).toEqual(['t-kbd'])
    expect(kbd.text()).toBe('⌘K')
  })
})
