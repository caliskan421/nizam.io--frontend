import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import MeetingDepartmentFilter from './MeetingDepartmentFilter.vue'
it('restores trigger focus and clears aria-controls on escape and selection', async () => {
  const wrapper = mount(MeetingDepartmentFilter, {
    attachTo: document.body,
    props: {
      selected: '',
      departments: [{ department_id: 'd', display_name: 'Ekip', code: 'EKP' }],
    },
    global: { plugins: [i18n] },
  })
  const button = wrapper.get('button')
  await button.trigger('click')
  expect(button.attributes('aria-controls')).toBe('meeting-department-menu')
  await wrapper.get('[role=menu]').trigger('keydown', { key: 'Escape' })
  expect(button.attributes('aria-controls')).toBeUndefined()
  expect(document.activeElement).toBe(button.element)
  await button.trigger('click')
  await button.trigger('click')
  expect(document.activeElement).toBe(button.element)
  expect(button.attributes('aria-controls')).toBeUndefined()
  await button.trigger('click')
  const item = wrapper.findAll('[role^=menuitem]').find((el) => el.text() === 'Ekip')!
  await item.trigger('click')
  expect(wrapper.emitted('select')?.[0]).toEqual(['d'])
  expect(document.activeElement).toBe(button.element)
  expect(button.attributes('aria-controls')).toBeUndefined()
  wrapper.unmount()
})
