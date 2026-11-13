import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD_SCOPE,
  COUNTS,
  countsHandler,
  DASHBOARD,
  MEMBER_SCOPE,
  mountWith,
  resetAll,
  row,
  sent,
  server,
  standingHandlers,
} from '../__tests__/harness'
import RoleHomeDraft from './RoleHomeDraft.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const ROWS = [row('devam_ediyor'), row('tamamlandi')]

describe('rol gövdesi taslağı (W140 K1/Ü1 yerine; P53)', () => {
  it.each([
    ['koordinatör', 'koordinator', COORD_SCOPE],
    ['salt üye', 'uye', MEMBER_SCOPE],
  ] as const)(
    '%s: birim/üye KPI şeridi, pano ve yönetici bölgeleri yok, rapor kutucuğu yok',
    async (_name, role, scope) => {
      server.use(
        ...standingHandlers({ companyAdmin: false, rows: [{ department_id: 'd1', role }] }),
        countsHandler(ROWS),
      )
      const { wrapper } = await mountWith(RoleHomeDraft, scope)
      expect(wrapper.get('[data-testid="home-page"]').attributes('data-home')).toBe('role-draft')
      expect(wrapper.find('[data-kpi-source="work-counts"]').exists()).toBe(true)
      expect(sent(COUNTS)).toHaveLength(1)
      expect(sent(DASHBOARD)).toHaveLength(0)
      for (const region of ['team', 'coords', 'footer']) {
        expect(wrapper.find(`[data-region="${region}"]`).exists(), region).toBe(false)
      }
      expect(wrapper.find('[data-quick="report"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="home-deleted-records"]').exists()).toBe(false)
    },
  )

  it('kapsam eksik: seçim notu', async () => {
    server.use(
      ...standingHandlers({ companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }),
    )
    const { wrapper } = await mountWith(RoleHomeDraft, {
      programId: 'p1',
      lens: 'member',
      departmentId: null,
    })
    expect(wrapper.text()).toContain('Kapsam seçin')
  })
})
