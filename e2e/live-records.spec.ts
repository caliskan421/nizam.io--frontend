// W176 O3 · gerçek backend `v0.23.0-api`: silinenler (BE-108…119) CSV bileti + toplu geri yükle,
// toplantı adayları ve idempotent tekrar (BE-063/068), K1 iade sebebi → Ü1 (BE-139/140) ve görev
// kodu (BE-005). Üretim paketi + üretim CSP'si. Her koşum benzersiz adlar kullanır; dışa aktarımlar
// hesap başına dakikalık kotaya bağlıdır (e2e/export-quota.ts).
import { expect, test } from '@playwright/test'

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
import { Api, COORD_PASSWORD, DEPARTMENT_CODE, ensureLiveFixture, idemKey } from './live-seed'

test.describe.configure({ mode: 'serial' })

const fixture = readChatFixture()
let baseURL = ''
let coordEmail = ''
const run = Date.now().toString(36)

test.beforeAll(async ({}, info) => {
  baseURL = String(info.project.use.baseURL)
  coordEmail = (await ensureLiveFixture(baseURL)).coordEmail
})

test('silinenler: CSV bileti (S2 hedefi) + toplu geri yükle → silinen listesi, görev listesi ve ana sayfa sayacı', async ({
  browser,
}, info) => {
  test.setTimeout(150_000)
  const api = await Api.admin(baseURL)
  const ids: string[] = []
  const titles = [`Silinecek A ${run}`, `Silinecek B ${run}`]
  try {
    for (const title of titles) {
      const task = await api.createTask(title)
      ids.push(task.work_item_id)
      await api.deleteTask(task.work_item_id)
    }
  } finally {
    await api.dispose()
  }
  const page = await newPage(browser, { programId: fixture.programId, lens: 'admin' })
  try {
    await signIn(page, ADMIN.email, ADMIN.password)
    await open(page, '/')
    const counter = page.locator('[data-testid="home-deleted-records"] .rp-count')
    await expect(counter).toBeVisible()
    const before = Number((await counter.textContent())?.replace(/\D/g, ''))

    await open(page, '/silinen-kayitlar')
    for (const id of ids)
      await expect(page.locator(`[data-record-key="gorev:${id}"]`)).toBeVisible()

    // CSV: bilet hedefi sorgu dizesiyle bire bir, S2 başlığı; BOM'lu CSV iner.
    await reserveExport()
    const ticket = page.waitForRequest(
      (r) => r.url().endsWith('/v1/download-tickets') && r.method() === 'POST',
    )
    const download = page.waitForEvent('download')
    await page.getByTestId('dr-csv').click()
    const issued = await ticket
    const path = (issued.postDataJSON() as { path: string }).path
    expect(path).toBe('/v1/admin/deleted/export?kinds=tasks&scope=program')
    expect(issued.headers()['x-nizamio-program']).toBe(fixture.programId)
    expect((await download).suggestedFilename()).toMatch(/\.csv$/i)

    // Toplu geri yükle (ADR-0045): iki satır seçilir, tek istek, satırlar listeden düşer.
    for (const id of ids) {
      await page.locator(`[data-record-key="gorev:${id}"] [data-testid="dr-row-check"]`).check()
    }
    const restore = page.waitForResponse(
      (r) =>
        r.url().endsWith('/v1/admin/deleted/work-items/restore') && r.request().method() === 'POST',
    )
    await page.locator('[data-action="bulk-restore"]').click()
    const confirm = page.getByTestId('confirm-accept')
    if (await confirm.isVisible().catch(() => false)) await confirm.click()
    const restored = (await (await restore).json()) as { succeeded: string[]; failed: unknown[] }
    expect([...restored.succeeded].sort()).toEqual([...ids].sort())
    expect(restored.failed).toEqual([])
    for (const id of ids)
      await expect(page.locator(`[data-record-key="gorev:${id}"]`)).toHaveCount(0)

    // Türevler (KESİN 29): görev listesi geri gelenleri gösterir, ana sayfa sayacı iki düşer.
    await open(page, '/gorevler')
    for (const title of titles) await expect(page.getByText(title).first()).toBeVisible()
    await open(page, '/')
    await expect(async () => {
      const after = Number((await counter.textContent())?.replace(/\D/g, ''))
      expect(after).toBe(before - 2)
    }).toPass({ timeout: 10_000 })
    await expectNoViolations(page, '/silinen-kayitlar → /')
    await recordMeasure(info, 'silinenler-csv-toplu-geri-yukle', {
      csvPath: path,
      before,
      restored,
    })
  } finally {
    await page.context().close()
  }
})

