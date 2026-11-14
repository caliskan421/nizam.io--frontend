// F7 bildirim duman senaryosu (W160 · O3): gerçek backend + üretim paketi + üretim CSP'si.
// Yönetici bir görev oluşturup ikinci hesaba atar → üyenin zilinde bildirim satırı → tıkla → okundu +
// 03 `?gorev=` paneli açılır. Bildirimde SSE yoktur (P65): sayaç sayfa yüklenince okunur; bekleme
// koşula bağlıdır (backend'in bildirim üretimi için API yoklaması), gerçek süre uykusu yok.
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'

import { cspViolations, describeViolations, enforceCaddyCsp } from './csp-check'
import { ADMIN, readChatFixture } from './fixture'
import { storageHasOnlyAllowedKeys } from './storage-check'

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' }
const LIVE = { timeout: 20_000 }

async function login(api: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await api.post('/v1/auth/login', { headers: CSRF, data: { email, password } })
  expect(response.ok(), `giriş ${email}`).toBe(true)
  return ((await response.json()) as { token: string }).token
}

const isoDay = (offset: number): string =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

test('F7 bildirim: görev oluştur → üyenin zilinde satır → tıkla → okundu + 03 ?gorev=', async ({
  browser,
  baseURL,
}) => {
  const fixture = readChatFixture()
  const { chat } = fixture
  const run = Date.now().toString(36)
  const api = await request.newContext({ baseURL })
  const adminToken = await login(api, ADMIN.email, ADMIN.password)
  const peerToken = await login(api, chat.peerEmail, chat.peerPassword)

  // Veritabanı koşumlar arası kalıcıdır: üyenin önceki bildirimleri okundu yapılır (bilinen taban 0).
  const cleared = await api.post('/v1/notifications/read-all', {
    headers: { ...CSRF, Authorization: `Bearer ${peerToken}` },
  })
  expect(cleared.ok()).toBe(true)
  const unread = async (): Promise<number> => {
    const response = await api.get('/v1/notifications/unread-count', {
      headers: { Authorization: `Bearer ${peerToken}` },
    })
    return ((await response.json()) as { count: number }).count
  }
  expect(await unread()).toBe(0)

  // Yönetici görevi oluşturur ve üyeye atar (createWorkItem: S3 başlıkları + Idempotency-Key).
  const title = `E2E bildirim görevi ${run}`
  const created = await api.post('/v1/work-items', {
    headers: {
      ...CSRF,
      Authorization: `Bearer ${adminToken}`,
      'X-Nizamio-Program': fixture.programId,
      'X-Nizamio-Department': fixture.departmentId,
      'Idempotency-Key': `e2e-bildirim-${run}-${'x'.repeat(12)}`,
    },
    data: {
      title,
      start_on: isoDay(0),
      end_on: isoDay(7),
      assignee_account_id: chat.peerAccountId,
    },
  })
  expect(created.status(), await created.text()).toBe(201)
  const taskId = ((await created.json()) as { work_item_id: string }).work_item_id

  // Backend bildirimi üretene dek (koşul yoklaması; sabit uyku yok).
  await expect.poll(unread, { timeout: 20_000 }).toBeGreaterThan(0)
  const total = await unread()

  const context = await browser.newContext()
  const page: Page = await context.newPage()
  try {
    await enforceCaddyCsp(page)
    await page.addInitScript(
      (s) => {
        window.localStorage.setItem('nizamio.pref.scope.programId', s.programId)
        window.localStorage.setItem('nizamio.pref.scope.lens', 'member')
        window.localStorage.setItem('nizamio.pref.scope.departmentId', s.departmentId)
      },
      { programId: fixture.programId, departmentId: fixture.departmentId },
    )
    await page.goto('/')
    await page.locator('input[name="email"]').fill(chat.peerEmail)
    await page.locator('input[name="password"]').fill(chat.peerPassword)
    await page.getByRole('button', { name: 'giriş' }).click()
    await expect(page.getByTestId('app-shell')).toBeVisible()

    const bell = page.getByTestId('topbar-bell')
    await expect(bell.locator('.topbar-bell__badge')).toBeVisible(LIVE)
    await bell.click()
    const panel = page.getByTestId('notification-panel')
    await expect(panel).toBeVisible()
    const rows = panel.getByTestId('notification-row')
    await expect(rows.first()).toBeVisible(LIVE)
    // En yeni okunmamış satır (görev ataması/oluşturma): tıkla → 03 ?gorev=<id> + görev paneli.
    const first = rows.first()
    await expect(first).toHaveAttribute('data-unread', 'true')
    await first.locator('.nb-it__main').click()
    await expect(page).toHaveURL(new RegExp(`/gorevler\\?.*gorev=${taskId}`), LIVE)
    await expect(panel).toHaveCount(0)
    await expect(page.getByText(title).first()).toBeVisible(LIVE)

    // Okundu işlendi: yalnız tıklanan satır okundu sayıldı (sayaç bir düştü); sunucu sayacı doğrular.
    await expect.poll(unread, { timeout: 20_000 }).toBe(total - 1)
    const violations = await cspViolations(page)
    expect(violations, describeViolations('/gorevler?gorev (bildirimden)', violations)).toEqual([])
    expect(await storageHasOnlyAllowedKeys(page)).toEqual([])
  } finally {
    await context.close()
    await api.dispose()
  }
})
