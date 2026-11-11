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
  await wrapper.get('button').trigger('click')
  expect(wrapper.emitted('owner')).toEqual([['d']])
  expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
})
