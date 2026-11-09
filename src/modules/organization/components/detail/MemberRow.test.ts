import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MemberRow from './MemberRow.vue'

const member = {
  account_id: 'u1',
  full_name: 'Ayşe Demir',
  membership_id: 'm1',
  role: 'uye',
  status: 'active' as const,
}

function mountRow() {
  return mount(MemberRow, {
    props: { member, canChangeRole: true, canRemove: true, busy: false },
    global: { stubs: { RouterLink: true } },
    attachTo: document.body,
  })
}

describe('MemberRow odak dönüşü (W82a)', () => {
  it('menüden işlem: işlem bitince odak gövdedeyse satır menüsü düğmesine döner', async () => {
    const w = mountRow()
    const trigger = w.get<HTMLButtonElement>('[data-action="row-menu"]')
    await trigger.trigger('click')
    await w.get('[data-action="remove"]').trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
    await w.setProps({ busy: true })
    // Menü öğesi söküldü: odak gövdede.
    expect(document.activeElement).toBe(document.body)
    await w.setProps({ busy: false })
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)
    w.unmount()
  })

  it('odak başka yerdeyse çalınmaz; satırdan başlamayan işlemde odak değişmez', async () => {
    const w = mountRow()
    const other = document.body.appendChild(document.createElement('button'))
    other.focus()
    await w.setProps({ busy: true })
    await w.setProps({ busy: false })
    await flushPromises()
    expect(document.activeElement).toBe(other)
    await w.get('[data-action="row-menu"]').trigger('click')
    await w.get('[data-action="role"]').trigger('click')
    await w.setProps({ busy: true })
    other.focus()
    await w.setProps({ busy: false })
    await flushPromises()
    expect(document.activeElement).toBe(other)
    other.remove()
    w.unmount()
  })
})
