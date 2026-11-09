import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UsersHead from './UsersHead.vue'

describe('UsersHead (E-05-02…05)', () => {
  it('Dışa aktar stub (BE-014) devre dışı; "Kullanıcı oluştur" yalnız yetkide', async () => {
    const w = mount(UsersHead, { props: { summary: '3 kullanıcı', canCreate: true } })
    expect(w.get('h1').text()).toBe('Kullanıcılar')
    expect(w.get('[data-design-stub="BE-014"] button').attributes('disabled')).toBeDefined()
    await w.get('[data-testid="users-create"]').trigger('click')
    expect(w.emitted('create')).toHaveLength(1)
    expect(w.text()).not.toContain('davet')
    const ro = mount(UsersHead, { props: { summary: '', canCreate: false } })
    expect(ro.find('[data-testid="users-create"]').exists()).toBe(false)
  })
})
