import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UserRow from './UserRow.vue'

const departments = new Map([['d1', { department_id: 'd1', display_name: 'Mekanik' }]])

describe('UserRow (E-05-13…21)', () => {
  it('baş harf, ad bağlantısı, rozet, seçili sınıfı; seçim kutusu ve e-posta yok', async () => {
    const w = mount(UserRow, {
      props: {
        row: {
          accountId: 'u1',
          fullName: 'ışık ünal',
          labels: [{ programId: 'p1', departmentId: 'd1', role: 'member' }],
        },
        departments,
        selected: true,
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.get('.rp-av').text()).toBe('IÜ')
    expect(w.getComponent(RouterLinkStub).props('to')).toMatchObject({
      params: { accountId: 'u1' },
    })
    expect(w.get('[data-testid="role-first"]').text()).toBe('Üye')
    expect(w.find('[data-testid="role-more"]').exists()).toBe(false)
    expect(w.classes()).toContain('rp-sel')
    expect(w.find('input').exists()).toBe(false)
    await w.trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
  })
})
