import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import MeetingFormFields from './MeetingFormFields.vue'

it('binds date errors to both date inputs', () => {
  const wrapper = mount(MeetingFormFields, {
    props: {
      departmentEdit: false,
      title: 'T',
      date: '2099-01-01',
      time: '10:00',
      today: '2026-01-01',
      dateChanged: true,
      fieldErrors: { meeting_date: 'Hata' },
    },
  })
  for (const input of wrapper.findAll('input[type=date], input[type=time]')) {
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('meeting-date-error')
  }
})
