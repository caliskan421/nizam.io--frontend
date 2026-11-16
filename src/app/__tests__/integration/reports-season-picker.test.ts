// W142 · O3 senaryo 1 (b): "Bölüm seç…" penceresi (canlı, BE-122 — W172), dönem ZIP'i (BE-120 canlı, W171) ve
// odak dönüşü; gerçek router/AppShell/oturum.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  captureSaves,
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
  captureSaves(saved)
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

  it('bir kutu kaldırılınca "Seçilenleri indir" etkin: bilet hedefi seçili bölümleri taşır; eski yol (sahte devre dışı/yakında) yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    ;($$('[data-section]')[0] as HTMLInputElement).click()
    await until(
      () => !$('[role="dialog"] [data-design-stub="BE-122"]') && !CONFIRM()!.disabled,
      'etkin',
    )
    expect(DIALOG()!.textContent).not.toContain('yakında')
    await userClick(CONFIRM)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(issued()).toHaveLength(1)
    expect(issued()[0]!.body).toEqual({
      method: 'GET',
      path: '/v1/reports/season/pdf?sections=gantt,general,tasks,details,meetings,files,appendix',
    })
  })

  it('hiçbir bölüm seçili değilken gönderme engellenir: ağ isteği yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    for (const box of $$('[data-section]')) {
      const input = box as HTMLInputElement
      if (input.checked && input.dataset.section !== 'departments') input.click()
    }
    await until(() => CONFIRM()!.disabled, 'devre dışı')
    expect($('[role="dialog"] [role="status"]')).not.toBeNull()
    CONFIRM()!.click()
    await idle(app.queryClient)
    expect(issued()).toHaveLength(0)
  })

  it('koordinatörlük çipleri programdan, etkin; çip süzgeci department_ids olarak biletlenir; kapanıp açılınca seçim hatırlanmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await openPicker()
    await until(() => $$('.report-chip').length === 3, 'çipler: Tümü + MEK + YAZ')
    expect($$('.report-chip').every((c) => !(c as HTMLButtonElement).disabled)).toBe(true)
    expect($$('.report-chip').map((c) => c.textContent?.trim())).toEqual(['Tümü', 'MEK', 'YAZ'])
    ;($$('.report-chip')[1] as HTMLButtonElement).click()
    await until(() => $$('.report-chip')[1]!.getAttribute('aria-pressed') === 'true', 'MEK basılı')
    await userClick(CONFIRM)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect((issued()[0]!.body as { path: string }).path).toMatch(
      /^\/v1\/reports\/season\/pdf\?department_ids=d1$/,
    )
    await openPicker()
    expect($$('.report-chip')[0]!.getAttribute('aria-pressed')).toBe('true')
    ;($$('[data-section]')[1] as HTMLInputElement).click()
    press(DIALOG()!, 'Escape')
    await until(() => DIALOG() === null, 'kapandı')
    await openPicker()
    expect($$('[data-section]').every((el) => (el as HTMLInputElement).checked)).toBe(true)
  })

  it('sunucu 422 reporting.input_invalid (küme dışı bölüm) → kullanıcıya hata kartı, ağ tekrarı yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    reports.state.redeem = 'input_invalid'
    await openPicker()
    ;($$('[data-section]')[0] as HTMLInputElement).click()
    await userClick(CONFIRM)
    await until(() => $('[data-testid="report-card"]'), 'hata kartı')
    await idle(app.queryClient)
    expect(saved).toHaveLength(0)
    expect(issued()).toHaveLength(1)
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
  it('"Dönem arşivi (ZIP)" etkin (BE-120 stub yok); tıklama yalnız onay penceresini açar, bilet/indirme üretmez', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    const zip = await until(() => byText('button', 'Dönem arşivi (ZIP)'), 'ZIP düğmesi')
    expect((zip as HTMLButtonElement).disabled).toBe(false)
    expect(zip.closest('[data-design-stub="BE-120"]')).toBeNull()
    zip.click()
    await until(() => $('[data-testid="period-zip-dialog"]'), 'onay penceresi')
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(0)
    expect(reports.state.redeemed).toHaveLength(0)
  })

  it.each([
    ['koordinatör', COORD, '[data-testid="archive-folder-page"]'],
    ['üye', MEMBER, '[data-testid="archive-folder-page"]'],
  ])(
    "rapor eylemleri yalnız yöneticide: %s /arsiv'de dönem düğmesi görmez",
    async (_n, who, page) => {
      const app = await boot({ ...who, path: '/arsiv' })
      await until(() => $(page), 'arşiv klasör sayfası')
      await idle(app.queryClient)
      expect(byText('button', 'Dönem sonu raporu (PDF)')).toBeNull()
      expect($('[data-action="pick-sections"]')).toBeNull()
      expect($('[data-action="preview-season"]')).toBeNull()
    },
  )
})
