import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { UiField } from '@/shared/ui'

import FieldTextarea from './FieldTextarea.vue'

describe('FieldTextarea', () => {
  it('UiField bağı (kimlik, aria-invalid, aria-describedby) ve v-model', async () => {
    const value = ref('a')
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(UiField, { label: 'Açıklama', error: 'hata' }, () =>
            h(FieldTextarea, {
              modelValue: value.value,
              'onUpdate:modelValue': (v: string) => (value.value = v),
              name: 'description',
            }),
          ),
      }),
    )
    const area = wrapper.get('textarea')
    expect(area.attributes('aria-invalid')).toBe('true')
    expect(area.attributes('id')).toBe(wrapper.get('label').attributes('for'))
    expect(area.attributes('aria-describedby')).toBeTruthy()
    await area.setValue('yeni')
    expect(value.value).toBe('yeni')
  })
})
