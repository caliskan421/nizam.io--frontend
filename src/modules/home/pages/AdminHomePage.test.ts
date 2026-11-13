import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  COUNTS,
  countsHandler,
  dashboard,
  DASHBOARD,
  errorEnvelope,
  http,
  mountWith,
  ORIGIN,
  requests,
  resetAll,
  row,
  sent,
  server,
  settle,
  standingHandlers,
  stat,
  type StandingFixture,
} from '../__tests__/harness'
import AdminHomePage from './AdminHomePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }
const ADMIN_COORD: StandingFixture = {
  companyAdmin: true,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}

const STATS = [
  stat('a', 'İdari işler', { overdue_tasks: 4, coordinators: [] }),
  stat('b', 'Altyapı ve tesisat', { overdue_tasks: 3 }),
  stat('c', 'Çevre', { overdue_tasks: 0 }),
]
const REPORT = dashboard({
  total_users: 18,
  total_coordinatorships: 3,
  total_admins: 2,
  total_coordinators: 15,
  total_members: 3,
  coordinatorship_stats: STATS,
})
const dashboardOk = () => http.get(`${ORIGIN}${DASHBOARD}`, () => Response.json(REPORT))

describe('01 yönetici sayfası — F6 bölgeleri (E-01-12, 19…39; P53)', () => {
  it('Admin merceği: tek pano isteğiyle KPI + ekip şeridi + kartlar + alt bilgi; ikinci rapor isteği yok', async () => {
    server.use(...standingHandlers(ADMIN), dashboardOk())
    const { wrapper } = await mountWith(AdminHomePage, ADMIN_SCOPE)
    expect(sent(DASHBOARD)).toHaveLength(1)
    expect(wrapper.find('[data-kpi-source="dashboard"]').exists()).toBe(true)
    expect(wrapper.get('[data-team-users]').text()).toBe('18')
    expect(wrapper.findAll('article.home-ccard')).toHaveLength(STATS.length)
    expect(wrapper.get('footer').text()).toBe(
      '3 koordinatörlük · 18 kullanıcı (2 admin, 15 koordinatör, 3 üye)',
    )
    // Bölge sırası: KPI, hızlı işlemler/son işlemler, ekip, koordinatörlükler, alt bilgi.
    const order = [
      '[data-region="kpi"]',
      '[data-region="quick"]',
      '[data-region="team"]',
      '[data-region="coords"]',
      '[data-region="footer"]',
    ].map((sel) => wrapper.get(sel).element)
    for (let i = 1; i < order.length; i += 1) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
        `bölge ${i}`,
      ).toBeTruthy()
    }
  })

  it('mercek değişimi yönetici bölgelerini düşürmez: Koordinatör merceğinde de program geneli kartlar (E-01-28, P53)', async () => {
    server.use(
      ...standingHandlers(ADMIN_COORD),
      countsHandler([row('devam_ediyor')]),
      dashboardOk(),
    )
    const { wrapper } = await mountWith(AdminHomePage, COORD_SCOPE)
    expect(wrapper.findAll('article.home-ccard')).toHaveLength(STATS.length)
    expect(wrapper.find('[data-region="team"]').exists()).toBe(true)
    // KPI birim sayaçlarından (içerik merceğe göre), bölgeler panodan.
    expect(sent(COUNTS)).toHaveLength(1)
    expect(wrapper.find('[data-kpi-source="dashboard"]').exists()).toBe(false)
    expect(sent(DASHBOARD)).toHaveLength(1)
  })

  it('arşiv sayısı için ikinci istek yok (S3 başlığı yok, BE-072); kartta "—"', async () => {
    server.use(...standingHandlers(ADMIN), dashboardOk())
    const { wrapper } = await mountWith(AdminHomePage, ADMIN_SCOPE)
    expect(requests.filter((r) => r.path.includes('/records/archive'))).toHaveLength(0)
    expect(wrapper.findAll('[data-testid="archive"]').map((n) => n.text())).toEqual(['—', '—', '—'])
  })

  it('"Rapor oluştur" kutucuğu yöneticide görünür; menü açılır, ağ isteği atmaz (E-01-12)', async () => {
    server.use(...standingHandlers(ADMIN), dashboardOk())
    const { wrapper } = await mountWith(AdminHomePage, ADMIN_SCOPE)
    const before = requests.length
    await wrapper.get('[data-quick="report"]').trigger('click')
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(4)
    expect(requests).toHaveLength(before)
  })

  it('pano hatası: ekip ve kartlar bölge içi hata + yeniden dene; sayfa düşmez, retry yeniden okur', async () => {
    let fail = true
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${DASHBOARD}`, () =>
        fail ? errorEnvelope('internal', 500) : Response.json(REPORT),
      ),
    )
    const { wrapper } = await mountWith(AdminHomePage, ADMIN_SCOPE)
    expect(wrapper.get('[data-testid="home-greeting"]').text()).toContain('Merhaba')
    expect(wrapper.get('[data-region="team"]').attributes('role')).toBe('alert')
    expect(wrapper.get('[data-region="coords"] [role="alert"]').text()).toContain(
      'Koordinatörlükler yüklenemedi',
    )
    expect(wrapper.find('[data-region="footer"]').exists()).toBe(false)
    fail = false
    const retry = wrapper.get('[data-region="coords"] [role="alert"] button')
    await retry.trigger('click')
    await settle()
    expect(wrapper.findAll('article.home-ccard')).toHaveLength(STATS.length)
  })
})
