import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import NoteFilters from './NoteFilters.vue'
it('shows partial counts and emits the selected filter', async () => {
  const wrapper = mount(NoteFilters, {
    props: { filter: 'all', all: '2+', converted: '1+', mine: '1+' },
  })
  expect(wrapper.text()).toContain('Tümü 2+')
  await wrapper.findAll('button')[1]!.trigger('click')
  expect(wrapper.emitted('change')).toEqual([['converted']])
})
