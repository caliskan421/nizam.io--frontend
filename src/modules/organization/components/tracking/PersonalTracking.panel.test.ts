// 05b "Hesap ve roller" — GERÇEK W75 `UserPanel` ile entegrasyon (taslak yok; KESİN 16).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { http, json, ORIGIN, resetHarness, sent } from '../../__tests__/harness'
import {
  listHandler,
  listRequests,
  mountAt,
  server,
  settle,
  standingHandlers,
  unmountAll,
  usersHandler,
  workItem,
} from './__tests__/tracking-harness'
import PersonalTracking from './PersonalTracking.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const U1: [string, string] = ['u1', 'Bahar Kılıç']

function confirmButton(label: string): HTMLButtonElement | undefined {
  return [
    ...document.querySelectorAll<HTMLButtonElement>('[data-testid="confirm-dialog"] button'),
  ].find((b) => b.textContent?.trim() === label)
}

describe('05b Hesap ve roller — gerçek UserPanel (W75)', () => {
  it('gömülü panel; 05 panel özetiyle aynı sorgu (tek liste isteği); silince /kullanicilar', async () => {
    server.use(
      ...standingHandlers(),
      listHandler([
        workItem('w1', [U1], { status: 'devam_ediyor', is_overdue: true, days_overdue: 2 }),
        workItem('w2', [U1], { status: 'onaya_sunuldu' }),
      ]),
      usersHandler([{ account_id: 'u1', full_name: 'Bahar Kılıç', memberships: ['p1:d1:uye'] }]),
      http.delete(`${ORIGIN}/v1/admin/users/u1`, () =>
        json({ account_id: 'u1', changed_fields: [], revoked_sessions: 0 }),
      ),
    )
    const { wrapper, router } = await mountAt(
      PersonalTracking,
      { accountId: 'u1' },
      '/kullanicilar/u1?sekme=hesap',
      { realPanel: true },
    )
    const panel = wrapper.get('[data-testid="user-panel"]')
    expect(panel.attributes('data-account')).toBe('u1')
    // Gömülü kip: kapat düğmesi ve "Profil ve kişisel iş takibi" bağlantısı yok.
    expect(panel.find('[data-testid="panel-close"]').exists()).toBe(false)
    expect(panel.find('[data-testid="panel-profile"]').exists()).toBe(false)
    // Panel görev özeti 05b ile aynı anahtarı paylaşır: tek sayfalık liste için tek istek.
    expect(listRequests()).toHaveLength(1)

    await panel.get('[data-testid="account-delete"]').trigger('click')
    await settle()
    expect(document.body.textContent).toContain('Açık görevleri size devredilir')
    confirmButton('Sil')!.click()
    await settle()
    expect(sent('DELETE', '/v1/admin/users/u1')).toHaveLength(1)
    expect(router.currentRoute.value.name).toBe('organization.users')
  })
})
