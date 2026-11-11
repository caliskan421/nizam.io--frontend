import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { createPinia } from 'pinia'
import AgendaMenu from './AgendaMenu.vue'
it('opens with focus and returns to its trigger on Escape', async () => {
  const wrapper = mount(AgendaMenu, {
    props: { id: 'i', title: 'Karar' },
    global: { plugins: [createPinia()] },
    attachTo: document.body,
  })
  const trigger = wrapper.get('[aria-label="Karar işlemleri"]')
  await trigger.trigger('click')
  expect(document.activeElement).toBe(wrapper.get('[role="menuitem"]').element)
  await wrapper.get('[role="menu"]').trigger('keydown.esc')
  expect(document.activeElement).toBe(trigger.element)
  wrapper.unmount()
})
