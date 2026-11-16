import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import UsersHead from './UsersHead.vue'

// Dışa aktarma bileşeninin kendi testi var; burada yalnız yüzeyde bulunduğu doğrulanır.
vi.mock('../../api', () => ({
  useUsersExport: () => ({ run: vi.fn(), busy: { value: false } }),
}))

describe('UsersHead (E-05-02…05)', () => {
  it('Dışa aktar canlı bileşendir (stub yok); "Kullanıcı oluştur" yalnız yetkide', async () => {
    const w = mount(UsersHead, { props: { summary: '3 kullanıcı', canCreate: true } })
    expect(w.get('h1').text()).toBe('Kullanıcılar')
    expect(w.find('[data-design-stub="BE-014"]').exists()).toBe(false)
    expect(w.find('[data-testid="users-export"]').exists()).toBe(true)
    await w.get('[data-testid="users-create"]').trigger('click')
    expect(w.emitted('create')).toHaveLength(1)
    expect(w.text()).not.toContain('davet')
    const ro = mount(UsersHead, { props: { summary: '', canCreate: false } })
    expect(ro.find('[data-testid="users-create"]').exists()).toBe(false)
  })
})
