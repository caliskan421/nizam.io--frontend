import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  dashboardHandler,
  DASHBOARD,
  COUNTS,
  countsHandler,
  LIST,
  MEMBER_SCOPE,
  mountWith,
  resetAll,
  row,
  sent,
  server,
  settle,
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

describe('01 Ana sayfa — sayfa seçici ve F1 gövdesi', () => {
  it('selamlama tam full_name (ilk sözcük değil); "Son işlemler" nötr yer tutucu (BE-010)', async () => {
    server.use(...standingHandlers(ADMIN), dashboardHandler())
    const page = await mountWith(HomePage, ADMIN_SCOPE)
    expect(page.wrapper.get('[data-testid="home-greeting"]').text()).toBe('Merhaba Ayşe Nur Yılmaz')
    expect(page.wrapper.find('ol.rp-timeline').exists()).toBe(false)
    expect(page.wrapper.find('[data-design-stub="BE-010"]').exists()).toBe(true)
  })

  it('sayfa seçici (P53): yönetici → yönetici sayfası; yönetici olmayan → rol taslağı, F6 bölgeleri yok', async () => {
    server.use(...standingHandlers(ADMIN), dashboardHandler())
    const admin = await mountWith(HomePage, ADMIN_SCOPE)
    expect(admin.wrapper.get('[data-testid="home-page"]').attributes('data-home')).toBe('admin')
    resetAll()
    server.use(...standingHandlers(COORDINATOR), countsHandler(ROWS))
    const coordinator = await mountWith(HomePage, COORD_SCOPE)
    const page = coordinator.wrapper.get('[data-testid="home-page"]')
    expect(page.attributes('data-home')).toBe('role-draft')
    for (const region of ['team', 'coords', 'footer']) {
      expect(coordinator.wrapper.find(`[data-region="${region}"]`).exists(), region).toBe(false)
    }
    expect(coordinator.wrapper.text()).not.toContain('Rapor oluştur')
  })

  it('E-01-02 (F5, P36): yönetici "Silinen kayıtlar ‹deleted_records›" düğmesini görür, hedef /silinen-kayitlar', async () => {
    server.use(...standingHandlers(ADMIN), dashboardHandler())
    const page = await mountWith(HomePage, ADMIN_SCOPE)
    const button = page.wrapper.get('[data-testid="home-deleted-records"]')
    expect(button.text()).toContain('Silinen kayıtlar')
    expect(button.find('.rp-count').text()).toBe('127')
    expect(button.attributes('href')).toBe('/silinen-kayitlar')
    // BE-119: sayı uyuşmazlığı düzeltilmez, açıklanır.
    expect(button.attributes('title')).toContain('farklı olabilir')
    expect(sent(DASHBOARD)).toHaveLength(1)
    await button.trigger('click')
    await settle()
    expect(page.router.currentRoute.value.name).toBe('deleted-records.list')
  })

  it('E-01-02: yönetici Koordinatör merceğinde de düğmeyi görür; sayı program geneli panodan (P1/P53)', async () => {
    server.use(
      ...standingHandlers({ ...ADMIN, rows: [{ department_id: 'd1', role: 'koordinator' }] }),
      countsHandler(ROWS),
      dashboardHandler(),
    )
    const page = await mountWith(HomePage, COORD_SCOPE)
    const button = page.wrapper.get('[data-testid="home-deleted-records"]')
    expect(button.find('.rp-count').text()).toBe('127')
    expect(sent(DASHBOARD)).toHaveLength(1)
  })

  it.each([
    ['koordinatör', COORDINATOR, COORD_SCOPE],
    ['salt üye', MEMBER, MEMBER_SCOPE],
  ] as const)('E-01-02: %s için düğme DOM’da yok', async (_name, fixture, scope) => {
    server.use(...standingHandlers(fixture), countsHandler(ROWS))
    const page = await mountWith(HomePage, scope)
    expect(page.wrapper.find('[data-testid="home-deleted-records"]').exists()).toBe(false)
    expect(page.wrapper.text()).not.toContain('Silinen kayıtlar')
  })

  it('Admin merceği: KPI pano ucundan; görev listesi istenmez; üç hızlı işlem', async () => {
    server.use(...standingHandlers(ADMIN), dashboardHandler())
    const page = await mountWith(HomePage, ADMIN_SCOPE)
    expect(page.wrapper.find('[data-kpi-source="dashboard"]').exists()).toBe(true)
    expect(kpiValues(page)).toEqual(['%49', '40', '15', '3'])
    expect(sent(DASHBOARD)).toHaveLength(1)
    expect(sent(LIST)).toHaveLength(0)
    expect(quickKeys(page)).toEqual(['newTask', 'meeting', 'invite', 'report'])
  })

  it('Koordinatör merceği: KPI seçili birim sayaçlarından; pano ve liste ÇAĞRILMAZ', async () => {
    server.use(...standingHandlers(COORDINATOR), countsHandler(ROWS))
    const page = await mountWith(HomePage, COORD_SCOPE)
    expect(page.wrapper.find('[data-kpi-source="work-counts"]').exists()).toBe(true)
    expect(sent(DASHBOARD)).toHaveLength(0)
    expect(sent(LIST)).toHaveLength(0)
    expect(sent(COUNTS)[0]!.query.get('department_id')).toBe('d1')
    expect(kpiValues(page)).toEqual(['%33', '2', '0', '1'])
    expect(quickKeys(page)).toEqual(['newTask', 'meeting', 'invite'])
  })

  it('Yönetici Üye merceğinde: pano yok, "bana atananlar"; yönetici eylemleri korunur (P1)', async () => {
    server.use(...standingHandlers(ADMIN_MEMBER), countsHandler(ROWS), dashboardHandler())
    const page = await mountWith(HomePage, MEMBER_SCOPE)
    // Pano yalnız program geneli yönetici bölgeleri için (P53); KPI birim sayaçlarından.
    expect(page.wrapper.find('[data-kpi-source="dashboard"]').exists()).toBe(false)
    expect(sent(DASHBOARD)).toHaveLength(1)
    // Sunucu süzgeci (assignee_account_id=ben): acc-1'e atanan iki görev (biri bitti); başkasına
    // atanan onaydaki görev sayılmaz.
    expect(kpiValues(page)).toEqual(['%50', '1', '0', '0'])
    expect(quickKeys(page)).toEqual(['newTask', 'meeting', 'invite', 'report'])
  })

  it('salt üye: hızlı işlemler kartı ve "Yeni görev" DOM’da yok', async () => {
    server.use(...standingHandlers(MEMBER), countsHandler(ROWS))
    const page = await mountWith(HomePage, MEMBER_SCOPE)
    expect(page.wrapper.find('[data-region="quick"]').exists()).toBe(false)
    expect(page.wrapper.text()).not.toContain('Yeni görev')
    expect(page.wrapper.find('[data-region="recent"]').exists()).toBe(true)
  })

  it('kapsam eksik (birim seçilmedi): seçim notu; kapsamlı istek yok', async () => {
    server.use(...standingHandlers(COORDINATOR), countsHandler(ROWS), dashboardHandler())
    const page = await mountWith(HomePage, {
      programId: 'p1',
      lens: 'coordinator',
      departmentId: null,
    })
    expect(page.wrapper.text()).toContain('Kapsam seçin')
    expect(sent(COUNTS)).toHaveLength(0)
    expect(sent(DASHBOARD)).toHaveLength(0)
    expect(page.wrapper.get('[data-testid="home-greeting"]').text()).toBe('Merhaba Ayşe Nur Yılmaz')
  })
})
