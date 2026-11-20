import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  mountWith,
  resetAll,
  sent,
  server,
  settle,
  standingHandlers,
} from '../__tests__/harness'
import RecentActivity from './RecentActivity.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

describe('Son işlemler (E-01-13/14, BE-010)', () => {
  it('program seçilmeden akış istemez ve bağlantı açmaz', async () => {
    server.use(...standingHandlers({ companyAdmin: true, rows: [] }))
    const { wrapper } = await mountWith(RecentActivity, null)
    expect(wrapper.get('h2').text()).toBe('Son işlemler')
    expect(wrapper.find('[data-recent-all]').exists()).toBe(false)
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(sent('/v1/audit/entries')).toHaveLength(0)
  })

  it('Tümü 01b açar, akış seçili programla istenir', async () => {
    server.use(...standingHandlers({ companyAdmin: true, rows: [] }))
    const { wrapper, router } = await mountWith(RecentActivity, ADMIN_SCOPE)
    await vi.waitFor(() => expect(sent('/v1/audit/entries')).toHaveLength(1))
    expect(sent('/v1/audit/entries')[0]?.query.get('program_id')).toBe('p1')
    await wrapper.get('[data-recent-all]').trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/islem-gecmisi')
  })
})
