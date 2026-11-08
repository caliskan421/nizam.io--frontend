import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import UiMenu from './UiMenu.vue'
import UiMenuItem from './UiMenuItem.vue'

function mountMenu(checked = 'b') {
  return mount(
    defineComponent({
      components: { UiMenu, UiMenuItem },
      emits: ['close'],
      setup: () => ({ checked }),
      template: `
        <UiMenu label="Program seç" @close="(r) => $emit('close', r)">
          <UiMenuItem :checked="checked === 'a'">A</UiMenuItem>
          <UiMenuItem :checked="checked === 'b'">B</UiMenuItem>
          <UiMenuItem disabled :checked="false">C</UiMenuItem>
          <UiMenuItem :checked="checked === 'd'">D</UiMenuItem>
        </UiMenu>`,
    }),
    { attachTo: document.body },
  )
}

describe('UiMenu', () => {
  it('role=menu + erişim adı; açılınca seçili satır odaklanır', () => {
    const wrapper = mountMenu()
    const menu = wrapper.get('[role="menu"]')
    expect(menu.classes()).toContain('rp-pop')
    expect(menu.attributes('aria-label')).toBe('Program seç')
    expect(document.activeElement?.textContent).toContain('B')
  })

  it('seçili yoksa ilk etkin satır odaklanır', () => {
    mountMenu('none')
    expect(document.activeElement?.textContent).toContain('A')
  })

  it('klavye: ↓/↑ gezinir (devre dışı atlanır), Home/End, Esc ve Tab close yayar', async () => {
    const wrapper = mountMenu()
    const menu = wrapper.get('[role="menu"]')
    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('D')
    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('A')
    await menu.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement?.textContent).toContain('D')
    await menu.trigger('keydown', { key: 'Home' })
    expect(document.activeElement?.textContent).toContain('A')
    await menu.trigger('keydown', { key: 'Escape' })
    await menu.trigger('keydown', { key: 'Tab' })
    expect(wrapper.emitted('close')).toEqual([['escape'], ['tab']])
  })
})
