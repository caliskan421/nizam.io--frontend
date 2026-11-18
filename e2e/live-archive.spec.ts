// W176 O3 · gerçek backend (`api-pin.json` etiketi): arşiv ZIP bileti (BE-120/124) ve dönem raporu bölüm seçimi
// (BE-122/127) üretim paketi + üretim CSP'si altında. Yönetici /arsiv yalnız S2 (program başlığı)
// okur (P33 geçici yolu YOK: S3 arşiv okuması ve work-items kesişimi çağrılmaz). Dışa aktarımlar
// hesap başına dakikalık kotaya bağlıdır (e2e/export-quota.ts). Ölçümler `e2e/.state/live-*.json`.
import { expect, test, type Page } from '@playwright/test'

import { reserveExport } from './export-quota'
import { ADMIN, readChatFixture } from './fixture'
import {
  expectNoOverflow,
  expectNoViolations,
  newPage,
  open,
  recordMeasure,
  signIn,
} from './live-helpers'
import { Api, COORD_PASSWORD, ensureLiveFixture } from './live-seed'

test.describe.configure({ mode: 'serial' })

let page: Page
let programId = ''

test.beforeAll(async ({ browser }, info) => {
  const baseURL = String(info.project.use.baseURL)
  const fixture = readChatFixture()
  programId = fixture.programId
  await ensureLiveFixture(baseURL)
  // Tohum: dosyalı görev (arşiv klasör kartı ve ZIP içeriği) + dosyasız görev.
  const api = await Api.admin(baseURL)
  try {
    const run = Date.now().toString(36)
    const withFile = await api.createTask(`Canlı arşiv ${run}`, fixture.chat.peerAccountId)
    await api.uploadPng(withFile.work_item_id, `canli-${run}.png`)
    await api.createTask(`Canlı dosyasız ${run}`, fixture.chat.peerAccountId)
  } finally {
    await api.dispose()
  }
  page = await newPage(browser, { programId, lens: 'admin' })
  await signIn(page, ADMIN.email, ADMIN.password)
})
test.afterAll(async () => {
  await page.context().close()
})

test('dönem ZIP: S2 okuma (P33 yolu yok), onay → bilet S2 hedefi → .zip indirilir; başlık ölçümü', async ({}, info) => {
  test.setTimeout(150_000)
  const s3Reads: string[] = []
  page.on('request', (r) => {
    const path = new URL(r.url()).pathname
    if (path.startsWith('/v1/records/archive') || path === '/v1/program/work-items') {
      s3Reads.push(`${r.method()} ${path}`)
    }
  })
  await open(page, '/arsiv')
  const zipButton = page.getByRole('button', { name: 'Dönem arşivi (ZIP)' })
  await expect(zipButton).toBeEnabled()
  await expect(page.locator('[data-folder-id]').first()).toBeVisible()
  await zipButton.click()
  await expect(page.getByTestId('period-zip-dialog')).toBeVisible()
  await expect(page.getByTestId('zip-confirm')).toBeEnabled()

  await reserveExport()
  const ticket = page.waitForRequest(
    (r) => r.url().endsWith('/v1/download-tickets') && r.method() === 'POST',
  )
  const redeemed = page.waitForResponse((r) =>
    new URL(r.url()).pathname.startsWith('/v1/downloads/'),
  )
  const download = page.waitForEvent('download')
  await page.getByTestId('zip-confirm').click()
  const issued = await ticket
  expect(issued.postDataJSON()).toEqual({
    method: 'GET',
    path: '/v1/program/archive/download-zip?include_reports=true',
  })
  expect(issued.headers()['x-nizamio-program']).toBe(programId)
  expect(issued.headers()['x-nizamio-department']).toBeUndefined()
  expect(issued.headers()['x-requested-with']).toBeTruthy()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/\.zip$/i)
  const response = await redeemed
  expect(response.status()).toBe(200)
  const headers = response.headers()
  expect(headers['content-type']).toMatch(/zip/)
  expect(headers['content-disposition']).toMatch(/attachment/)
  await expect(page.getByTestId('period-zip-note')).toContainText(/ZIP indirildi/)
  // Eski yol yok (KESİN 35): admin /arsiv S3 arşiv okuması ya da work-items kesişimi yapmadı.
  expect(s3Reads).toEqual([])
  await expectNoViolations(page, '/arsiv ZIP')
  await recordMeasure(info, 'arsiv-zip', {
    filename: file.suggestedFilename(),
    ticketPath: issued.postDataJSON().path,
    // Sözleşme tüketimde yalnız gövde/Content-Type/Content-Disposition'ı güvence eder;
    // `X-Result-Truncated` hedef işleyicinin yazdığı başlıktır ve yalnız kesilince gelir.
    redeemHeaders: Object.keys(headers).sort(),
    xResultTruncated: headers['x-result-truncated'] ?? null,
  })
})

