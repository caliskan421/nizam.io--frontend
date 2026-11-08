import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiInput from './UiInput.vue'

describe('UiInput', () => {
  it('v-model iki yönlü; öznitelikler girişe geçer', async () => {
    const wrapper = mount(UiInput, {
      props: {
        modelValue: 'a',
        'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }),
      },
      attrs: { placeholder: 'Başlık, kimlik veya kişi…', 'aria-label': 'Görev ara' },
    })
    const input = wrapper.get('input')
    expect(input.element.value).toBe('a')
    expect(input.attributes('aria-label')).toBe('Görev ara')
    expect(wrapper.get('.t-field').attributes('aria-label')).toBeUndefined()
    await input.setValue('roket')
    expect(wrapper.props('modelValue')).toBe('roket')
  })

  it('simgeli arama, küçük boy, geçersiz', () => {
    const wrapper = mount(UiInput, {
      props: { type: 'search', icon: 'search', size: 'sm', invalid: true },
    })
    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('search')
    expect(input.classes()).toEqual(expect.arrayContaining(['t-input--icon', 't-input--sm']))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('svg').classes()).toContain('t-field__icon')
  })

  it('devre dışı', () => {
    const input = mount(UiInput, { props: { disabled: true } }).get('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})
