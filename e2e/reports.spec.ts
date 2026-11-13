// F6 duman senaryosu (W142 · O3): rapor eylemleri gerçek uygulama yığınında (üretim paketi + üretim
// CSP'si) gerçek backend'e karşı — 06 Arşiv "Dönem sonu raporu (PDF)" bilet akışı + indirme, "Bölüm
// seç…" penceresi (390 px'te tam ekran, alt düğmeler yapışık), "Önizle" → 01f, 05 "İş yükü raporu
// (PDF)", 01 "Rapor oluştur" menüsü. Toplantı/görev raporları entegrasyon testlerindedir
// (`src/app/__tests__/integration/reports-*.test.ts`); gerçek backend fixture'ı toplantı/görev kurmaz.
import { expect, test, type Page } from '@playwright/test'

import { cspViolations, describeViolations, enforceCaddyCsp } from './csp-check'
import { ADMIN, readFixture } from './fixture'
import { storageHasOnlyAllowedKeys } from './storage-check'

/** Kapsam tercihi (izinli anahtarlar, K2): çok program olan e2e veritabanında seçim beklenmesin. */
async function rememberScope(page: Page, programId: string): Promise<void> {
  await page.addInitScript((id) => {
    window.localStorage.setItem('nizamio.pref.scope.programId', id)
    window.localStorage.setItem('nizamio.pref.scope.lens', 'admin')
  }, programId)
}

async function signIn(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByTestId('session-status')).toHaveAttribute('data-status', 'anonymous')
  await page.locator('input[name="email"]').fill(ADMIN.email)
  await page.locator('input[name="password"]').fill(ADMIN.password)
  await page.getByRole('button', { name: 'giriş' }).click()
  // Giriş sonrası kapının yönlendirdiği rotaya (ana sayfa) dönülür (W145 KUSUR 1).
  await expect(page.getByTestId('app-shell')).toBeVisible()
}

/** Üretim CSP'sinde ihlal 0 (şimdiki belge; her tam gezinme yeni belge ve yeni toplayıcıdır). */
async function expectNoViolations(page: Page, where: string): Promise<void> {
  const violations = await cspViolations(page)
  expect(violations, describeViolations(where, violations)).toEqual([])
}

/** Tam gezinme (bellek sıfırlanır): oturum HttpOnly çerezle sessiz refresh ile döner. */
async function open(page: Page, path: string): Promise<void> {
  const refreshed = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.goto(path)
  expect((await refreshed).status()).toBe(200)
  await expect(page.getByTestId('app-shell')).toBeVisible()
}

test('F6 raporlar: dönem PDF indirme, bölüm seçimi, önizleme, iş yükü PDF, Rapor oluştur menüsü', async ({
  page,
}) => {
  const fixture = readFixture()
  await enforceCaddyCsp(page)
  await rememberScope(page, fixture.programId)
  await signIn(page)

  // 06 Arşiv: bilet program başlığı + CSRF ile üretilir, hemen tüketilir, PDF kaydedilir.
  await open(page, '/arsiv')
  const pdfButton = page.getByRole('button', { name: 'Dönem sonu raporu (PDF)' })
  await expect(pdfButton).toBeVisible()
  const ticket = page.waitForRequest(
    (r) => r.url().endsWith('/v1/download-tickets') && r.method() === 'POST',
  )
  const download = page.waitForEvent('download')
  await pdfButton.click()
  const issued = await ticket
  expect(issued.postDataJSON()).toEqual({ method: 'GET', path: '/v1/reports/season/pdf' })
  expect(issued.headers()['x-nizamio-program']).toBe(fixture.programId)
  expect(issued.headers()['x-requested-with']).toBeTruthy()
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/i)
  await expect(page.getByTestId('report-card').getByText(/\.pdf indirildi/)).toBeVisible()
  await expectNoViolations(page, '/arsiv')

  // "Dönem arşivi (ZIP)" yönetici için BE-120 ile devre dışıdır (ağ isteği yok).
  await expect(page.getByRole('button', { name: 'Dönem arşivi (ZIP)' })).toBeDisabled()

  // 390 px: "Bölüm seç…" penceresi tam ekran, alt düğmeler yapışık (E-13-12).
  await page.setViewportSize({ width: 390, height: 844 })
  const picker = page.locator('[data-action="pick-sections"]')
  await picker.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(Math.round(box!.x)).toBe(0)
  expect(Math.round(box!.width)).toBe(390)
  expect(Math.round(box!.height)).toBe(844)
  const confirm = dialog.locator('[data-action="confirm"]')
  const confirmBox = await confirm.boundingBox()
  expect(confirmBox!.y + confirmBox!.height).toBeLessThanOrEqual(844)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(picker).toBeFocused()
  await page.setViewportSize({ width: 1280, height: 800 })

  // Önizle → 01f: reportSeason yalnız sayfa açılınca; kâğıt çizilir.
  const season = page.waitForResponse(
    (r) => r.url().endsWith('/v1/reports/season') && r.request().method() === 'GET',
  )
  await page.locator('[data-action="preview-season"]').click()
  expect((await season).status()).toBe(200)
  await expect(page.getByTestId('season-stage')).toBeVisible()
  await expectNoViolations(page, '/arsiv/donem-raporu')
  await page.locator('[data-action="close"]').click()
  await expect(page.locator('[data-action="preview-season"]')).toBeFocused()

  // 05 Kullanıcılar: seçim yokken açık boş dizi gövdeli POST bileti, PDF kaydedilir.
  await open(page, '/kullanicilar')
  const workload = page.getByRole('button', { name: 'İş yükü raporu (PDF)' })
  await expect(workload).toBeVisible()
  const workloadTicket = page.waitForRequest(
    (r) => r.url().endsWith('/v1/download-tickets') && r.method() === 'POST',
  )
  const workloadDownload = page.waitForEvent('download')
  await workload.click()
  expect((await workloadTicket).postDataJSON()).toEqual({
    method: 'POST',
    path: '/v1/reports/workload',
    body: { member_ids: [] },
  })
  expect((await workloadDownload).suggestedFilename()).toMatch(/\.pdf$/i)
  await expectNoViolations(page, '/kullanicilar')

  // 01 Ana sayfa: "Rapor oluştur" menüsü yalnız gezinir (ağ isteği yok); Esc → odak kutucukta.
  await open(page, '/')
  const tile = page.locator('[data-quick="report"]')
  await expect(tile).toBeVisible()
  const reportRequests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/v1/reports/') || r.url().endsWith('/v1/download-tickets')) {
      reportRequests.push(r.url())
    }
  })
  await tile.click()
  await expect(page.locator('[data-report]')).toHaveCount(4)
  await page.keyboard.press('Escape')
  await expect(tile).toBeFocused()
  await tile.click()
  await page.locator('[data-report="season"]').click()
  await expect(page).toHaveURL(/\/arsiv$/)
  expect(reportRequests.filter((url) => !url.endsWith('/v1/reports/dashboard'))).toEqual([])

  // Ana sayfa ve sonrası: CSP ihlali 0; belirteç depolara yazılmadı (yalnız izinli tercih anahtarları).
  await expectNoViolations(page, '/ → /arsiv')
  expect(await storageHasOnlyAllowedKeys(page, [])).toEqual([])
})
