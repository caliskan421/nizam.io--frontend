import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiSegmented from './UiSegmented.vue'

const options = [
  { value: 'all', label: 'Tümü', count: 263 },
  { value: 'todo', label: 'Başlamadı', count: 57 },
  { value: 'done', label: 'Tamamlanan' },
]

function mountSeg(props: Record<string, unknown> = {}) {
  const wrapper = mount(UiSegmented<string>, {
    props: {
      options,
      label: 'Kayıtlı görünümler',
      modelValue: 'all',
      'onUpdate:modelValue': (v: string | null) => wrapper.setProps({ modelValue: v }),
      ...props,
    },
    attachTo: document.body,
  })
  return wrapper
}

describe('UiSegmented', () => {
  it('rp-seg grubu, aria-pressed ve parantezli sayaç', () => {
    const wrapper = mountSeg()
    const group = wrapper.get('.rp-seg')
    expect(group.attributes('role')).toBe('group')
    expect(group.attributes('aria-label')).toBe('Kayıtlı görünümler')
    const buttons = wrapper.findAll('button')
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    expect(buttons[0]!.text()).toBe('Tümü (263)')
  })

  it('tıklama seçer; allowEmpty iken basılıya basmak seçimi kaldırır', async () => {
    const wrapper = mountSeg()
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.props('modelValue')).toBe('todo')
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.props('modelValue')).toBe('todo')
    await wrapper.setProps({ allowEmpty: true })
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.props('modelValue')).toBeNull()
  })

  it('klavye: ok tuşları ve Home/End odağı taşır', async () => {
    const wrapper = mountSeg()
    const buttons = wrapper.findAll('button').map((b) => b.element)
    buttons[0]!.focus()
    await wrapper.get('.rp-seg').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[1])
    await wrapper.get('.rp-seg').trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(buttons[2])
    await wrapper.get('.rp-seg').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[0])
  })

  it('devre dışı: bütün düğmeler kapalı, seçim değişmez', async () => {
    const wrapper = mountSeg({ disabled: true })
    for (const b of wrapper.findAll('button')) expect(b.attributes('disabled')).toBeDefined()
    await wrapper.findAll('button')[2]!.trigger('click')
    expect(wrapper.props('modelValue')).toBe('all')
  })
})
