import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { UiField } from '@/shared/ui'

import FieldNative from './FieldNative.vue'

function host(kind: 'date' | 'textarea', error?: string) {
  const value = ref('')
  const Host = defineComponent({
    setup: () => () =>
      h(UiField, { label: 'Alan', error }, () =>
        h(FieldNative, {
          kind,
          modelValue: value.value,
          'onUpdate:modelValue': (v: string) => (value.value = v),
        }),
      ),
  })
  return { wrapper: mount(Host), value }
}

describe('FieldNative', () => {
  it('gün seçici: UiField kimliği ve etiketi bağlı, değer YYYY-MM-DD', async () => {
    const { wrapper, value } = host('date')
    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('date')
    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    await input.setValue('2026-11-10')
    expect(value.value).toBe('2026-11-10')
  })

  it('çok satırlı metin; hata durumunda aria-invalid + açıklama bağı', () => {
    const { wrapper } = host('textarea', 'Hata')
    const area = wrapper.find('textarea')
    expect(area.classes()).toContain('t-input')
    expect(area.attributes('aria-invalid')).toBe('true')
    expect(area.attributes('aria-describedby')).toBeTruthy()
  })
})
