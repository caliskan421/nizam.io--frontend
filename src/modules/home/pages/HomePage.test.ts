import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  dashboardHandler,
  DASHBOARD,
  LIST,
  listHandler,
  MEMBER_SCOPE,
  mountWith,
  resetAll,
  row,
  sent,
  server,
  standingHandlers,
  type StandingFixture,
} from '../__tests__/harness'
import HomePage from './HomePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }
const ADMIN_MEMBER: StandingFixture = {
  companyAdmin: true,
  rows: [{ department_id: 'd1', role: 'uye' }],
}
const COORDINATOR: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const MEMBER: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'uye' }],
}

const ROWS = [
  row('devam_ediyor'),
  row('tamamlandi'),
  row('onaya_sunuldu', { assignee_account_ids: ['acc-2'] }),
]

type Page = Awaited<ReturnType<typeof mountWith>>
const kpiValues = ({ wrapper }: Page) => wrapper.findAll('[data-kpi-value]').map((v) => v.text())
const quickKeys = ({ wrapper }: Page) =>
  wrapper.findAll('[data-quick]').map((q) => q.attributes('data-quick'))

describe('01 Ana sayfa — F1 sade', () => {
  it('selamlama tam full_name (ilk sözcük değil); F6 bölgeleri DOM’da yok', async () => {
    server.use(...standingHandlers(ADMIN), dashboardHandler())
    const page = await mountWith(HomePage, ADMIN_SCOPE)
    expect(page.wrapper.get('[data-testid="home-greeting"]').text()).toBe('Merhaba Ayşe Nur Yılmaz')
    const text = page.wrapper.text()
    for (const absent of ['Silinen kayıtlar', 'Rapor oluştur', 'Koordinatörlükler', 'ekip']) {
      expect(text, absent).not.toContain(absent)
    }
    expect(page.wrapper.find('[aria-labelledby="team-title"]').exists()).toBe(false)
    expect(page.wrapper.find('[aria-labelledby="coord-title"]').exists()).toBe(false)
    expect(page.wrapper.find('ol.rp-timeline').exists()).toBe(false)
    expect(page.wrapper.find('[data-design-stub="BE-010"]').exists()).toBe(true)
  })

  it('Admin merceği: KPI pano ucundan; görev listesi istenmez; üç hızlı işlem', async () => {
    server.use(...standingHandlers(ADMIN), dashboardHandler())
    const page = await mountWith(HomePage, ADMIN_SCOPE)
    expect(page.wrapper.find('[data-kpi-source="dashboard"]').exists()).toBe(true)
    expect(kpiValues(page)).toEqual(['%49', '40', '15', '3'])
    expect(sent(DASHBOARD)).toHaveLength(1)
    expect(sent(LIST)).toHaveLength(0)
    expect(quickKeys(page)).toEqual(['newTask', 'meeting', 'invite'])
  })

  it('Koordinatör merceği: KPI seçili birim listesinden; pano ÇAĞRILMAZ', async () => {
    server.use(...standingHandlers(COORDINATOR), listHandler(ROWS))
    const page = await mountWith(HomePage, COORD_SCOPE)
    expect(page.wrapper.find('[data-kpi-source="work-items"]').exists()).toBe(true)
    expect(sent(DASHBOARD)).toHaveLength(0)
    expect(sent(LIST)[0]!.query.get('department_id')).toBe('d1')
    expect(kpiValues(page)).toEqual(['%33', '2', '0', '1'])
    expect(quickKeys(page)).toEqual(['newTask', 'meeting', 'invite'])
  })

  it('Yönetici Üye merceğinde: pano yok, "bana atananlar"; yönetici eylemleri korunur (P1)', async () => {
    server.use(...standingHandlers(ADMIN_MEMBER), listHandler(ROWS), dashboardHandler())
    const page = await mountWith(HomePage, MEMBER_SCOPE)
    expect(sent(DASHBOARD)).toHaveLength(0)
    // acc-1'e atanan iki görev (biri bitti); başkasına atanan onaydaki görev sayılmaz.
    expect(kpiValues(page)).toEqual(['%50', '1', '0', '0'])
    expect(quickKeys(page)).toEqual(['newTask', 'meeting', 'invite'])
  })

  it('salt üye: hızlı işlemler kartı ve "Yeni görev" DOM’da yok', async () => {
    server.use(...standingHandlers(MEMBER), listHandler(ROWS))
    const page = await mountWith(HomePage, MEMBER_SCOPE)
    expect(page.wrapper.find('[data-region="quick"]').exists()).toBe(false)
    expect(page.wrapper.text()).not.toContain('Yeni görev')
    expect(page.wrapper.find('[data-region="recent"]').exists()).toBe(true)
  })

  it('kapsam eksik (birim seçilmedi): seçim notu; kapsamlı istek yok', async () => {
    server.use(...standingHandlers(COORDINATOR), listHandler(ROWS), dashboardHandler())
    const page = await mountWith(HomePage, {
      programId: 'p1',
      lens: 'coordinator',
      departmentId: null,
    })
    expect(page.wrapper.text()).toContain('Kapsam seçin')
    expect(sent(LIST)).toHaveLength(0)
    expect(sent(DASHBOARD)).toHaveLength(0)
    expect(page.wrapper.get('[data-testid="home-greeting"]').text()).toBe('Merhaba Ayşe Nur Yılmaz')
  })
})
