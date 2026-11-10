import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  http,
  HttpResponse,
  knownUser,
  ORIGIN,
  resetHarness,
  sent,
  server,
  userListHandler,
} from '../../__tests__/harness'
import {
  baseHandlers,
  USERS,
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

/** Liste istekleri (sayaç okumaları `limit=1`). */
const lists = () => sent('GET', '/v1/admin/users').filter((r) => r.query.get('limit') !== '1')

const PROPS = { roleTab: 'tumu', search: '', departmentId: null, selectedAccountId: null }
const rowOf = (w: Awaited<ReturnType<typeof mountWith>>['wrapper'], id: string) =>
  w.find(`[data-account="${id}"]`)

describe('UsersTable — liste (listUsers)', () => {
  it('satırlar: ad → 05b, adın altında e-posta (BE-041), seçim kutusu yok, rozetler, koordinatörlük hücresi', async () => {
    server.use(...baseHandlers(), usersHandler())
    const { wrapper } = await mountWith(UsersTable, PROPS)

    expect(wrapper.findAll('[role="row"][data-account]')).toHaveLength(3)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
    expect(rowOf(wrapper, 'u1').get('[data-testid="user-email"]').text()).toBe('u1@ornek.test')
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
    // "Tümü" ekip satırsız hesapları da içerir (BE-045): "listelenmez" notu yok.
    expect(wrapper.find('[data-testid="users-no-team"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('listelenmez')
  })

  it('next_cursor dolu → "1–‹yüklenen› / ‹sunucu toplamı›", "Daha fazla yükle"; bitince düğme gizli (BE-011)', async () => {
    server.use(
      ...baseHandlers(),
      usersHandler(USERS_FIRST, 'c1', [knownUser('u9', 'Zeki Öz', ['p1:d3:uye'])]),
    )
    const { wrapper } = await mountWith(UsersTable, PROPS)

    const caption = () => wrapper.get('[data-testid="users-caption"]').text()
    expect(caption()).toBe('1–1 / 2 kullanıcı')
    await wrapper.get('[data-testid="users-more"]').trigger('click')
    await settle()

    expect(lists()[1]!.query.get('cursor')).toBe('c1')
    expect(caption()).toBe('1–2 / 2 kullanıcı')
    expect(wrapper.find('[data-testid="users-more"]').exists()).toBe(false)
  })

  it('sıralama: yön değişimi yeni sorgu (sort_order=desc, imleçsiz) ve aria-sort', async () => {
    server.use(...baseHandlers(), usersHandler(USERS_FIRST, 'c1'))
    const { wrapper } = await mountWith(UsersTable, PROPS)
    const header = () => wrapper.get('[aria-sort]')
    expect(header().attributes('aria-sort')).toBe('ascending')

    await wrapper.get('[data-testid="users-sort"]').trigger('click')
    await settle()

    const calls = lists()
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

  it('rol sekmesi sunucuda süzülür (role=uye); istemci süzmesi yok', async () => {
    server.use(...baseHandlers(), userListHandler(USERS))
    const { wrapper } = await mountWith(UsersTable, { ...PROPS, roleTab: 'uye' })
    expect(lists()[0]!.query.get('role')).toBe('uye')
    // K/Ü sekmesi seçili programla daralır (G16): u3 yalnız p2'de üye.
    expect(lists()[0]!.query.get('program_id')).toBe('p1')
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

describe('UsersTable — tek koordinatörlük (listUsers department_id)', () => {
  it('tek uç: listUsers program_id + department_id; listMembers yok; kesme → "liste eksik olabilir"', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${ORIGIN}/v1/admin/users`, () =>
        HttpResponse.json(
          {
            users: [knownUser('u1', 'Ayşe Demir', ['p1:d1:koordinator'])],
            total: 3,
            role_counts: { all: 3, company_admin: 0, koordinator: 1, uye: 2 },
          },
          { headers: { 'X-Result-Truncated': 'true' } },
        ),
      ),
    )
    const { wrapper } = await mountWith(UsersTable, { ...PROPS, departmentId: 'd1' })

    const [req] = lists()
    expect(req!.query.get('department_id')).toBe('d1')
    expect(req!.query.get('program_id')).toBe('p1')
    expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(0)
    expect(wrapper.findAll('[data-account]').map((r) => r.attributes('data-account'))).toEqual([
      'u1',
    ])
    expect(wrapper.find('[data-testid="users-truncated"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="users-caption"]').text()).toBe('1–1 / 3 kullanıcı')
  })
})

const USERS_FIRST = [knownUser('u1', 'Ayşe Demir', ['p1:d1:koordinator'])]
