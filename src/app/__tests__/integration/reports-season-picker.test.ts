// W142 · O3 senaryo 1 (b): "Bölüm seç…" penceresi (statik, BE-122), dönem ZIP'i (BE-120 stub) ve
// odak dönüşü; gerçek router/AppShell/oturum.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  COORD,
  MEMBER,
  byText,
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
const TRIGGER = () => $('[data-action="pick-sections"]')
const DIALOG = () => $('[role="dialog"]')
const CONFIRM = () => $('[role="dialog"] [data-action="confirm"]') as HTMLButtonElement | null

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/arsiv' })
  await until(TRIGGER, 'ısınma')
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
afterEach(() => teardown())
afterAll(() => backend.server.close())

const press = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

async function openPicker() {
  await userClick(TRIGGER)
  await until(DIALOG, 'pencere')
}

describe('bölüm seçimi penceresi', () => {
  it('hepsi seçili açılır: "Seçilenleri indir" düz dönem PDF indirmesini başlatır, pencere kapanır, kart ana düğmede', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    expect($$('[data-section]').every((el) => (el as HTMLInputElement).checked)).toBe(true)
    expect(CONFIRM()!.disabled).toBe(false)
    await userClick(CONFIRM)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(DIALOG()).toBeNull()
    expect(issued()).toHaveLength(1)
    expect(issued()[0]!.body).toEqual({ method: 'GET', path: '/v1/reports/season/pdf' })
    expect(document.activeElement).toBe(TRIGGER())
    expect(toasts()).toContain('indirildi')
  })

  it('bir kutu kaldırılınca indirme devre dışı + açıklama + yakında; ağ isteği ve sahte kısmi PDF yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    const box = $$('[data-section]')[0] as HTMLInputElement
    box.click()
    await until(() => CONFIRM()!.disabled, 'devre dışı')
    expect($('[role="dialog"] [data-design-stub="BE-122"]')).not.toBeNull()
    expect($('[role="dialog"] [role="status"]')).not.toBeNull()
    CONFIRM()!.click()
    await idle(app.queryClient)
    expect(issued()).toHaveLength(0)
    // Kutu geri işaretlenince yeniden etkin.
    box.click()
    await until(() => !CONFIRM()!.disabled, 'yeniden etkin')
  })

  it('koordinatörlük çipleri programdan, devre dışı; kapanıp açılınca seçim hatırlanmaz', async () => {
    await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    const chips = $$('.report-chip')
    await until(() => $$('.report-chip').length === 3, 'çipler: Tümü + MEK + YAZ')
    expect(chips.length).toBeGreaterThan(0)
    expect($$('.report-chip').every((c) => (c as HTMLButtonElement).disabled)).toBe(true)
    expect($$('.report-chip').map((c) => c.textContent?.trim())).toEqual(['Tümü', 'MEK', 'YAZ'])
    ;($$('[data-section]')[1] as HTMLInputElement).click()
    await until(() => CONFIRM()!.disabled, 'kısmi')
    press(DIALOG()!, 'Escape')
    await until(() => DIALOG() === null, 'kapandı')
    await openPicker()
    expect($$('[data-section]').every((el) => (el as HTMLInputElement).checked)).toBe(true)
  })

  it.each([
    ['Esc', () => press(DIALOG()!, 'Escape')],
    ['✕', () => ($('[role="dialog"] .t-modal__head button') as HTMLElement).click()],
    ['Vazgeç', () => ($('[role="dialog"] [data-action="cancel"]') as HTMLElement).click()],
  ])('%s ile kapanınca odak "Bölüm seç…" düğmesine döner', async (_name, close) => {
    await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    close()
    await until(() => DIALOG() === null, 'kapandı')
    expect(document.activeElement).toBe(TRIGGER())
  })
})

describe('dönem ZIP ve eylem şeridi', () => {
  it('"Dönem arşivi (ZIP)" devre dışı BE-120 stub; tıklama ağ isteği üretmez', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    const zip = await until(() => byText('button', 'Dönem arşivi (ZIP)'), 'ZIP düğmesi')
    expect((zip as HTMLButtonElement).disabled).toBe(true)
    expect(zip.closest('[data-design-stub="BE-120"]')).not.toBeNull()
    zip.click()
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(0)
    expect(reports.state.redeemed).toHaveLength(0)
  })

  it.each([
    ['koordinatör', COORD, '[data-testid="archive-folder-page"]'],
    ['üye', MEMBER, '[data-testid="archive-folder-page"]'],
  ])('rapor eylemleri yalnız yöneticide: %s /arsiv\'de dönem düğmesi görmez', async (_n, who, page) => {
    const app = await boot({ ...who, path: '/arsiv' })
    await until(() => $(page), 'arşiv klasör sayfası')
    await idle(app.queryClient)
    expect(byText('button', 'Dönem sonu raporu (PDF)')).toBeNull()
    expect($('[data-action="pick-sections"]')).toBeNull()
    expect($('[data-action="preview-season"]')).toBeNull()
  })
})
