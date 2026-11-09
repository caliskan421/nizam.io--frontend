import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'

import { errorEnvelope, http, json, ORIGIN, resetHarness, server } from '../../__tests__/harness'
import { baseHandlers, mountWith, seedUsers, settle, unmountAll } from './__tests__/users-harness'
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
    const { wrapper } = await mountWith(UserAccountActions, { accountId: 'u1', name: 'Ayşe' })
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
      { accountId: 'u1', name: 'Ayşe' },
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
    const { wrapper } = await mountWith(UserAccountActions, { accountId: 'u1', name: 'Ayşe' })
    expect(wrapper.find('[data-testid="account-password"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="account-unlock"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="account-delete"]').exists()).toBe(true)
  })
})
