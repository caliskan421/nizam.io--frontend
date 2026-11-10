import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  knownUser,
  ORIGIN,
  requests,
  resetHarness,
  server,
} from '../../__tests__/harness'
import { queryKeys } from '@/shared/http/query-keys'

import { nameFromItems, usePersonProfile } from './use-person-profile'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

function standing(companyAdmin = true) {
  server.use(
    http.get(`${ORIGIN}/v1/me`, () =>
      json({ account_id: 'me', company_admin: companyAdmin, email: 'k@x.test', full_name: 'Ben' }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () => json({ departments: [] })),
  )
}

const users = () => requests.filter((r) => r.path === '/v1/admin/users')
const item = (people: [string, string | null][]) => ({
  assignees: people.map(([account_id, full_name]) => ({ account_id, full_name })),
})

describe('kişi bilgisi kaynağı (E-05-40, BE-043)', () => {
  it('görevlerin atanan adı (boş ad atlanır)', () => {
    expect(
      nameFromItems(
        [
          item([['u1', '  ']]),
          item([
            ['u2', 'X'],
            ['u1', 'Ada'],
          ]),
        ],
        'u1',
      ),
    ).toBe('Ada')
    expect(nameFromItems([item([['u1', null]])], 'u1')).toBeNull()
  })

  it('05 liste önbelleğinde varsa ek istek yok', async () => {
    standing()
    const h = harness(ADMIN_SCOPE)
    h.queryClient.setQueryData(queryKeys.users.list({ search: null, sortOrder: 'asc' }), {
      pages: [
        {
          page: { users: [knownUser('u1', 'Ada', [])] },
          truncated: false,
        },
      ],
      pageParams: [undefined],
    })
    const r = h.run(() => usePersonProfile('u1', [], true))
    await h.flush()
    await vi.waitFor(() => expect(r.name.value).toBe('Ada'))
    expect(r.resolved.value).toBe(true)
    expect(users()).toHaveLength(0)
  })

  it('önbellekte yoksa readUser ile TEK istek; listUsers taraması / ad ile arama yok (BE-043)', async () => {
    standing()
    server.use(
      http.get(`${ORIGIN}/v1/admin/users/u1`, () =>
        json(knownUser('u1', 'Ada Kaya', ['p1:d1:uye'], { email: 'ada@ornek.test' })),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => usePersonProfile('u1', [item([['u1', 'Ada Kaya']])], false))
    await vi.waitFor(() => expect(r.user.value?.memberships).toEqual(['p1:d1:uye']))
    expect(r.user.value?.email).toBe('ada@ornek.test')
    expect(requests.filter((q) => q.path === '/v1/admin/users/u1')).toHaveLength(1)
    expect(users()).toHaveLength(0)
  })

  it('readUser 404 → kişi null; ad görevlerden, çözüldü', async () => {
    standing()
    server.use(
      http.get(`${ORIGIN}/v1/admin/users/u1`, () =>
        errorEnvelope('organization.account_not_found', 404),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => usePersonProfile('u1', [item([['u1', 'Ada Kaya']])], true))
    await vi.waitFor(() => expect(r.resolved.value).toBe(true))
    expect(r.user.value).toBeNull()
    expect(r.name.value).toBe('Ada Kaya')
  })

  it('hiçbir kaynakta yoksa ad null, çözüldü; yönetici değilse liste okunmaz', async () => {
    standing(false)
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => usePersonProfile('u1', [], true))
    await vi.waitFor(() => expect(r.resolved.value).toBe(true))
    expect(r.name.value).toBeNull()
    expect(users()).toHaveLength(0)
  })
})
