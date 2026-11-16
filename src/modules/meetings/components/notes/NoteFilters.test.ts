import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import NoteFilters from './NoteFilters.vue'
it('shows exact server counts and emits the selected filter', async () => {
  const wrapper = mount(NoteFilters, {
    props: { filter: 'all', all: 2, converted: 1, mine: 0 },
  })
  expect(wrapper.text()).toContain('Tümü 2')
  expect(wrapper.text()).toContain('0')
  expect(wrapper.text()).not.toContain('+')
  await wrapper.findAll('button')[1]!.trigger('click')
  expect(wrapper.emitted('change')).toEqual([['converted']])
})
it('leaves counts empty until the server sends them', () => {
  const wrapper = mount(NoteFilters, {
    props: { filter: 'all', all: null, converted: null, mine: null },
  })
  expect(wrapper.get('h2').text()).toBe('Notlar')
})
