import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiButton from './UiButton.vue'

describe('UiButton', () => {
  it('varsayılan: ikincil, md, type=button, metin yuvada', () => {
    const button = mount(UiButton, { slots: { default: 'Kaydet' } }).get('button')
    expect(button.classes()).toEqual(['t-btn', 't-btn--secondary'])
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Kaydet')
  })

  it('tür, boy, tam genişlik ve simgeler', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      const button = mount(UiButton, { props: { variant } }).get('button')
      expect(button.classes()).toContain(`t-btn--${variant}`)
    }
    const button = mount(UiButton, {
      props: { variant: 'primary', size: 'sm', block: true, icon: 'plus', iconEnd: 'arrow-right' },
      slots: { default: 'Yeni görev' },
    }).get('button')
    expect(button.classes()).toEqual(expect.arrayContaining(['t-btn--sm', 't-btn--block']))
    expect(button.findAll('svg')).toHaveLength(2)
    expect(mount(UiButton, { props: { size: 'lg' } }).classes()).toContain('t-btn--lg')
  })

  it('devre dışıyken tıklama olayı yayılmaz', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true }, attrs: { onClick: () => {} } })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
