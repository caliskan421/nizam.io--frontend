import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import PersonFilter from './PersonFilter.vue'

const rows = [
  {
    assignees: [
      { account_id: 'a2', full_name: 'Can' },
      { account_id: 'a1', full_name: 'Ayşe' },
    ],
  },
  { assignees: [{ account_id: 'a3', full_name: null }] },
]

function mountFilter(props: Record<string, unknown> = {}) {
  return mount(PersonFilter, {
    props: { people: [], candidates: rows, locked: false, ...props },
    attachTo: document.body,
  })
}
afterEach(() => {
  document.body.innerHTML = ''
})

describe('kişi süzgeci (E-03-11, BE-038)', () => {
  it('seçenekler görülen atananlar (ada göre, adsız "Bilinmeyen kişi"); "Tüm kişiler" seçili', async () => {
    const filter = mountFilter()
    await filter.get('[data-testid="person-filter"]').trigger('click')
    expect(filter.findAll('[role^="menuitem"]').map((i) => i.text())).toEqual([
      'Tüm kişiler',
      'Ayşe',
      'Bilinmeyen kişi',
      'Can',
    ])
    expect(filter.get('[role="menuitemradio"]').attributes('aria-checked')).toBe('true')
  })

  it('çoklu seçim: ekle/çıkar, "Tüm kişiler" temizler; rozet sayıyı gösterir', async () => {
    const filter = mountFilter({ people: ['a1'] })
    expect(filter.get('.tasks-filterbtn__n').text()).toBe('1')
    await filter.get('[data-testid="person-filter"]').trigger('click')
    const boxes = filter.findAll('[role="menuitemcheckbox"]')
    await boxes[2]!.trigger('click') // Can ekler
    await boxes[0]!.trigger('click') // Ayşe çıkarır
    await filter.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(filter.emitted('update:people')).toEqual([[['a1', 'a2']], [[]], [[]]])
  })

  it('süzgeç daralınca görülen adaylar birikir; seçili ama bilinmeyen kimlik listede kalır', async () => {
    const filter = mountFilter({ people: ['zz'] })
    await filter.setProps({ candidates: [rows[0]!] })
    await filter.setProps({
      candidates: [{ assignees: [{ account_id: 'a1', full_name: 'Ayşe' }] }],
    })
    await filter.get('[data-testid="person-filter"]').trigger('click')
    const names = filter.findAll('[role^="menuitem"]').map((i) => i.text())
    expect(names).toContain('Can')
    expect(names).toContain('Bilinmeyen kişi')
  })

  it('50 seçimde yenisi eklenmez', async () => {
    const people = Array.from({ length: 50 }, (_, i) => `p${i}`)
    const filter = mountFilter({ people })
    await filter.get('[data-testid="person-filter"]').trigger('click')
    await filter
      .findAll('[role="menuitemcheckbox"]')
      .find((b) => b.text() === 'Ayşe')!
      .trigger('click')
    expect(filter.emitted('update:people')).toBeUndefined()
  })

  it('Üye merceğinde kilitli ve açıklamalı; Esc menüyü kapatır, odak tetiğe döner', async () => {
    const locked = mountFilter({ locked: true })
    const button = locked.get('[data-testid="person-filter"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toContain('Üye merceğinde')
    const filter = mountFilter()
    const trigger = filter.get<HTMLButtonElement>('[data-testid="person-filter"]')
    await trigger.trigger('click')
    await filter.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await filter.vm.$nextTick()
    expect(filter.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })
})
