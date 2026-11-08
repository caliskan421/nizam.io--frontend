import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiTabs from './UiTabs.vue'

const options = [
  { value: 'summary', label: 'Özet' },
  { value: 'subtasks', label: 'Alt görevler', count: 4 },
  { value: 'files', label: 'Dosyalar', count: 0, disabled: true },
  { value: 'notes', label: 'Notlar', count: 0 },
]

function mountTabs(props: Record<string, unknown> = {}) {
  const wrapper = mount(UiTabs<string>, {
    props: {
      options,
      label: 'Görev ayrıntısı',
      modelValue: 'summary',
      'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }),
      ...props,
    },
    slots: { default: '<template #default="{ value }">panel:{{ value }}</template>' },
    attachTo: document.body,
  })
  return wrapper
}

describe('UiTabs', () => {
  it('tablist, aria-selected, gezici tabindex, parantezsiz sayaç ve bağlı panel', () => {
    const wrapper = mountTabs()
    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Görev ayrıntısı')
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((t) => t.attributes('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ])
    expect(tabs.map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    expect(tabs[1]!.text()).toBe('Alt görevler 4')
    const panel = wrapper.get('[role="tabpanel"]')
    expect(panel.attributes('aria-labelledby')).toBe(tabs[0]!.attributes('id'))
    expect(tabs[0]!.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.text()).toBe('panel:summary')
  })

  it('klavye: → seçer ve odaklar, devre dışı sekme atlanır, Home başa döner', async () => {
    const wrapper = mountTabs({ modelValue: 'subtasks' })
    const list = wrapper.get('[role="tablist"]')
    const tabs = wrapper.findAll<HTMLElement>('[role="tab"]').map((t) => t.element)
    tabs[1]!.focus()
    await list.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.props('modelValue')).toBe('notes')
    expect(document.activeElement).toBe(tabs[3])
    await list.trigger('keydown', { key: 'Home' })
    expect(wrapper.props('modelValue')).toBe('summary')
  })

  it('devre dışı sekme tıklanamaz', async () => {
    const wrapper = mountTabs()
    const files = wrapper.findAll('[role="tab"]')[2]!
    expect(files.attributes('disabled')).toBeDefined()
    await files.trigger('click')
    expect(wrapper.props('modelValue')).toBe('summary')
  })
})
