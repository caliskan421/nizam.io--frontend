import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  ADMIN_SCOPE,
  dashboard,
  dashboardHandler,
  DASHBOARD,
  errorEnvelope,
  http,
  json,
  LIST,
  mountWith,
  ORIGIN,
  resetAll,
  sent,
  server,
  settle,
} from '../__tests__/harness'
import AdminKpis from './AdminKpis.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const values = (wrapper: Awaited<ReturnType<typeof mountWith>>['wrapper']) =>
  wrapper.findAll('[data-kpi-value]').map((v) => v.text())

describe('Admin KPI (reportDashboard)', () => {
  it('sunucu sayaçları; görev listesi istenmez; "yüklenen kayıtlar" etiketi yok', async () => {
    server.use(dashboardHandler(dashboard()))
    const { wrapper } = await mountWith(AdminKpis, ADMIN_SCOPE)
    expect(values(wrapper)).toEqual(['%49', '40', '15', '3'])
    expect(sent(DASHBOARD)).toHaveLength(1)
    expect(sent(LIST)).toHaveLength(0)
    expect(wrapper.find('[data-kpi-partial]').exists()).toBe(false)
  })

  it('429 → bölge içi hata (otomatik tekrar yok); "Yeniden dene" tek istek, sayılar gelir', async () => {
    let fail = true
    server.use(
      http.get(`${ORIGIN}${DASHBOARD}`, () =>
        fail ? errorEnvelope('platform.rate_limited', 429) : json(dashboard()),
      ),
    )
    const { wrapper } = await mountWith(AdminKpis, ADMIN_SCOPE)
    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Görev özeti yüklenemedi')
    expect(sent(DASHBOARD)).toHaveLength(1)
    fail = false
    const before = sent(DASHBOARD).length
    await alert.get('button').trigger('click')
    await settle()
    expect(sent(DASHBOARD).length).toBe(before + 1)
    expect(values(wrapper)).toEqual(['%49', '40', '15', '3'])
  })
})
