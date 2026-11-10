import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  errorEnvelope,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../__tests__/harness'
import {
  baseHandlers,
  confirmButton,
  mountWith,
  settle,
  unmountAll,
} from './__tests__/users-harness'
import UserRoleCards from './UserRoleCards.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const PATCH = `${ORIGIN}/v1/admin/users/u1`
const LABELS = [{ programId: 'p1', departmentId: 'd1', role: 'coordinator' as const }]
const box = (w: Awaited<ReturnType<typeof mountWith>>['wrapper'], r: string) =>
  w.get(`[data-role-card="${r}"] input`).element as HTMLInputElement

describe('UserRoleCards (E-05-31, BE-042)', () => {
  it('Admin kartı satırdaki company_admin değerini gösterir ve canlıdır; K/Ü çiplerden, devre dışı', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountWith(UserRoleCards, {
      accountId: 'u1',
      companyAdmin: true,
      labels: LABELS,
    })
    expect(wrapper.find('[data-design-stub]').exists()).toBe(false)
    expect([
      box(wrapper, 'admin').checked,
      box(wrapper, 'coordinator').checked,
      box(wrapper, 'member').checked,
    ]).toEqual([true, true, false])
    expect(box(wrapper, 'admin').disabled).toBe(false)
    expect(box(wrapper, 'coordinator').disabled).toBe(true)
    expect(box(wrapper, 'member').disabled).toBe(true)
  })

  it('Admin kartı: onay → updateUser {company_admin}; vazgeçte istek yok', async () => {
    server.use(
      ...baseHandlers(),
      http.patch(PATCH, () => json({ account_id: 'u1', changed_fields: ['company_admin'] })),
    )
    const { wrapper } = await mountWith(UserRoleCards, {
      accountId: 'u1',
      companyAdmin: false,
      labels: [],
    })
    await wrapper.get('[data-role-card="admin"] input').trigger('click')
    await settle()
    confirmButton('Vazgeç')?.click()
    await settle()
    expect(sent('PATCH', '/v1/admin/users/u1')).toHaveLength(0)

    await wrapper.get('[data-role-card="admin"] input').trigger('click')
    await settle()
    confirmButton('Yetki ver')?.click()
    await vi.waitFor(() => expect(sent('PATCH', '/v1/admin/users/u1')).toHaveLength(1))
    await vi.waitFor(() =>
      expect(sent('PATCH', '/v1/admin/users/u1')[0]!.body).toEqual({ company_admin: true }),
    )
  })

  it('son yönetici 409 last_admin → ortak hata, kart değişmez', async () => {
    server.use(
      ...baseHandlers(),
      http.patch(PATCH, () => errorEnvelope('organization.last_admin', 409)),
    )
    const { wrapper } = await mountWith(UserRoleCards, {
      accountId: 'u1',
      companyAdmin: true,
      labels: [],
    })
    await wrapper.get('[data-role-card="admin"] input').trigger('click')
    await settle()
    confirmButton('Yetkiyi kaldır')?.click()
    await vi.waitFor(() => expect(sent('PATCH', '/v1/admin/users/u1')).toHaveLength(1))
    expect(box(wrapper, 'admin').checked).toBe(true)
  })

  it('kendi hesabında Admin kartı devre dışı', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountWith(UserRoleCards, {
      accountId: 'me',
      companyAdmin: true,
      labels: [],
    })
    expect(box(wrapper, 'admin').disabled).toBe(true)
  })
})
