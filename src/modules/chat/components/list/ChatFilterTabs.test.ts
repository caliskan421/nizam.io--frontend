import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChatFilterTabs from './ChatFilterTabs.vue'

function mountTabs(props: { unreadCount: number | null; controls?: string }) {
  return mount(ChatFilterTabs, {
    props: { modelValue: 'all' as const, ...props },
    attachTo: document.body,
  })
}

describe('ChatFilterTabs', () => {
  it('tablist + dört sekme (Tümü, Okunmamış, Gruplar, Kişiler); yalnız seçili sekme tabindex 0', () => {
    const wrapper = mountTabs({ unreadCount: null })
    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Konuşma süzgeci')
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((t) => t.text())).toEqual(['Tümü', 'Okunmamış', 'Gruplar', 'Kişiler'])
    expect(tabs.map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])
    wrapper.unmount()
  })

  it('aria-controls yalnız controls verilince; sayaç yalnız Okunmamış sekmesinde ve > 0', () => {
    const none = mountTabs({ unreadCount: 0 })
    expect(none.get('[role="tab"]').attributes('aria-controls')).toBeUndefined()
    expect(none.find('.chat-tabs__n').exists()).toBe(false)
    none.unmount()
    const some = mountTabs({ unreadCount: 5, controls: 'liste-1' })
    expect(some.get('[role="tab"]').attributes('aria-controls')).toBe('liste-1')
    expect(some.findAll('.chat-tabs__n')).toHaveLength(1)
    expect(some.get('[data-filter="unread"] .chat-tabs__n').text()).toBe('5')
    some.unmount()
  })

  it('tık modeli günceller (update:modelValue)', async () => {
    const wrapper = mountTabs({ unreadCount: null })
    await wrapper.get('[data-filter="groups"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['groups']])
    wrapper.unmount()
  })
})
