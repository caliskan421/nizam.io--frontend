import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { resetHarness, sent, server } from '../__tests__/harness'
import {
  mountWith,
  serverHandlers,
  settle,
  unmountAll,
} from '../components/detail/__tests__/detail-harness'
import CoordinatorshipPage from './CoordinatorshipPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

describe('08b sayfa — URL (yol + sekme)', () => {
  it('derin bağlantı: yol birimi ve `sekme` paneli seçer', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountWith(
      CoordinatorshipPage,
      {},
      '/koordinatorlukler/d1?sekme=gorevler',
    )
    expect(wrapper.get('[data-testid="cd-title"]').text()).toBe('Altyapı ve tesisat')
    expect(wrapper.get('[role="tabpanel"]').attributes('data-panel')).toBe('gorevler')
    expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(1)
  })

  it('sekme seçimi URL `sekme`yi replace ile yazar; genel parametresiz', async () => {
    server.use(...serverHandlers())
    const { wrapper, router } = await mountWith(CoordinatorshipPage, {}, '/koordinatorlukler/d1')
    const before = window.history.length
    await wrapper.get('[role="tab"][data-value="uyeler"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/koordinatorlukler/d1?sekme=uyeler')
    expect(wrapper.get('[role="tabpanel"]').attributes('data-panel')).toBe('uyeler')
    await wrapper.get('[role="tab"][data-value="genel"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/koordinatorlukler/d1')
    expect(window.history.length).toBe(before)
  })

  it('geçersiz / faz dışı sekme genel bakışa düşer', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountWith(
      CoordinatorshipPage,
      {},
      '/koordinatorlukler/d1?sekme=arsiv',
    )
    expect(wrapper.get('[role="tabpanel"]').attributes('data-panel')).toBe('genel')
  })
})
