import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiPlaceholder from './UiPlaceholder.vue'

describe('UiPlaceholder', () => {
  it('nötr metinler: varsayılan "Henüz veri yok", "Yakında"', () => {
    expect(mount(UiPlaceholder).text()).toBe('Henüz veri yok')
    expect(mount(UiPlaceholder, { props: { kind: 'soon' } }).text()).toBe('Yakında')
    expect(mount(UiPlaceholder, { props: { text: 'Henüz işlem geçmişi yok' } }).text()).toBe(
      'Henüz işlem geçmişi yok',
    )
  })

  it('blok ve satır içi biçim; içerik yuvası yok (sahte veri girmez)', () => {
    const block = mount(UiPlaceholder, { slots: { default: 'Ayşe Yılmaz · 12 görev' } })
    expect(block.classes()).toContain('rp-empty')
    expect(block.text()).not.toContain('Ayşe')
    const inline = mount(UiPlaceholder, { props: { inline: true } })
    expect(inline.element.tagName).toBe('SPAN')
    expect(inline.attributes('data-placeholder')).toBeDefined()
  })
})
