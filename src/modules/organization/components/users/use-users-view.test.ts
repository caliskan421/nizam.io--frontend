import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  harness,
  http,
  json,
  knownUser,
  ORIGIN,
  resetHarness,
  rosterMember,
  sent,
  server,
} from '../../__tests__/harness'
import { useUsersView, type UsersViewInput } from './use-users-view'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const DEPARTMENTS = http.get(`${ORIGIN}/v1/program/departments`, () =>
  json({ departments: [{ department_id: 'd1', display_name: 'Mekanik' }] }),
)

describe('useUsersView', () => {
  it('liste kipi: sekme süzmesi yüklenen kümede, sayaçlar ve rowFor', async () => {
    server.use(
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/admin/users`, () =>
        json({
          users: [
            knownUser('a', 'Ayşe', ['p1:d1:koordinator']),
            knownUser('b', 'Berk', ['p1:d1:uye']),
          ],
        }),
      ),
    )
    const input = reactive<UsersViewInput>({ roleTab: 'uye', search: '', departmentId: null })
    const h = harness(ADMIN_SCOPE)
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.complete.value).toBe(true))

    expect(view.rows.value.map((r) => r.accountId)).toEqual(['b'])
    expect(view.counts.value).toMatchObject({ tumu: 2, koordinator: 1, uye: 1 })
    expect(view.rowFor('a')?.fullName).toBe('Ayşe')
    expect(view.rowFor('zz')).toBeNull()
  })

  it('tek birim kipi: listMembers; kişinin öteki birimleri önbellekteki listUsers kaydından', async () => {
    server.use(
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/departments/d1/members`, () =>
        json({ members: [rosterMember('a', 'Ayşe', 'uye'), rosterMember('c', 'Cem', 'uye')] }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    h.queryClient.setQueryData(queryKeys.users.list({ search: null, sortOrder: 'asc' }), {
      pages: [
        {
          page: { users: [knownUser('a', 'Ayşe', ['p1:d1:uye', 'p1:d2:koordinator'])] },
          truncated: false,
        },
      ],
      pageParams: [undefined],
    })
    const input = reactive<UsersViewInput>({ roleTab: 'tumu', search: 'ce', departmentId: 'd1' })
    const view = h.run(() => useUsersView(input))
    await vi.waitFor(() => expect(view.loading.value).toBe(false))

    expect(view.rows.value.map((r) => r.accountId)).toEqual(['c'])
    input.search = ''
    expect(view.rowFor('a')?.labels).toHaveLength(2)
    expect(view.hasMore.value).toBe(false)
    expect(sent('GET', '/v1/admin/users')).toHaveLength(0)
  })

  it.each(['liste', 'tek birim'] as const)(
    '%s kipi: sunucu kestiyse küme "tam" sayılmaz (CX-F2-K-03)',
    async (mode) => {
      const truncated = { 'X-Result-Truncated': 'true' }
      server.use(
        DEPARTMENTS,
        http.get(`${ORIGIN}/v1/admin/users`, () =>
          json({ users: [knownUser('a', 'Ayşe', ['p1:d1:uye'])] }, 200, truncated),
        ),
        http.get(`${ORIGIN}/v1/departments/d1/members`, () =>
          json({ members: [rosterMember('a', 'Ayşe', 'uye')] }, 200, truncated),
        ),
      )
      const input = reactive<UsersViewInput>({
        roleTab: 'tumu',
        search: '',
        departmentId: mode === 'liste' ? null : 'd1',
      })
      const h = harness(ADMIN_SCOPE)
      const view = h.run(() => useUsersView(input))
      await vi.waitFor(() => expect(view.loading.value).toBe(false))
      expect(view.source.value).toHaveLength(1)
      expect(view.hasMore.value).toBe(false)
      expect(view.truncated.value).toBe(true)
      expect(view.complete.value).toBe(false)
    },
  )
})
