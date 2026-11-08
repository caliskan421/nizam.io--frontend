import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiAvatar from './UiAvatar.vue'

describe('UiAvatar', () => {
  it('ilk iki sözcüğün baş harfleri, tr-TR büyük harf', () => {
    expect(mount(UiAvatar, { props: { name: 'ilkay ışık yılmaz' } }).text()).toBe('İI')
    expect(mount(UiAvatar, { props: { name: '  Çağrı  ' } }).text()).toBe('Ç')
  })

  it('süs öğesi; boy sınıfları', () => {
    const av = mount(UiAvatar, { props: { name: 'A B' } })
    expect(av.attributes('aria-hidden')).toBe('true')
    expect(av.classes()).toEqual(['rp-av'])
    for (const size of ['sm', 'lg', 'xl'] as const) {
      expect(mount(UiAvatar, { props: { name: 'A', size } }).classes()).toContain(`rp-av--${size}`)
    }
  })
})
