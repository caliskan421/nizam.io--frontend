// W142 · O3 senaryo 2: 09b toplantı detayı ve K7 — "Toplantı raporu (PDF)" yetkisi (ŞY + sahip/dahil
// departman koordinatörü), "Önizle" yalnız ŞY → 01g; MeetingReportButton'un gerçek bileşenle bağı
// (W138 TASLAK: `MeetingDetailPage.test.ts`, `MeetingDetailPage.delete.test.ts` vi.mock reports/public).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  ADMIN,
  boot,
  captureSaves,
  byText,
  COORD,
  idle,
  issued,
  MEMBER,
  OTHER_COORD,
  reports,
  resetReports,
  teardown,
  toasts,
  until,
  useReportsBackend,
  userClick,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const saved: string[] = []
const PDF = () => byText('[data-testid="meeting-report"] button', 'Toplantı raporu (PDF)')
const PREVIEW = () => $('[data-action="preview-meeting"]')
const STAGE = () => $('[data-testid="meeting-stage"]')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/toplantilar/m1' })
  await until(PDF, 'ısınma')
  teardown()
  await boot({ ...ADMIN, path: '/toplantilar/m1/rapor' })
  await until(STAGE, 'ısınma 01g')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  saved.length = 0
  captureSaves(saved)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('düğme görünürlüğü (sunucu SÜZMEDEN toplantıyı döner; süzme istemcide)', () => {
  it('yönetici: PDF + Önizle; bilet yolu /v1/reports/meetings/m1/pdf, program başlığı + CSRF', async () => {
    const app = await boot({ ...ADMIN, path: '/toplantilar/m1' })
    await until(PDF, 'düğme')
    expect(PREVIEW()).not.toBeNull()
    await userClick(PDF)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(issued()[0]!.body).toEqual({ method: 'GET', path: '/v1/reports/meetings/m1/pdf' })
    expect(issued()[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issued()[0]!.headers.get('X-Requested-With')).toBeTruthy()
    expect(toasts()).toContain('indirildi')
  })

  it('yönetici K merceğinde de görür (P1: mercek ≠ yetki)', async () => {
    await boot({ ...ADMIN, scope: COORD.scope, path: '/toplantilar/m1' })
    await until(PDF, 'düğme')
    expect(PREVIEW()).not.toBeNull()
  })

  it('sahip departman koordinatörü (K7): yalnız PDF, Önizle yok', async () => {
    const app = await boot({ ...COORD, path: '/toplantilar/m1' })
    await until(PDF, 'düğme')
    await idle(app.queryClient)
    expect(PREVIEW()).toBeNull()
  })

  it('dahil departman koordinatörü görür; başka departmanın koordinatörü görmez', async () => {
    reports.state.meetings[0]!.department_ids = ['d1', 'd2']
    await boot({ ...OTHER_COORD, path: '/toplantilar/m1' })
    await until(PDF, 'dahil koordinatör düğmesi')
    teardown()
    reports.state.meetings[0]!.department_ids = ['d1']
    const app = await boot({ ...OTHER_COORD, path: '/toplantilar/m1' })
    await until(() => $('.meeting-detail, [data-testid="meeting-detail"], main h1'), 'detay')
    await idle(app.queryClient)
    expect($('[data-testid="meeting-report"]')).toBeNull()
  })

  it('üye düğme görmez', async () => {
    const app = await boot({ ...MEMBER, path: '/toplantilar/m1' })
    await until(() => $('main h1'), 'detay')
    await idle(app.queryClient)
    expect($('[data-testid="meeting-report"]')).toBeNull()
  })

  it('403 not_authorized yanlış pozitif (K7): kart; düğme gizlenir (me yenilenir)', async () => {
    reports.state.redeem = 'not_authorized'
    const app = await boot({ ...COORD, path: '/toplantilar/m1' })
    await userClick(PDF)
    await until(() => backend.sent('GET', '/v1/me').length > 1, 'me yenilendi')
    await idle(app.queryClient)
    expect(saved).toHaveLength(0)
  })

  it('404 reporting.not_found: "Kayıt bulunamadı" bildirimi + toplantı okumaları tazelenir', async () => {
    reports.state.redeem = 'not_found'
    const app = await boot({ ...ADMIN, path: '/toplantilar/m1' })
    await until(PDF, 'düğme')
    const before = backend.sent('GET', '/v1/meetings/m1').length
    await userClick(PDF)
    await until(() => toasts().includes('Kayıt bulunamadı'), 'bildirim')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/meetings/m1').length).toBeGreaterThan(before)
  })
})

describe('01g toplantı raporu önizlemesi', () => {
  it('"Önizle" → /toplantilar/m1/rapor; reportMeetingDetail yalnız açılınca; canlı künye/notlar/dönüştürülenler', async () => {
    const app = await boot({ ...ADMIN, path: '/toplantilar/m1' })
    await until(PDF, 'düğme')
    expect(backend.sent('GET', '/v1/reports/meetings/m1')).toHaveLength(0)
    await userClick(PREVIEW)
    await until(STAGE, 'önizleme')
    expect(app.router.currentRoute.value.path).toBe('/toplantilar/m1/rapor')
    expect(backend.sent('GET', '/v1/reports/meetings/m1')).toHaveLength(1)
    const text = STAGE()!.textContent ?? ''
    expect(text).toContain('Kazı yüzde 60 tamamlandı.')
    expect(text).toContain('GÖREVE DÖNÜŞTÜRÜLENLER')
    expect(text).toContain('Ek beton ekibi')
    expect(text).toContain('(silinmiş)')
    expect(byText('a, button', 'Toplantıya git')).not.toBeNull()
  })

  it('"Toplantıya git" detaya, "Kapat" detaya döner ve odak "Önizle" bağlantısına gider', async () => {
    const app = await boot({ ...ADMIN, path: '/toplantilar/m1' })
    await until(PDF, 'düğme')
    await userClick(PREVIEW)
    await until(STAGE, 'önizleme')
    await userClick('[data-action="go-to"]')
    await until(() => app.router.currentRoute.value.path === '/toplantilar/m1', 'detay')
    await until(PDF, 'detay düğmesi')
    await userClick(PREVIEW)
    await until(STAGE, 'önizleme 2')
    await userClick('[data-action="close"]')
    await until(() => app.router.currentRoute.value.path === '/toplantilar/m1', 'detay 2')
    await until(() => document.activeElement === PREVIEW(), 'odak Önizle bağlantısında')
  })

  it('tasarım notu "Tetikleyiciler" kartı çizilmez (E-13-54 ret; W142 KUSUR 2)', async () => {
    await boot({ ...ADMIN, path: '/toplantilar/m1/rapor' })
    await until(STAGE, 'önizleme')
    expect(document.body.textContent).not.toContain('Tetikleyiciler')
    expect(document.body.textContent).not.toContain('Üye için rapor ucu yok')
  })

  it('koordinatör adresi yazarsa 01g okunmaz; ana sayfaya + erişim yok bildirimi (REPORTING-K01)', async () => {
    const app = await boot({ ...COORD, path: '/toplantilar/m1/rapor' })
    await until(() => app.router.currentRoute.value.name === 'home', 'yönlendi')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/reports/meetings/m1')).toHaveLength(0)
  })

  it('silinmiş/kapsam dışı toplantı 404: bölge içi hata', async () => {
    await boot({ ...ADMIN, path: '/toplantilar/yok/rapor' })
    await until(() => document.body.textContent?.includes('Toplantı raporu okunamadı'), 'hata')
  })
})
