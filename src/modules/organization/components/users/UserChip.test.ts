import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserChip from './UserChip.vue'

const base = {
  name: 'Mekanik',
  role: 'member' as const,
  canChangeRole: true,
  canRemove: true,
  busy: false,
}

describe('UserChip (E-05-32)', () => {
  it('rol menüsü: aynı rol seçilirse olay yok, farklı rol changeRole', async () => {
    const w = mount(UserChip, { props: base, attachTo: document.body })
    await w.get('[data-testid="chip-role"]').trigger('click')
    await w.get('[data-chip-role="member"]').trigger('click')
    expect(w.emitted('changeRole')).toBeUndefined()
    await w.get('[data-testid="chip-role"]').trigger('click')
    await w.get('[data-chip-role="coordinator"]').trigger('click')
    expect(w.emitted('changeRole')).toEqual([['coordinator']])
    await w.get('[data-testid="chip-remove"]').trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
    w.unmount()
  })

  it('yetki yoksa rol salt metin ve X yok; işlem sürerken düğmeler kapalı', () => {
    const ro = mount(UserChip, { props: { ...base, canChangeRole: false, canRemove: false } })
    expect(ro.find('[data-testid="chip-role"]').exists()).toBe(false)
    expect(ro.get('[data-testid="chip-role-static"]').text()).toBe('Üye')
    expect(ro.find('[data-testid="chip-remove"]').exists()).toBe(false)
    const busy = mount(UserChip, { props: { ...base, busy: true } })
    expect(busy.get('[data-testid="chip-remove"]').attributes('disabled')).toBeDefined()
    expect(busy.get('[data-testid="chip-role"]').attributes('disabled')).toBeDefined()
  })

  it('W82a odak dönüşü: işlem bitince odak gövdeye düştüyse başlatan düğmeye döner', async () => {
    const w = mount(UserChip, { props: base, attachTo: document.body })
    const remove = w.get<HTMLButtonElement>('[data-testid="chip-remove"]').element
    remove.focus()
    await w.get('[data-testid="chip-remove"]').trigger('click')
    await w.setProps({ busy: true })
    // Onay penceresi (odak onun içindeydi) kapandı ve odağı kapalı düğmeye veremedi: gövdeye düştü.
    const dialog = document.body.appendChild(document.createElement('button'))
    dialog.focus()
    dialog.remove()
    expect(document.activeElement).toBe(document.body)
    await w.setProps({ busy: false })
    await flushPromises()
    expect(document.activeElement).toBe(remove)
    // Odak başka yerdeyse çalınmaz.
    const other = document.body.appendChild(document.createElement('button'))
    await w.get('[data-testid="chip-remove"]').trigger('click')
    await w.setProps({ busy: true })
    other.focus()
    await w.setProps({ busy: false })
    await flushPromises()
    expect(document.activeElement).toBe(other)
    other.remove()
    w.unmount()
  })
})