test('toplantı: katılımcı adayları kesilme uyarısız, ekleme Idempotency-Key ile; aynı anahtarla tekrar tek kayıt', async ({
  browser,
}, info) => {
  const api = await Api.admin(baseURL)
  const meetingTitle = `Canlı toplantı ${run}`
  const created = await api.createMeeting(meetingTitle, '2027-02-10T10:00:00', 'person')
  const meetingId = created.meeting.meeting_id
  const page = await newPage(browser, { programId: fixture.programId, lens: 'admin' })
  try {
    await signIn(page, ADMIN.email, ADMIN.password)
    await open(page, `/toplantilar/${meetingId}`)
    const candidates = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/v1/meetings/participant-candidates',
    )
    await page.locator('.meeting-people').getByRole('button', { name: 'Ekle' }).click()
    const response = await candidates
    expect(new URL(response.url()).searchParams.get('meeting_id')).toBe(meetingId)
    await expect(page.locator('.meeting-selector-row').first()).toBeVisible()
    const rows = await page.locator('.meeting-selector-row').count()
    expect(rows).toBeGreaterThanOrEqual(2)
    const post = page.waitForRequest(
      (r) => r.url().includes(`/v1/meetings/${meetingId}/participants`) && r.method() === 'POST',
    )
    await page.locator('.meeting-selector-row input:not(:disabled)').first().check()
    await page.getByRole('dialog').getByRole('button', { name: 'Uygula' }).click()
    const sent = await post
    expect(sent.headers()['idempotency-key']).toMatch(/^[A-Za-z0-9_-]{22}$/)
    await expectNoViolations(page, '/toplantilar/:id')

    // Sözleşme kanıtı (gerçek backend): aynı anahtarla yeniden gönderim yeni kayıt açmaz.
    const user = (sent.postDataJSON() as { user_id: string }).user_id
    const key = idemKey()
    const second =
      fixture.chat.peerAccountId === user ? fixture.memberAccountId : fixture.chat.peerAccountId
    const send = () =>
      api.ctx.post(`/v1/meetings/${meetingId}/participants`, {
        headers: api.headers('S2', { 'Idempotency-Key': key }),
        data: { user_id: second },
      })
    const first = await send()
    const repeat = await send()
    expect(first.status()).toBeLessThan(300)
    expect(repeat.status()).toBeLessThan(300)
    const detail = await api.ctx.get(`/v1/meetings/${meetingId}`, { headers: api.headers('S2') })
    const participants = ((await detail.json()) as { participants: { account_id: string }[] })
      .participants
    expect(participants.filter((p) => p.account_id === second)).toHaveLength(1)
    await recordMeasure(info, 'toplanti-aday-idempotent', {
      candidateRows: rows,
      firstStatus: first.status(),
      repeatStatus: repeat.status(),
      participants: participants.length,
    })
  } finally {
    await page.context().close()
    await api.dispose()
  }
})

test('K1 iade sebebi → Ü1: koordinatör gerekçeyle iade eder, üye özetinde gerekçe görünür; görev kodu E2E-n', async ({
  browser,
}, info) => {
  test.setTimeout(120_000)
  const admin = await Api.admin(baseURL)
  const title = `İade denemesi ${run}`
  const task = await admin.createTask(title, fixture.chat.peerAccountId)
  await admin.dispose()
  expect(task.code).toMatch(new RegExp(`^${DEPARTMENT_CODE}-\\d+$`))
  const member = await Api.login(baseURL, fixture.chat.peerEmail, fixture.chat.peerPassword)
  await member.transition(task.work_item_id, { to: 'devam_ediyor' })
  await member.transition(task.work_item_id, { to: 'onaya_sunuldu' })
  await member.dispose()

  const reason = `imzalı liste eksik ${run}`
  const coord = await newPage(browser, {
    programId: fixture.programId,
    lens: 'coordinator',
    departmentId: fixture.departmentId,
  })
  try {
    await signIn(coord, coordEmail, COORD_PASSWORD)
    await open(coord, '/')
    const row = coord.locator('[data-region="approvals"] [data-row]').filter({ hasText: title })
    await expect(row).toBeVisible()
    await expect(row.locator('[data-task-code]')).toHaveText(task.code!)
    await expect(row.locator('[data-parts="sent"]')).toBeVisible()
    await row.locator('[data-action="return"]').click()
    await coord.getByTestId('k1-return-input').fill(reason)
    const moved = coord.waitForResponse((r) =>
      r.url().endsWith(`/v1/work-items/${task.work_item_id}/transitions`),
    )
    await coord.getByTestId('k1-return-submit').click()
    expect((await moved).status()).toBe(200)
    await expect(row).toHaveCount(0)
    await expectNoViolations(coord, 'K1')
  } finally {
    await coord.context().close()
  }

  const memberPage = await newPage(browser, {
    programId: fixture.programId,
    lens: 'member',
    departmentId: fixture.departmentId,
  })
  try {
    await signIn(memberPage, fixture.chat.peerEmail, fixture.chat.peerPassword)
    await open(memberPage, '/')
    await expect(memberPage.locator('[data-cell="returned"] .rh-cap')).toContainText(reason)
    // BE-141: Koordinatörlüklerim kartı kod ve koordinatör adını `me/departments`'tan alır.
    const unit = memberPage.locator('[data-region="units"] [data-row]').first()
    await expect(unit.locator('[data-unit-code]')).toHaveText(DEPARTMENT_CODE)
    await expect(unit.locator('[data-parts="coordinator"]')).toContainText('E2E Koordinatör')
    await memberPage.setViewportSize({ width: 390, height: 844 })
    await expectNoOverflow(memberPage)
    await expectNoViolations(memberPage, 'Ü1')
    await recordMeasure(info, 'k1-iade-sebebi', { code: task.code, reason })
  } finally {
    await memberPage.context().close()
  }
})
