// W142 · O3 senaryo 1 (a): 06 Arşiv "Dönem sonu raporu (PDF)" gerçek router/AppShell/oturum ile:
// bilet → tüketim → kayıt → bildirim; hazırlanırken kilit; 429/503/403/bilet 404 durum kartları.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  boot,
  byText,
  hold,
  idle,
  issued,
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
const PDF_BUTTON = () => byText('button', 'Dönem sonu raporu (PDF)')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/arsiv' })
  await until(PDF_BUTTON, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  saved.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push(this.download)
  })
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

const card = () => $('.report-action')?.textContent ?? ''

describe('dönem sonu PDF (06 Arşiv)', () => {
  it('bilet program başlığı + CSRF ile üretilir, tüketilir, dosya adıyla kaydedilir ve bildirilir', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick(PDF_BUTTON)
    await until(() => saved.length > 0, 'kaydedildi')
    await idle(app.queryClient)
    const [ticket] = issued()
    expect(issued()).toHaveLength(1)
    expect(ticket!.body).toEqual({ method: 'GET', path: '/v1/reports/season/pdf' })
    expect(ticket!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(ticket!.headers.get('X-Requested-With')).toBeTruthy()
    expect(ticket!.headers.get('Idempotency-Key')).toBeNull()
    expect(reports.state.redeemed).toEqual(['rt-1'])
    expect(saved).toEqual(['donem-raporu-2026.pdf'])
    expect(toasts()).toContain('donem-raporu-2026.pdf indirildi')
  })

  it('hazırlanırken düğme kilitli: ikinci tıklama ikinci bilet üretmez', async () => {
    const gate = hold('GET', '/v1/downloads/rt-1')
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick(PDF_BUTTON)
    await gate.arrived
    await until(() => byText('button', 'Hazırlanıyor'), 'hazırlanıyor')
    const busy = byText('button', 'Hazırlanıyor') as HTMLButtonElement
    expect(busy.disabled).toBe(true)
    expect(busy.getAttribute('aria-busy')).toBe('true')
    busy.click()
    await idle(app.queryClient)
    expect(issued()).toHaveLength(1)
    gate.release()
    await until(() => saved.length === 1, 'kaydedildi')
    expect(issued()).toHaveLength(1)
  })

  it('429 export_in_progress (Retry-After 1): bekleme sayacı; sayaç bitince indirme kendiliğinden başlamaz', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    reports.state.redeem = 'export_in_progress'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick(PDF_BUTTON)
    await until(() => byText('button', 'Bekleyin (1 s)'), 'sayaç')
    expect(card()).toContain('Zaten bir rapor hazırlanıyor')
    expect((byText('button', 'Bekleyin') as HTMLButtonElement).disabled).toBe(true)
    reports.state.redeem = 'ok'
    await vi.advanceTimersByTimeAsync(1000)
    await idle(app.queryClient)
    expect(byText('button', 'Bekleyin')).toBeNull()
    expect(issued()).toHaveLength(1)
    expect(saved).toHaveLength(0)
  })

  it('429 platform.rate_limited (bilet üretiminde, Retry-After 17): sayaç; tüketim yok', async () => {
    reports.state.issue = 'rate_limited'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick(PDF_BUTTON)
    await until(() => byText('button', 'Bekleyin (17 s)'), 'sayaç')
    await idle(app.queryClient)
    expect(issued()).toHaveLength(1)
    expect(reports.state.redeemed).toHaveLength(0)
  })

  it('503 capacity_full: sayaç yok, süresiz mesaj, "Yeniden dene"; otomatik tekrar yok', async () => {
    reports.state.redeem = 'capacity_full'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick(PDF_BUTTON)
    await until(() => card().includes('Sunucu şu an yoğun'), 'durum kartı')
    expect(byText('button', 'Yeniden dene')).not.toBeNull()
    expect(byText('button', 'Bekleyin')).toBeNull()
    await idle(app.queryClient)
    expect(issued()).toHaveLength(1)
  })

  it('403 not_authorized: me yenilenir ve sayfa yetkisiz yoluna düşer', async () => {
    reports.state.redeem = 'not_authorized'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    const before = backend.sent('GET', '/v1/me').length
    const beforeDepartments = backend.sent('GET', '/v1/me/departments').length
    await userClick(PDF_BUTTON)
    await until(() => backend.sent('GET', '/v1/me').length > before, 'me yenilendi')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/me/departments').length).toBeGreaterThan(beforeDepartments)
    expect(app.scope.lens).not.toBe('admin')
    expect(backend.sent('GET', '/v1/me').length).toBeGreaterThan(before)
    expect(byText('button', 'Dönem sonu raporu (PDF)')).toBeNull()
  })

  it('bilet 404 (ömrünü doldurdu): yeni bilet alınmaz, hata gösterilir', async () => {
    reports.state.redeem = 'ticket_invalid'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick(PDF_BUTTON)
    await until(() => $('.report-action [role="alert"], .report-action [role="status"]'), 'hata')
    await idle(app.queryClient)
    expect(issued()).toHaveLength(1)
    expect(reports.state.redeemed).toEqual(['rt-1'])
    expect(saved).toHaveLength(0)
  })
})
