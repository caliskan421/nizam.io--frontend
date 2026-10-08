// CX-Ö-02: aynı tarayıcı bağlamında İKİ GERÇEK SAYFA, etiketli GERÇEK backend (oturum ömrü
// 1 dk olan ikinci server, bkz. e2e/backend/up.sh). Erişim belirteci iki sayfada da
// geçersizken iki sayfa aynı anda korumalı uç çağırır → ağda TEK `/v1/auth/refresh` ve iki
// oturum da geçerli kalır. Gerçek Web Locks + BroadcastChannel + HttpOnly çerez rotasyonu.
import { expect, test, type Page } from '@playwright/test'

import { ADMIN } from './fixture'

const SHORT_TTL_BASE_URL = `http://127.0.0.1:${process.env.NIZAMIO_E2E_SHORT_WEB_PORT ?? 4174}`
/** NIZAMIO_SESSION_TTL=1m + pay. */
const EXPIRY_WAIT_MS = 65_000

test.setTimeout(150_000)
test.use({ baseURL: SHORT_TTL_BASE_URL })

const status = (page: Page) => page.getByTestId('session-status')

test('iki sekme, eşzamanlı 401 → tek refresh, iki oturum da geçerli', async ({ context }) => {
  const pageA = await context.newPage()
  await pageA.goto('/')
  await expect(status(pageA)).toHaveAttribute('data-status', 'anonymous')
  await pageA.locator('input[name="email"]').fill(ADMIN.email)
  await pageA.locator('input[name="password"]').fill(ADMIN.password)
  await pageA.getByRole('button', { name: 'giriş' }).click()
  await expect(status(pageA)).toHaveAttribute('data-status', 'authenticated')

  const pageB = await context.newPage()
  await pageB.goto('/')
  await expect(status(pageB)).toHaveAttribute('data-status', 'authenticated')
  await expect(pageB.getByTestId('me-email')).toHaveText(ADMIN.email)

  // Erişim belirteci iki sayfada da dolsun (refresh çerezi geçerli kalır).
  await pageA.waitForTimeout(EXPIRY_WAIT_MS)

  const refreshes: string[] = []
  context.on('request', (r) => {
    if (r.url().endsWith('/v1/auth/refresh')) refreshes.push(r.url())
  })
  const meStatuses: number[] = []
  context.on('response', (r) => {
    if (r.url().endsWith('/v1/me')) meStatuses.push(r.status())
  })

  // Eşzamanlılık bariyeri: ilk iki /v1/me isteği backend'e GERÇEKTEN gider (route.fetch),
  // ama yanıtları ikisi de gönderilmeden sayfalara verilmez. Böylece iki sayfa da isteğini
  // geçersiz belirteçle göndermiş olur; refresh yarışı gerçek kilit/kanal üzerinden yaşanır.
  const release: Array<() => void> = []
  let held = 0
  await context.route('**/v1/me', async (route) => {
    if (held >= 2) return route.continue()
    held += 1
    const response = await route.fetch()
    await new Promise<void>((resolve) => {
      release.push(resolve)
      if (release.length === 2) release.forEach((r) => r())
    })
    await route.fulfill({ response })
  })

  const okA = pageA.waitForResponse((r) => r.url().endsWith('/v1/me') && r.status() === 200)
  const okB = pageB.waitForResponse((r) => r.url().endsWith('/v1/me') && r.status() === 200)
  await Promise.all([
    pageA.getByTestId('reload-me').click(),
    pageB.getByTestId('reload-me').click(),
  ])
  await Promise.all([okA, okB])
  await context.unroute('**/v1/me')

  // İki sayfa da önce 401 aldı (belirteç gerçekten geçersizdi), sonra 200.
  expect(meStatuses.filter((s) => s === 401)).toHaveLength(2)
  expect(meStatuses.filter((s) => s === 200)).toHaveLength(2)
  expect(refreshes).toHaveLength(1)

  for (const page of [pageA, pageB]) {
    await expect(status(page)).toHaveAttribute('data-status', 'authenticated')
    await expect(page.getByTestId('me-email')).toHaveText(ADMIN.email)
  }

  // Sonrasında iki oturum da geçerli: yeniden çağrı refresh'siz 200.
  const againA = pageA.waitForResponse((r) => r.url().endsWith('/v1/me'))
  const againB = pageB.waitForResponse((r) => r.url().endsWith('/v1/me'))
  await pageA.getByTestId('reload-me').click()
  await pageB.getByTestId('reload-me').click()
  expect((await againA).status()).toBe(200)
  expect((await againB).status()).toBe(200)
  expect(refreshes).toHaveLength(1)
})
