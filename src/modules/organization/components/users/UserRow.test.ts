import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { fakeSelection } from './__tests__/workload-fake'
import { WORKLOAD_SELECTION } from './use-workload-selection'

import UserRow from './UserRow.vue'

import type { UserRow as Row } from './user-rows'

const departments = new Map([['d1', { department_id: 'd1', display_name: 'Mekanik' }]])

const row = (overrides: Partial<Row> = {}): Row => ({
  accountId: 'u1',
  fullName: 'ışık ünal',
  email: 'isik@ornek.test',
  companyAdmin: false,
  accountStatus: 'active',
  loginLocked: false,
  labels: [{ programId: 'p1', departmentId: 'd1', role: 'member' }],
  ...overrides,
})

describe('UserRow (E-05-13…21)', () => {
  it('baş harf, ad bağlantısı, e-posta (BE-041), rozet, seçili sınıfı; seçim kutusu yok', async () => {
    const w = mount(UserRow, {
      props: {
        row: row(),
        departments,
        selected: true,
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.get('.rp-av').text()).toBe('IÜ')
    expect(w.get('[data-testid="user-email"]').text()).toBe('isik@ornek.test')
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

  it('şirket yöneticisi: ilk rozet çerçeveli Admin, ekip rolü +1 (BE-042); ekibi olmayan yönetici de görünür (BE-045)', () => {
    const mountRow = (r: Row) =>
      mount(UserRow, {
        props: { row: r, departments, selected: false },
        global: { stubs: { RouterLink: RouterLinkStub } },
      })
    const admin = mountRow(row({ companyAdmin: true }))
    expect(admin.get('[data-testid="role-first"]').text()).toBe('Admin')
    expect(admin.get('[data-testid="role-first"]').classes()).toContain('users-badge--admin')
    expect(admin.get('[data-testid="role-more"]').text()).toBe('+1')
    expect(admin.get('[data-testid="user-coord"]').text()).toBe('Mekanik')

    const noTeam = mountRow(row({ companyAdmin: true, labels: [] }))
    expect(noTeam.get('[data-testid="role-first"]').text()).toBe('Admin')
    expect(noTeam.find('[data-testid="role-more"]').exists()).toBe(false)
    expect(noTeam.get('[data-testid="user-coord"]').text()).toBe('Atanmamış')
  })
})

describe('UserRow — iş yükü seçimi (E-13-60, 62)', () => {
  const mountPick = (selection?: ReturnType<typeof fakeSelection>) =>
    mount(UserRow, {
      props: { row: row(), departments, selected: false },
      global: {
        stubs: { RouterLink: RouterLinkStub },
        plugins: [i18n],
        provide: selection ? { [WORKLOAD_SELECTION as symbol]: selection } : {},
      },
    })

  it('kutu yalnız etkin seçimde; aria-label "‹ad› rapora ekle"; tıklama paneli açmaz, satırı vurgular', async () => {
    const selection = fakeSelection()
    const w = mountPick(selection)
    const box = w.get('[data-testid="user-pick"]')
    expect(box.attributes('aria-label')).toBe('ışık ünal rapora ekle')
    await box.setValue(true)
    expect(w.emitted('select')).toBeUndefined()
    expect(selection.isSelected('u1')).toBe(true)
    expect(w.classes()).toContain('rp-sel')
    expect(
      mountPick(fakeSelection({ enabled: false }))
        .find('input')
        .exists(),
    ).toBe(false)
  })

  it('iş yükünde olmayan hesap: devre dışı kutu + ipucu', () => {
    const w = mountPick(fakeSelection({ blocked: true }))
    const box = w.get('[data-testid="user-pick"]')
    expect(box.attributes('disabled')).toBeDefined()
    expect(box.attributes('title')).toBe('Bu hesap seçili programın iş yükünde değil.')
    expect(w.get('.users-row__pick').attributes('title')).toBe(box.attributes('title'))
  })
})
