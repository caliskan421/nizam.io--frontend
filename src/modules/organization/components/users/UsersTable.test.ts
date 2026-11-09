import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { http, json, knownUser, ORIGIN, resetHarness, sent, server } from '../../__tests__/harness'
import {
  baseHandlers,
  mountWith,
  settle,
  unmountAll,
  usersHandler,
} from './__tests__/users-harness'
import UsersTable from './UsersTable.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const PROPS = { roleTab: 'tumu', search: '', departmentId: null, selectedAccountId: null }
const rowOf = (w: Awaited<ReturnType<typeof mountWith>>['wrapper'], id: string) =>
  w.find(`[data-account="${id}"]`)

describe('UsersTable — liste (listUsers)', () => {
  it('satırlar: ad → 05b, seçim kutusu ve e-posta yok, rozetler, koordinatörlük hücresi', async () => {
    server.use(...baseHandlers(), usersHandler())
    const { wrapper } = await mountWith(UsersTable, PROPS)

    expect(wrapper.findAll('[role="row"][data-account]')).toHaveLength(3)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('@')
    const ayse = rowOf(wrapper, 'u1')
    expect(ayse.get('[data-testid="user-name"]').attributes('href')).toBe('/kullanicilar/u1')
    expect(ayse.get('[data-testid="role-first"]').text()).toBe('Koordinatör')
    expect(ayse.get('[data-testid="role-more"]').text()).toBe('+1')
    expect(ayse.get('[data-testid="role-more"]').attributes('title')).toBe('Üye')
    expect(ayse.get('[data-testid="user-coord"]').text()).toBe('Mekanik, İdari işler')
    // Başka programın satırları gösterilmez (E-05-20).
    const cem = rowOf(wrapper, 'u3')
    expect(cem.get('[data-testid="user-coord"]').text()).toBe('Atanmamış')
    expect(cem.find('[data-testid="role-first"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="users-no-team"]').exists()).toBe(true)
  })

  it('next_cursor dolu → yüklenen sayı + etiket, "Daha fazla yükle"; bitince düğme gizli, toplam yok', async () => {
    server.use(
      ...baseHandlers(),
      usersHandler(USERS_FIRST, 'c1', [knownUser('u9', 'Zeki Öz', ['p1:d3:uye'])]),
    )
    const { wrapper } = await mountWith(UsersTable, PROPS)

    const caption = () => wrapper.get('[data-testid="users-caption"]').text()
    expect(caption()).toBe('1 kullanıcı yüklendi · yüklenen kayıtlar içinde')
    await wrapper.get('[data-testid="users-more"]').trigger('click')
    await settle()

    expect(sent('GET', '/v1/admin/users')[1]!.query.get('cursor')).toBe('c1')
    expect(caption()).toBe('2 kullanıcı')
    expect(wrapper.find('[data-testid="users-more"]').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/\d+–\d+ \//)
  })

  it('sıralama: yön değişimi yeni sorgu (sort_order=desc, imleçsiz) ve aria-sort', async () => {
    server.use(...baseHandlers(), usersHandler(USERS_FIRST, 'c1'))
    const { wrapper } = await mountWith(UsersTable, PROPS)
    const header = () => wrapper.get('[aria-sort]')
    expect(header().attributes('aria-sort')).toBe('ascending')

    await wrapper.get('[data-testid="users-sort"]').trigger('click')
    await settle()

    const calls = sent('GET', '/v1/admin/users')
    expect(calls).toHaveLength(2)
    expect(calls[1]!.query.get('sort_by')).toBe('name')
    expect(calls[1]!.query.get('sort_order')).toBe('desc')
    expect(calls[1]!.query.get('cursor')).toBeNull()
    expect(header().attributes('aria-sort')).toBe('descending')
    expect(header().text()).toBe('kullanıcı ↓')
  })

  it('satır ve "Ayrıntı" düğmesi seçim yayar; ad bağlantısı yaymaz', async () => {
    server.use(...baseHandlers(), usersHandler())
    const { wrapper } = await mountWith(UsersTable, PROPS)
    const table = wrapper.findComponent(UsersTable)

    await rowOf(wrapper, 'u2').trigger('click')
    await rowOf(wrapper, 'u1').get('[data-testid="user-open"]').trigger('click')
    await rowOf(wrapper, 'u3').get('[data-testid="user-name"]').trigger('click')
    expect(table.emitted('select')).toEqual([['u2'], ['u1']])
  })

  it('rol sekmesi seçili programın etiketlerine göre süzer', async () => {
    server.use(...baseHandlers(), usersHandler())
    const { wrapper } = await mountWith(UsersTable, { ...PROPS, roleTab: 'uye' })
    expect(wrapper.findAll('[data-account]').map((r) => r.attributes('data-account'))).toEqual([
      'u1',
      'u2',
    ])
  })

  it('yükleniyor → iskelet satırlar', async () => {
    server.use(
      ...baseHandlers(),
      http.get(ORIGIN + '/v1/admin/users', () => new Promise(() => {})),
    )
    const { wrapper } = await mountWith(UsersTable, PROPS)
    expect(wrapper.findAll('[data-skeleton]')).toHaveLength(10)
    expect(wrapper.get('[role="table"]').attributes('aria-busy')).toBe('true')
  })
})

describe('UsersTable — tek koordinatörlük (listMembers)', () => {
  it('tek istek, listUsers yok; silinmiş satır gizli; kesme → "liste eksik olabilir"', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${ORIGIN}/v1/departments/d1/members`, () =>
        json(
          {
            members: [
              {
                account_id: 'u1',
                full_name: 'Ayşe Demir',
                membership_id: 'm1',
                role: 'koordinator',
                status: 'active',
              },
              {
                account_id: 'u7',
                full_name: 'Eski Kişi',
                membership_id: 'm7',
                role: 'uye',
                status: 'deleted',
              },
            ],
          },
          200,
          { 'X-Result-Truncated': 'true' },
        ),
      ),
    )
    const { wrapper } = await mountWith(UsersTable, { ...PROPS, departmentId: 'd1' })

    expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(1)
    expect(sent('GET', '/v1/admin/users')).toHaveLength(0)
    const [req] = sent('GET', '/v1/departments/d1/members')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(wrapper.findAll('[data-account]').map((r) => r.attributes('data-account'))).toEqual([
      'u1',
    ])
    expect(wrapper.find('[data-testid="users-truncated"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="users-caption"]').text()).toBe('1 kullanıcı')
  })
})

const USERS_FIRST = [knownUser('u1', 'Ayşe Demir', ['p1:d1:koordinator'])]
