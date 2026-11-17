import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChatFilterTabs from './ChatFilterTabs.vue'

function mountTabs(props: {
  counts: Partial<Record<'all' | 'unread' | 'groups' | 'people', number | null>>
  controls?: string
}) {
  return mount(ChatFilterTabs, {
    props: { modelValue: 'all' as const, ...props },
    attachTo: document.body,
  })
}

describe('ChatFilterTabs', () => {
  it('tablist + dört sekme (Tümü, Okunmamış, Gruplar, Kişiler); yalnız seçili sekme tabindex 0', () => {
    const wrapper = mountTabs({ counts: {} })
    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Konuşma süzgeci')
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((t) => t.text())).toEqual(['Tümü', 'Okunmamış', 'Gruplar', 'Kişiler'])
    expect(tabs.map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    wrapper.unmount()
  })

  it('aria-controls yalnız controls verilince; sayaç counts içinden, yalnız > 0 olanda', () => {
    const none = mountTabs({ counts: { unread: 0 } })
    expect(none.get('[role="tab"]').attributes('aria-controls')).toBeUndefined()
    expect(none.find('.chat-tabs__n').exists()).toBe(false)
    none.unmount()
    const some = mountTabs({ counts: { unread: 5, groups: 12 }, controls: 'liste-1' })
    expect(some.get('[role="tab"]').attributes('aria-controls')).toBe('liste-1')
    expect(some.findAll('.chat-tabs__n')).toHaveLength(2)
    expect(some.get('[data-filter="groups"] .chat-tabs__n').text()).toBe('12')
    expect(some.get('[data-filter="unread"] .chat-tabs__n').text()).toBe('5')
    some.unmount()
  })

  it('tık modeli günceller (update:modelValue)', async () => {
    const wrapper = mountTabs({ counts: {} })
    await wrapper.get('[data-filter="groups"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['groups']])
    wrapper.unmount()
  })
})
