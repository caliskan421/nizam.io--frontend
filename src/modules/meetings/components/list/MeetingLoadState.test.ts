import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import MeetingLoadState from './MeetingLoadState.vue'
it('shows a loading state and a retryable coded error', async () => {
  const wrapper = mount(MeetingLoadState, {
    props: { loading: true, error: null, retrying: false },
    global: { plugins: [i18n] },
  })
  expect(wrapper.attributes('aria-busy')).toBe('true')
  await wrapper.setProps({ loading: false, error: new Error('private server message') })
  expect(wrapper.text()).not.toContain('private server message')
  await wrapper.get('button').trigger('click')
  expect(wrapper.emitted('retry')).toHaveLength(1)
})
