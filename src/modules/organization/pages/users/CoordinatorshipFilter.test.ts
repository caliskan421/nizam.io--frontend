import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CoordinatorshipFilter from './CoordinatorshipFilter.vue'

const departments = [
  { department_id: 'd1', display_name: 'Mekanik' },
  { department_id: 'd2', display_name: 'Fuar' },
]

describe('CoordinatorshipFilter (E-05-08)', () => {
  it('tek seçim; "Tüm koordinatörlükler" süzgeci kaldırır; program yoksa devre dışı', async () => {
    const w = mount(CoordinatorshipFilter, {
      props: { departments, disabled: false, modelValue: null },
      attachTo: document.body,
    })
    await w.get('[data-testid="department-filter"]').trigger('click')
    await w.get('[data-department="d2"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['d2']])
    await w.setProps({ modelValue: 'd2' })
    await w.get('[data-testid="department-filter"]').trigger('click')
    await w.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
    w.unmount()

    const off = mount(CoordinatorshipFilter, {
      props: { departments, disabled: true, modelValue: null },
    })
    expect(off.get('[data-testid="department-filter"]').attributes('disabled')).toBeDefined()
  })
})
