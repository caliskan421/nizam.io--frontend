import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import {
  ADMIN_SCOPE,
  harness,
  http,
  json,
  knownUser,
  ORIGIN,
  resetHarness,
  sent,
  server,
  userListHandler,
} from '../../__tests__/harness'
import { useUsersView, type UsersViewInput } from './use-users-view'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const DEPARTMENTS = http.get(`${ORIGIN}/v1/program/departments`, () =>
  json({ departments: [{ department_id: 'd1', display_name: 'Mekanik' }] }),
)

describe('useUsersView', () => {
  const USERS = [
    knownUser('a', 'Ayşe', ['p1:d1:koordinator'], { email: 'ayse@ornek.test' }),
    knownUser('b', 'Berk', ['p1:d1:uye', 'p2:d9:koordinator']),
    knownUser('c', 'Cem', [], { company_admin: true }),
  ]

  it('rol sekmesi, arama, koordinatörlük süzgeci ve sayılar SUNUCUDA (tek uç; BE-011)', async () => {
    server.use(DEPARTMENTS, userListHandler(USERS))
    const input = reactive<UsersViewInput>({ roleTab: 'uye', search: '', departmentId: null })
    const h = harness(ADMIN_SCOPE)
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.complete.value).toBe(true))

    expect(view.rows.value.map((r) => r.accountId)).toEqual(['b'])
    expect(view.total.value).toBe(1)
    // Sayaçlar rol dışı süzgeçlerle sunucudan: Tümü hesapların hepsi (ekibi olmayan yönetici dahil).
    expect(view.counts.value).toEqual({ tumu: 3, admin: 1, koordinator: 2, uye: 1 })
    expect(sent('GET', '/v1/admin/users').at(-1)!.query.get('role')).toBe('uye')
    expect(sent('GET', '/v1/admin/users').at(-1)!.query.get('program_id')).toBeNull()

    input.roleTab = 'admin'
    await vi.waitFor(() => expect(view.rows.value.map((r) => r.accountId)).toEqual(['c']))
    expect(sent('GET', '/v1/admin/users').at(-1)!.query.get('role')).toBe('company_admin')

    input.roleTab = 'tumu'
    input.search = 'AYSE@'
    await vi.waitFor(() => expect(view.rows.value.map((r) => r.accountId)).toEqual(['a']))
    expect(sent('GET', '/v1/admin/users').at(-1)!.query.get('search')).toBe('AYSE@')
    expect(view.rowFor('a')?.email).toBe('ayse@ornek.test')
    expect(view.rowFor('zz')).toBeNull()
  })

  it('sekme değişiminde yeni sorgu yüklenirken son bilinen sayaçlar korunur', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const handler = userListHandler(USERS)
    server.use(
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/admin/users`, async (info) => {
        if (new URL(info.request.url).searchParams.get('role') === 'koordinator') await gate
        return handler.run(info).then((r) => r?.response ?? json({}))
      }),
    )
    const input = reactive<UsersViewInput>({ roleTab: 'tumu', search: '', departmentId: null })
    const h = harness(ADMIN_SCOPE)
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.counts.value.tumu).toBe(3))
    input.roleTab = 'koordinator'
    await vi.waitFor(() => expect(view.loading.value).toBe(true))
    expect(view.counts.value.tumu).toBe(3)
    release()
    await vi.waitFor(() => expect(view.loading.value).toBe(false))
  })

  it('koordinatörlük süzgeci: listUsers department_id + program_id; listMembers çağrılmaz', async () => {
    server.use(DEPARTMENTS, userListHandler(USERS))
    const input = reactive<UsersViewInput>({ roleTab: 'tumu', search: '', departmentId: 'd1' })
    const h = harness(ADMIN_SCOPE)
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.loading.value).toBe(false))
    const [req] = sent('GET', '/v1/admin/users')
    expect(req!.query.get('department_id')).toBe('d1')
    expect(req!.query.get('program_id')).toBe('p1')
    expect(view.rows.value.map((r) => r.accountId)).toEqual(['a', 'b'])
    expect(view.total.value).toBe(2)
    expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(0)
  })

  it('süzgeçli sayfa boş ama next_cursor dolu → istemci ilerler (satır atlanmaz)', async () => {
    server.use(
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/admin/users`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({
              users: [USERS[0]],
              total: 1,
              role_counts: { all: 1, company_admin: 0, koordinator: 1, uye: 0 },
            })
          : json({
              users: [],
              next_cursor: 'c2',
              total: 1,
              role_counts: { all: 1, company_admin: 0, koordinator: 1, uye: 0 },
            })
      }),
    )
    const input = reactive<UsersViewInput>({
      roleTab: 'koordinator',
      search: '',
      departmentId: null,
    })
    const h = harness(ADMIN_SCOPE)
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.rows.value.map((r) => r.accountId)).toEqual(['a']))
    expect(sent('GET', '/v1/admin/users').map((r) => r.query.get('cursor'))).toEqual([null, 'c2'])
    expect(view.hasMore.value).toBe(false)
  })

  it('sunucu kestiyse küme "tam" sayılmaz (CX-F2-K-03); toplam yine sunucunundur', async () => {
    server.use(
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/admin/users`, () =>
        json(
          {
            users: [USERS[0]],
            total: 5,
            role_counts: { all: 5, company_admin: 0, koordinator: 1, uye: 0 },
          },
          200,
          { 'X-Result-Truncated': 'true' },
        ),
      ),
    )
    const input = reactive<UsersViewInput>({ roleTab: 'tumu', search: '', departmentId: null })
    const h = harness(ADMIN_SCOPE)
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.loading.value).toBe(false))
    expect(view.source.value).toHaveLength(1)
    expect(view.total.value).toBe(5)
    expect(view.hasMore.value).toBe(false)
    expect(view.truncated.value).toBe(true)
    expect(view.complete.value).toBe(false)
  })
})
