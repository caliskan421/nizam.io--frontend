import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiMenuItem from './UiMenuItem.vue'

describe('UiMenuItem', () => {
  it('düz satır: menuitem, aria-checked yok, menü odağı yönetir', async () => {
    const item = mount(UiMenuItem, { props: { icon: 'copy' }, slots: { default: 'Kopyala' } })
    const button = item.get('button')
    expect(button.attributes('role')).toBe('menuitem')
    expect(button.attributes('aria-checked')).toBeUndefined()
    expect(button.attributes('tabindex')).toBe('-1')
    await button.trigger('click')
    expect(item.emitted('select')).toHaveLength(1)
  })

  it('seçim satırı: menuitemradio, seçiliyken onay işareti', () => {
    const on = mount(UiMenuItem, { props: { checked: true }, slots: { default: 'Admin' } })
    expect(on.attributes('role')).toBe('menuitemradio')
    expect(on.attributes('aria-checked')).toBe('true')
    expect(on.findAll('svg')).toHaveLength(1)
    const off = mount(UiMenuItem, { props: { checked: false } })
    expect(off.attributes('aria-checked')).toBe('false')
    expect(off.find('svg').exists()).toBe(false)
  })

  it('tehlike tonu ve devre dışı', async () => {
    const item = mount(UiMenuItem, { props: { danger: true, disabled: true } })
    expect(item.classes()).toContain('rp-menuitem--danger')
    expect(item.attributes('disabled')).toBeDefined()
    await item.trigger('click')
    expect(item.emitted('select')).toBeUndefined()
  })
})
