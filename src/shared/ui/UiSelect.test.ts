import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiSelect from './UiSelect.vue'

const options = [
  { value: 'a', label: 'Birinci' },
  { value: 'b', label: 'İkinci', disabled: true },
]

describe('UiSelect', () => {
  it('seçenekler, boş seçenek ve v-model', async () => {
    const wrapper = mount(UiSelect, {
      props: {
        options,
        placeholder: 'Seçin',
        modelValue: '',
        'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }),
      },
    })
    const opts = wrapper.findAll('option')
    expect(opts.map((o) => o.text())).toEqual(['Seçin', 'Birinci', 'İkinci'])
    expect(opts[0]!.attributes('disabled')).toBeDefined()
    expect(opts[2]!.attributes('disabled')).toBeDefined()
    await wrapper.get('select').setValue('a')
    expect(wrapper.props('modelValue')).toBe('a')
    expect(wrapper.get('svg').classes()).toContain('t-field__chevron')
  })

  it('devre dışı ve geçersiz', () => {
    const select = mount(UiSelect, { props: { options, disabled: true, invalid: true } }).get(
      'select',
    )
    expect(select.attributes('disabled')).toBeDefined()
    expect(select.attributes('aria-invalid')).toBe('true')
  })
})
