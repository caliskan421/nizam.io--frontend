import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserRoleCards from './UserRoleCards.vue'

describe('UserRoleCards (E-05-31)', () => {
  it('Admin stub (BE-042) işaretsiz; K/Ü çiplerden türetilir, hepsi devre dışı', () => {
    const w = mount(UserRoleCards, {
      props: { labels: [{ programId: 'p1', departmentId: 'd1', role: 'coordinator' }] },
    })
    const box = (r: string) => w.get(`[data-role-card="${r}"] input`).element as HTMLInputElement
    expect(w.find('[data-design-stub="BE-042"] [data-role-card="admin"]').exists()).toBe(true)
    expect([box('admin').checked, box('coordinator').checked, box('member').checked]).toEqual([
      false,
      true,
      false,
    ])
    expect([box('admin'), box('coordinator'), box('member')].every((b) => b.disabled)).toBe(true)
  })
})
