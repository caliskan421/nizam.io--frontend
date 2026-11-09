import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

import type { UserListFilters } from '../model/types'
import {
  ADMIN_SCOPE,
  bodyHas,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  knownUser,
  ORIGIN,
  type Recorded,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import {
  isTransferAvailable,
  useCreateUser,
  useDeleteUser,
  useSetTemporaryPassword,
  useUnlockAccount,
  useUpdateUser,
  useUserList,
} from './users'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const USERS = `${ORIGIN}/v1/admin/users`
const ASC: UserListFilters = { search: null, sortOrder: 'asc' }

function noScopeHeaders(req: Recorded) {
  expect(req.headers.get('X-Nizamio-Program')).toBeNull()
  expect(req.headers.get('X-Nizamio-Department')).toBeNull()
}

describe('useUserList (listUsers, S1, imleçli)', () => {
  it('limit 200 + sort_by=name&sort_order açıkça; kapsam başlığı yok; anahtar users', async () => {
    server.use(http.get(USERS, () => json({ users: [knownUser('a', 'Ayşe')] })))
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(r.users.value).toHaveLength(1))

    const [req] = sent('GET', '/v1/admin/users')
    expect(Object.fromEntries(req!.query)).toEqual({
      limit: '200',
      sort_by: 'name',
      sort_order: 'asc',
    })
    noScopeHeaders(req!)
    const key = queryKeys.users.list({ search: null, sortOrder: 'asc' })
    expect(h.queryClient.getQueryData(key)).toBeDefined()
  })

  it('next_cursor dolu → complete false, "Daha fazla yükle" aynı süzgeçle; boş → complete true', async () => {
    server.use(
      http.get(USERS, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({ users: [knownUser('b', 'Berk')] })
          : json({ users: [knownUser('a', 'Ayşe')], next_cursor: 'c1' })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(r.users.value).toHaveLength(1))
    expect(r.complete.value).toBe(false)

    await r.query.fetchNextPage()
    await vi.waitFor(() => expect(r.complete.value).toBe(true))
    expect(r.users.value.map((u) => u.account_id)).toEqual(['a', 'b'])
    expect(sent('GET', '/v1/admin/users')[1]!.query.get('cursor')).toBe('c1')
  })

  it('X-Result-Truncated → truncated', async () => {
    server.use(http.get(USERS, () => json({ users: [] }, 200, { 'X-Result-Truncated': 'true' })))
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(r.query.isSuccess.value).toBe(true))
    expect(r.truncated.value).toBe(true)
  })

  it('arama kırpılır; yön değişimi yeni sorgu, eski imleç kullanılmaz (E-05-10)', async () => {
    server.use(http.get(USERS, () => json({ users: [], next_cursor: 'c-asc' })))
    const h = harness(ADMIN_SCOPE)
    const filters = ref<UserListFilters>({ search: '  ali ', sortOrder: 'asc' })
    const r = h.run(() => useUserList(filters))
    await vi.waitFor(() => expect(r.query.isSuccess.value).toBe(true))
    expect(sent('GET', '/v1/admin/users')[0]!.query.get('search')).toBe('ali')

    filters.value = { search: 'ali', sortOrder: 'desc' }
    await vi.waitFor(() => expect(sent('GET', '/v1/admin/users')).toHaveLength(2))
    const second = sent('GET', '/v1/admin/users')[1]!
    expect(second.query.get('sort_order')).toBe('desc')
    expect(second.query.get('cursor')).toBeNull()
  })

  it('422 organization.invalid_sort → sırasız (varsayılan) bir kez yeniden okunur', async () => {
    server.use(
      http.get(USERS, ({ request }) =>
        new URL(request.url).searchParams.has('sort_by')
          ? errorEnvelope('organization.input_invalid', 422, [
              { field: 'sort_by', code: 'organization.invalid_sort', message: 'x' },
            ])
          : json({ users: [knownUser('a', 'Ayşe')] }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(r.users.value).toHaveLength(1))
    expect(sent('GET', '/v1/admin/users')).toHaveLength(2)
  })

  it('enabled false → istek yok (yönetici olmayan)', async () => {
    const h = harness(ADMIN_SCOPE)
    h.run(() => useUserList(ASC, false))
    await h.flush()
    expect(sent('GET', '/v1/admin/users')).toHaveLength(0)
  })
})

describe('kullanıcı yazmaları (anahtarsız, S1)', () => {
  it('createUser: gövde eşlemesi; Idempotency-Key yok; X-Requested-With; kapsam başlığı yok', async () => {
    server.use(http.post(USERS, () => json({ account_id: 'n1', created: true }, 201)))
    const h = harness(ADMIN_SCOPE)
    const m = h.run(() => useCreateUser())
    const out = await m.submit({
      email: 'a@ornek.test',
      fullName: 'Ayşe',
      programId: 'p1',
      departmentId: 'd2',
      role: 'member',
    })
    expect(out.kind).toBe('success')
    const [req] = sent('POST', '/v1/admin/users')
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({
      email: 'a@ornek.test',
      program_id: 'p1',
      department_id: 'd2',
      role: 'uye',
      full_name: 'Ayşe',
    })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    noScopeHeaders(req!)
  })

  it('createUser 409 transfer_available → aktarım teklifi tanınır; transfer_account_id gönderilir', async () => {
    server.use(
      http.post(USERS, async ({ request }) => {
        return bodyHas(await request.json(), 'transfer_account_id')
          ? json({ account_id: 'old', transferred: true }, 201)
          : errorEnvelope('identity.account_exists', 409, [
              { field: 'email', code: 'organization.transfer_available', message: 'x' },
            ])
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const m = h.run(() => useCreateUser())
    const input = {
      email: 'a@ornek.test',
      programId: 'p1',
      departmentId: 'd2',
      role: 'coordinator' as const,
    }
    const first = await m.submit(input)
    expect(first.kind === 'failed' && isTransferAvailable(first.error)).toBe(true)
    const again = await m.submit({ ...input, transferAccountId: 'old' })
    expect(again.kind).toBe('success')
    await vi.waitFor(() => expect(sent('POST', '/v1/admin/users')[1]!.body).toBeDefined())
    expect(sent('POST', '/v1/admin/users')[1]!.body).toMatchObject({
      role: 'koordinator',
      transfer_account_id: 'old',
    })
  })

  it('sonuç bilinmiyor (5xx) → kör tekrar yok (retry null), kullanıcı listesi yeniden okunur', async () => {
    let lists = 0
    server.use(
      http.get(USERS, () => {
        lists += 1
        return json({ users: [] })
      }),
      http.post(USERS, () => errorEnvelope('platform.internal', 500)),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(list.query.isSuccess.value).toBe(true))
    const m = h.run(() => useCreateUser())
    const out = await m.submit({
      email: 'a@x.test',
      programId: 'p1',
      departmentId: 'd2',
      role: 'member',
    })

    expect(out.kind).toBe('unknown_outcome')
    expect(out.kind === 'unknown_outcome' && out.retry).toBeNull()
    expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
    await vi.waitFor(() => expect(lists).toBe(2))
  })

  it('ağ kopması da sonuç bilinmiyor: tek istek, tekrar yok, geçersizleme', async () => {
    server.use(
      http.get(USERS, () => json({ users: [] })),
      http.post(USERS, () => HttpResponse.error()),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(list.query.isSuccess.value).toBe(true))
    const m = h.run(() => useCreateUser())
    const out = await m.submit({
      email: 'a@x.test',
      programId: 'p1',
      departmentId: 'd2',
      role: 'member',
    })
    expect(out.kind === 'unknown_outcome' && out.retry).toBeNull()
    await vi.waitFor(() => expect(sent('GET', '/v1/admin/users')).toHaveLength(2))
    expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
  })

  it('409 membership_exists "zaten uygulanmış olabilir" → failed + liste yeniden okunur', async () => {
    server.use(
      http.get(USERS, () => json({ users: [] })),
      http.post(USERS, () => errorEnvelope('organization.membership_exists', 409)),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useUserList(ASC))
    await vi.waitFor(() => expect(list.query.isSuccess.value).toBe(true))
    const out = await h
      .run(() => useCreateUser())
      .submit({ email: 'a@x.test', programId: 'p1', departmentId: 'd2', role: 'member' })
    expect(out.kind).toBe('failed')
    await vi.waitFor(() => expect(sent('GET', '/v1/admin/users')).toHaveLength(2))
  })

  it('updateUser yalnız verilen alanları gönderir; deleteUser / unlockAccount yolu', async () => {
    server.use(
      http.patch(`${USERS}/:id`, () => json({ account_id: 'u1' })),
      http.delete(`${USERS}/:id`, () => json({ account_id: 'u1' })),
      http.post(`${ORIGIN}/v1/admin/accounts/:id/unlock`, () => json({ account_id: 'u1' })),
    )
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateUser())
    const del = h.run(() => useDeleteUser())
    const unlock = h.run(() => useUnlockAccount())
    await update.submit({ accountId: 'u1', changes: { companyAdmin: false } })
    await vi.waitFor(() => expect(sent('PATCH', '/v1/admin/users/u1')[0]!.body).toBeDefined())
    expect(sent('PATCH', '/v1/admin/users/u1')[0]!.body).toEqual({ company_admin: false })
    expect((await del.submit({ accountId: 'u1' })).kind).toBe('success')
    expect((await unlock.submit({ accountId: 'u1' })).kind).toBe('success')
    expect(sent('DELETE', '/v1/admin/users/u1')).toHaveLength(1)
    expect(sent('POST', '/v1/admin/accounts/u1/unlock')).toHaveLength(1)
  })
})

describe('geçici parola (updateAccount; KESİN 7, P14)', () => {
  const SECRET = 'Gizli-Parola-42'

  function containsSecret(value: unknown): boolean {
    return JSON.stringify(value ?? null).includes(SECRET)
  }

  it('gövde {password, force_password_change: true}; hiçbir önbellekte ve sonuçta parola yok', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/admin/accounts/:id`, () =>
        json({ account_id: 'u1', revoked_sessions: 2 }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const m = h.run(() => useSetTemporaryPassword())
    const out = await m.submit({ accountId: 'u1', password: SECRET })

    expect(out.kind).toBe('success')
    expect(containsSecret(out)).toBe(false)
    const [req] = sent('PATCH', '/v1/admin/accounts/u1')
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ password: SECRET, force_password_change: true })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()

    await vi.waitFor(() => expect(h.queryClient.getMutationCache().getAll()).toHaveLength(0))
    for (const query of h.queryClient.getQueryCache().getAll()) {
      expect(containsSecret(query.state.data)).toBe(false)
    }
  })

  it('sonuç bilinmiyor: taslakta parola yok, tekrar yok, mutasyon önbelleği boş', async () => {
    server.use(http.patch(`${ORIGIN}/v1/admin/accounts/:id`, () => HttpResponse.error()))
    const h = harness(ADMIN_SCOPE)
    const m = h.run(() => useSetTemporaryPassword())
    const out = await m.submit({ accountId: 'u1', password: SECRET })

    expect(out.kind).toBe('unknown_outcome')
    expect(containsSecret(out)).toBe(false)
    expect(out.kind === 'unknown_outcome' && out.retry).toBeNull()
    await vi.waitFor(() => expect(h.queryClient.getMutationCache().getAll()).toHaveLength(0))
  })

  it('422 parola kuralı alan hatası olarak döner (forma)', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/admin/accounts/:id`, () =>
        errorEnvelope('identity.input_invalid', 422, [
          { field: 'password', code: 'identity.password_too_short', message: 'x' },
        ]),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const out = await h
      .run(() => useSetTemporaryPassword())
      .submit({ accountId: 'u1', password: 'k' })
    expect(out.kind === 'failed' && out.error.fields.map((f) => f.code)).toEqual([
      'identity.password_too_short',
    ])
  })
})
