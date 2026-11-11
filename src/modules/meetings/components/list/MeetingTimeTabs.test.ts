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
      complete: true,
      admin: true,
      deletedCount: 0,
      deletedMore: false,
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
