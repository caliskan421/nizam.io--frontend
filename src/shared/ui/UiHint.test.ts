import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiHint from './UiHint.vue'

describe('UiHint', () => {
  it('açıklama ve hata tonu', () => {
    const hint = mount(UiHint, { props: { id: 'h' }, slots: { default: 'İpucu' } })
    expect(hint.classes()).toEqual(['t-hint'])
    expect(hint.attributes('id')).toBe('h')
    expect(mount(UiHint, { props: { error: true } }).classes()).toContain('t-hint--error')
  })
})
