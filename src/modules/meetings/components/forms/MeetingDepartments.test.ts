import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import MeetingDepartments from './MeetingDepartments.vue'
it('offers owner ordering only for selected departments', async () => {
  const wrapper = mount(MeetingDepartments, {
    props: {
      options: [{ department_id: 'd', display_name: 'Birim' }],
      selected: ['d'],
      single: false,
      label: 'Birimler',
      ownerLabel: 'Sahip',
    },
  })
  await wrapper.get('.meeting-form__owner').trigger('click')
  expect(wrapper.emitted('owner')).toEqual([['d']])
  expect(wrapper.get('.meeting-form__owner').attributes('aria-pressed')).toBe('true')
})

it('renders keyboard-operable selection chips and preserves owner controls', async () => {
  const wrapper = mount(MeetingDepartments, {
    props: {
      options: [
        { department_id: 'd', display_name: 'Birim' },
        { department_id: 'e', display_name: 'Diğer' },
      ],
      selected: ['d'],
      single: false,
      label: 'Birimler',
      ownerLabel: 'Sahip',
    },
  })
  const chip = wrapper.get('button[aria-pressed="false"]')
  expect(chip.text()).toBe('Diğer')
  await chip.trigger('click')
  expect(wrapper.emitted('toggle')).toEqual([['e']])
  expect(wrapper.find('input').exists()).toBe(false)
})
