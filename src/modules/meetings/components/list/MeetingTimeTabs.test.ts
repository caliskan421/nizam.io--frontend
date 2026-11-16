import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import MeetingTimeTabs from './MeetingTimeTabs.vue'
it('uses roving focus and automatic selection for arrows, Home and End', async () => {
  const wrapper = mount(MeetingTimeTabs, {
    attachTo: document.body,
    props: {
      selected: 'yaklasan',
      upcoming: 1,
      past: 2,
      admin: true,
      deleted: 0,
    },
    global: { plugins: [i18n] },
  })
  const tabs = wrapper.findAll('[role=tab]')
  expect(tabs.map((tab) => tab.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
  expect(tabs[0]!.attributes('aria-controls')).toBe('meeting-list-panel')
  await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
  expect(wrapper.emitted('select')?.at(-1)).toEqual(['gecmis'])
  expect(document.activeElement).toBe(tabs[1]!.element)
  await tabs[1]!.trigger('keydown', { key: 'End' })
  expect(wrapper.emitted('select')?.at(-1)).toEqual(['silinenler'])
  expect(document.activeElement).toBe(tabs[2]!.element)
  await tabs[2]!.trigger('keydown', { key: 'Home' })
  expect(wrapper.emitted('select')?.at(-1)).toEqual(['yaklasan'])
  expect(document.activeElement).toBe(tabs[0]!.element)
  await tabs[0]!.trigger('keydown', { key: 'ArrowLeft' })
  expect(wrapper.emitted('select')?.at(-1)).toEqual(['silinenler'])
  expect(document.activeElement).toBe(tabs[2]!.element)
  wrapper.unmount()
})
it('prints exact counts without a plus marker and leaves unread counts empty', () => {
  const wrapper = mount(MeetingTimeTabs, {
    props: { selected: 'gecmis', upcoming: 12, past: 340, admin: true, deleted: null },
    global: { plugins: [i18n] },
  })
  const tabs = wrapper.findAll('[role=tab]').map((tab) => tab.text())
  expect(tabs[0]).toMatch(/12$/)
  expect(tabs[1]).toMatch(/340$/)
  expect(tabs.join()).not.toContain('+')
  expect(tabs[2]).toBe('Silinenler')
})
