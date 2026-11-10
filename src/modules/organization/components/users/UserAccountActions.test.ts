import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'

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
  seedUsers,
  settle,
  unmountAll,
} from './__tests__/users-harness'
import UserAccountActions from './UserAccountActions.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  useToast().clear()
})
afterAll(() => server.close())

const UNLOCK = `${ORIGIN}/v1/admin/accounts/u1/unlock`

describe('UserAccountActions', () => {
  it('kilit kaldırma başarısı bildirilir', async () => {
    server.use(
      ...baseHandlers(),
      http.post(UNLOCK, () => json({ account_id: 'u1' })),
    )
    const { wrapper } = await mountWith(UserAccountActions, {
      accountId: 'u1',
      name: 'Ayşe',
      accountStatus: 'active',
      loginLocked: true,
    })
    await wrapper.get('[data-testid="account-unlock"]').trigger('click')
    await settle()
    expect(useToast().queue.value.at(-1)?.message).toBe('Giriş kilidi kaldırıldı.')
  })

  it('hesap yok (404) → ileti + kullanıcı listesi yeniden okunur', async () => {
    server.use(
      ...baseHandlers(),
      http.post(UNLOCK, () => errorEnvelope('identity.account_not_found', 404)),
    )
    const { wrapper, queryClient } = await mountWith(
      UserAccountActions,
      { accountId: 'u1', name: 'Ayşe', accountStatus: 'active', loginLocked: true },
      { seed: seedUsers() },
    )
    await wrapper.get('[data-testid="account-unlock"]').trigger('click')
    await settle()
    expect(useToast().queue.value.at(-1)).toMatchObject({
      message: 'Hesap bulunamadı.',
      tone: 'danger',
    })
    const key = queryKeys.users.list({ search: null, sortOrder: 'asc' })
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('yönetici olmayan (koordinatör) yalnız silmeyi görür; parola/kilit eylemleri gizli', async () => {
    server.use(
      ...baseHandlers({
        accountId: 'me',
        companyAdmin: false,
        rows: [{ department_id: 'd1', role: 'koordinator' }],
      }),
    )
    const { wrapper } = await mountWith(UserAccountActions, {
      accountId: 'u1',
      name: 'Ayşe',
      accountStatus: 'active',
      loginLocked: true,
    })
    expect(wrapper.find('[data-testid="account-password"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="account-unlock"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="account-delete"]').exists()).toBe(true)
  })

  it('kilit düğmesi yalnız login_locked doğruyken (BE-044); durum tahmin edilmez', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountWith(UserAccountActions, {
      accountId: 'u1',
      name: 'Ayşe',
      accountStatus: 'active',
      loginLocked: false,
    })
    expect(wrapper.find('[data-testid="account-unlock"]').exists()).toBe(false)
  })

  it('Hesabı kilitle: onay → disableAccount; kilitli hesapta "Hesabı etkinleştir" → enableAccount (BE-012)', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${ORIGIN}/v1/admin/accounts/u1/disable`, () =>
        json({ account_id: 'u1', account_status: 'disabled', changed: true, revoked_sessions: 2 }),
      ),
      http.post(`${ORIGIN}/v1/admin/accounts/u1/enable`, () =>
        json({ account_id: 'u1', account_status: 'active', changed: true, revoked_sessions: 0 }),
      ),
    )
    const active = await mountWith(UserAccountActions, {
      accountId: 'u1',
      name: 'Ayşe',
      accountStatus: 'active',
      loginLocked: false,
    })
    expect(active.wrapper.find('[data-design-stub="BE-012"]').exists()).toBe(false)
    await active.wrapper.get('[data-testid="account-lock"]').trigger('click')
    await settle()
    expect(sent('POST', '/v1/admin/accounts/u1/disable')).toHaveLength(0)
    confirmButton('Kilitle')?.click()
    await vi.waitFor(() => expect(sent('POST', '/v1/admin/accounts/u1/disable')).toHaveLength(1))
    await settle()
    expect(useToast().queue.value.at(-1)?.message).toBe('Hesap kilitlendi.')

    unmountAll()
    const disabled = await mountWith(UserAccountActions, {
      accountId: 'u1',
      name: 'Ayşe',
      accountStatus: 'disabled',
      loginLocked: false,
    })
    expect(disabled.wrapper.find('[data-testid="account-lock"]').exists()).toBe(false)
    await disabled.wrapper.get('[data-testid="account-enable"]').trigger('click')
    await vi.waitFor(() => expect(sent('POST', '/v1/admin/accounts/u1/enable')).toHaveLength(1))
  })

  it('kendi hesabında kilitle/etkinleştir gizli', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountWith(UserAccountActions, {
      accountId: 'me',
      name: 'Ben',
      accountStatus: 'active',
      loginLocked: false,
    })
    expect(wrapper.find('[data-testid="account-lock"]').exists()).toBe(false)
  })
})