test('dönem raporu bölüm seçimi: seçili bölümler ve koordinatörlük süzgeci bilet hedefine yazılır, PDF iner', async ({}, info) => {
  test.setTimeout(150_000)
  await open(page, '/arsiv')
  await page.locator('[data-action="pick-sections"]').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('[data-section="files"]').uncheck()
  await dialog.locator('[data-section="meetings"]').uncheck()
  await dialog.locator('[data-chip]:not([data-chip="all"])').first().click()
  await reserveExport()
  const ticket = page.waitForRequest(
    (r) => r.url().endsWith('/v1/download-tickets') && r.method() === 'POST',
  )
  const download = page.waitForEvent('download')
  await dialog.locator('[data-action="confirm"]').click()
  const issued = await ticket
  const body = issued.postDataJSON() as { method: string; path: string }
  expect(body.method).toBe('GET')
  const url = new URL(body.path, 'http://x')
  expect(url.pathname).toBe('/v1/reports/season/pdf')
  expect(url.searchParams.get('sections')).toBe('summary,gantt,general,tasks,details,appendix')
  expect(url.searchParams.get('department_ids')).toBeTruthy()
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/i)
  await expect(dialog).toBeHidden()
  await expectNoViolations(page, '/arsiv bölüm seçimi')
  await recordMeasure(info, 'rapor-bolum-secimi', { ticketPath: body.path })
})

test('390 px: Dönem arşivi (ZIP) onayı ve bölüm seçimi tıklanır, yatay taşma yok', async () => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, '/arsiv')
  await expectNoOverflow(page)
  await page.getByRole('button', { name: 'Dönem arşivi (ZIP)' }).click()
  const dialog = page.getByTestId('period-zip-dialog')
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  await expectNoOverflow(page)
  await page.getByTestId('zip-cancel').click()
  await expect(dialog).toBeHidden()
  await page.locator('[data-action="pick-sections"]').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoOverflow(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expectNoViolations(page, '/arsiv 390')
  await page.setViewportSize({ width: 1280, height: 800 })
})

test('yetki (gerçek backend): S2 arşiv uçları yalnız şirket yöneticisine; koordinatör ve üye 403 records.not_authorized', async ({}, info) => {
  const baseURL = String(info.project.use.baseURL)
  const live = await ensureLiveFixture(baseURL)
  const fixture = readChatFixture()
  const paths = [
    '/v1/program/archive/folders',
    '/v1/program/archive/attachments',
    '/v1/program/archive/tasks',
    '/v1/program/archive/uploaders',
  ]
  const outcome: Record<string, Record<string, number>> = {}
  for (const [who, email, password] of [
    ['admin', ADMIN.email, ADMIN.password],
    ['koordinator', live.coordEmail, COORD_PASSWORD],
    ['uye', fixture.chat.peerEmail, fixture.chat.peerPassword],
  ] as const) {
    const api = await Api.login(baseURL, email, password)
    try {
      outcome[who] = {}
      for (const path of paths) {
        const res = await api.ctx.get(path, { headers: api.headers('S2') })
        outcome[who][path] = res.status()
        if (who === 'admin') expect(res.status(), `${who} ${path}`).toBe(200)
        else {
          expect(res.status(), `${who} ${path}`).toBe(403)
          expect(((await res.json()) as { code: string }).code).toBe('records.not_authorized')
        }
      }
    } finally {
      await api.dispose()
    }
  }
  await recordMeasure(info, 'arsiv-s2-yetki', outcome)
})
