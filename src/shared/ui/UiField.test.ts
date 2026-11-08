import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import UiCheck from './UiCheck.vue'
import UiField from './UiField.vue'
import UiInput from './UiInput.vue'
import UiSelect from './UiSelect.vue'

function withControl(control: unknown, props: Record<string, unknown>) {
  return mount(
    defineComponent({
      components: { UiField, Control: control as never },
      setup: () => ({ props }),
      template: '<UiField v-bind="props"><Control :options="[]" /></UiField>',
    }),
  )
}

describe('UiField', () => {
  it('etiket denetime bağlanır; açıklama aria-describedby', () => {
    const wrapper = withControl(UiInput, { label: 'Başlık', hint: 'En çok 200 karakter' })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('.t-hint').text()).toBe('En çok 200 karakter')
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('.t-hint').attributes('id'))
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('hata metni açıklamanın yerine geçer ve denetimi geçersiz yapar', () => {
    const wrapper = withControl(UiSelect, { label: 'Durum', hint: 'yardım', error: 'Zorunlu alan' })
    const select = wrapper.get('select')
    expect(wrapper.get('.t-hint--error').text()).toBe('Zorunlu alan')
    expect(wrapper.text()).not.toContain('yardım')
    expect(select.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'))
  })

  it('onay kutusu da alan kimliğini alır; açıklama yoksa bağ yok', () => {
    const wrapper = withControl(UiCheck, { label: 'Kanıt zorunlu' })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBeUndefined()
  })
})
