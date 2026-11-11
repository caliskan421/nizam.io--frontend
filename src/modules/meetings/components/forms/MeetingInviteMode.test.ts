import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import MeetingInviteMode from './MeetingInviteMode.vue'
it('changes the selected invitation mode', async () => {
  const wrapper = mount(MeetingInviteMode, { props: { modelValue: 'coordinatorship' } })
  await wrapper.get('input[value=person]').setValue()
  expect(wrapper.emitted('update:modelValue')).toEqual([['person']])
})
