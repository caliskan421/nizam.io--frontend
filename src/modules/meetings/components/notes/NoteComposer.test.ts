import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import NoteComposer from './NoteComposer.vue'
it('counts Unicode characters and prevents empty submissions', async () => {
  const wrapper = mount(NoteComposer, { props: { modelValue: '', busy: false } })
  expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  await wrapper.setProps({ modelValue: '🚀' })
  expect(wrapper.text()).toContain('1 / 5000')
  await wrapper.get('form').trigger('submit')
  expect(wrapper.emitted('submit')).toHaveLength(1)
})
