import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiCheck from './UiCheck.vue'

describe('UiCheck', () => {
  it('erişim adı, v-model ve token renkli işaret', async () => {
    const wrapper = mount(UiCheck, {
      props: {
        label: 'ABC-6 seç',
        modelValue: false,
        'onUpdate:modelValue': (v: boolean) => wrapper.setProps({ modelValue: v }),
      },
    })
    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('checkbox')
    expect(input.attributes('aria-label')).toBe('ABC-6 seç')
    await input.setValue(true)
    expect(wrapper.props('modelValue')).toBe(true)
    const mark = wrapper.get('svg')
    expect(mark.classes()).toContain('t-check__mark')
    expect(mark.html()).not.toMatch(/#[0-9a-f]{3,8}/i)
  })

  it('devre dışı', () => {
    const input = mount(UiCheck, { props: { disabled: true } }).get('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})
