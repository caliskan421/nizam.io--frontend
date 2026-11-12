import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import FilterMenu from './FilterMenu.vue'

const OPTIONS = [
  { value: null, label: 'Tümü' },
  { value: 'a', label: 'A birimi' },
  { value: 'b', label: 'B birimi' },
] as const

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(FilterMenu, {
    props: {
      label: 'Koordinatörlük',
      trigger: 'Koordinatörlük',
      options: OPTIONS,
      modelValue: null,
      ...props,
    },
    attachTo: document.body,
  })
}
const trigger = (wrapper: ReturnType<typeof mountMenu>) =>
  wrapper.get('button[aria-haspopup="menu"]')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('FilterMenu', () => {
  it('kapalıyken aria-controls verilmez; açılınca menüye bağlanır', async () => {
    const wrapper = mountMenu()
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
    expect(trigger(wrapper).attributes('aria-controls')).toBeUndefined()
    await trigger(wrapper).trigger('click')
    const menu = wrapper.get('[role="menu"]')
    expect(trigger(wrapper).attributes('aria-controls')).toBe(menu.attributes('id'))
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    expect(
      wrapper.findAll('[role="menuitemradio"]').map((i) => i.attributes('aria-checked')),
    ).toEqual(['true', 'false', 'false'])
    wrapper.unmount()
  })

  it('seçim: değer yayılır, menü kapanır, odak tetikleyiciye döner', async () => {
    const wrapper = mountMenu()
    await trigger(wrapper).trigger('click')
    await wrapper.findAll('[role="menuitemradio"]')[1]!.trigger('click')
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['a']])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(wrapper).element)
    expect(trigger(wrapper).attributes('aria-controls')).toBeUndefined()
    wrapper.unmount()
  })

  it('Esc: kapanır ve odak tetikleyiciye döner', async () => {
    const wrapper = mountMenu()
    await trigger(wrapper).trigger('click')
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await nextTick()
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(wrapper).element)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('Tab ve dış tıklama kapatır, odağı çalmaz', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const wrapper = mountMenu()
    await trigger(wrapper).trigger('click')
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Tab' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    await trigger(wrapper).trigger('click')
    outside.focus()
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(outside)
    wrapper.unmount()
  })

  it('devre dışıyken tetikleyici kilitli ve ipucu verir; açıkken devre dışı olunca kapanır', async () => {
    const wrapper = mountMenu({ disabled: true, hint: 'Bu türde yok.' })
    expect(trigger(wrapper).attributes('disabled')).toBeDefined()
    expect(trigger(wrapper).attributes('title')).toBe('Bu türde yok.')
    await wrapper.setProps({ disabled: false })
    await trigger(wrapper).trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
