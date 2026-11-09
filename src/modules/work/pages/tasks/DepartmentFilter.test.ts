import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DepartmentFilter from './DepartmentFilter.vue'

const departments = [
  { department_id: 'd1', display_name: 'Mekanik' },
  { department_id: 'd2', display_name: 'İdari işler' },
]

function mountFilter(modelValue: string | null = null) {
  return mount(DepartmentFilter, {
    props: { modelValue, departments },
    attachTo: document.body,
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('koordinatörlük süzgeci (E-03-12, K3 tek seçim)', () => {
  it('rozet yalnız 0/1', () => {
    expect(mountFilter().get('[data-testid="department-filter"]').text()).toBe('Koordinatörlük')
    const set = mountFilter('d2').get('[data-testid="department-filter"]')
    expect(set.text()).toBe('Koordinatörlük 1')
    expect(set.attributes('title')).toBe('İdari işler')
  })

  it('menü: Tümü + departmanlar, tek seçim (menuitemradio); seçim kapatır', async () => {
    const filter = mountFilter('d1')
    const trigger = filter.get('[data-testid="department-filter"]')
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    const items = filter.findAll('[role="menuitemradio"]')
    expect(items.map((i) => i.text())).toEqual(['Tüm koordinatörlükler', 'Mekanik', 'İdari işler'])
    expect(items[1]!.attributes('aria-checked')).toBe('true')
    await items[2]!.trigger('click')
    expect(filter.emitted('update:modelValue')).toEqual([['d2']])
    expect(filter.find('[role="menu"]').exists()).toBe(false)
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('Tümü seçimi null; Esc ve dış tıklama kapatır', async () => {
    const filter = mountFilter('d1')
    const trigger = filter.get('[data-testid="department-filter"]')
    await trigger.trigger('click')
    await filter.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(filter.emitted('update:modelValue')).toEqual([[null]])

    await trigger.trigger('click')
    await filter.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(filter.find('[role="menu"]').exists()).toBe(false)

    await trigger.trigger('click')
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(filter.find('[role="menu"]').exists()).toBe(false)
  })
})
