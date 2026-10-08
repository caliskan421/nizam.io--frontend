// Duman senaryosu (F06 kapsam 11): giriş → /v1/me → (sayfa yenileme → sessiz refresh) → çıkış,
// tarayıcıda gerçek uygulama yığınından (Vue + Pinia + http katmanı + vite preview proxy)
// gerçek backend'e karşı. Giriş ekranı yer tutucudur (tasarım F09).
import { expect, test, type Page } from '@playwright/test'

import { ADMIN, readFixture } from './fixture'

async function storageIsEmpty(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      window.localStorage.length === 0 &&
      window.sessionStorage.length === 0 &&
      !document.cookie.includes('nizamio'),
  )
}

test('giriş → /v1/me → yenileme sonrası sessiz refresh → çıkış', async ({ page }) => {
  const fixture = readFixture()
  const status = page.getByTestId('session-status')

  await page.goto('/')
  await expect(status).toHaveAttribute('data-status', 'anonymous')

  // Giriş: gerçek POST /v1/auth/login, ardından gerçek GET /v1/me.
  const meAfterLogin = page.waitForResponse(
    (r) => r.url().endsWith('/v1/me') && r.request().method() === 'GET',
  )
  await page.locator('input[name="email"]').fill(ADMIN.email)
  await page.locator('input[name="password"]').fill(ADMIN.password)
  await page.getByRole('button', { name: 'giriş' }).click()
  const meResponse = await meAfterLogin
  expect(meResponse.status()).toBe(200)
  expect(meResponse.request().headers()['authorization']).toMatch(/^Bearer .+/)
  expect(((await meResponse.json()) as { account_id: string }).account_id).toBe(
    fixture.adminAccountId,
  )
  await expect(status).toHaveAttribute('data-status', 'authenticated')
  await expect(page.getByTestId('me-email')).toHaveText(ADMIN.email)

  // Belirteç tarayıcı depolarına yazılmadı; yenileme çerezi HttpOnly (JS göremez).
  expect(await storageIsEmpty(page)).toBe(true)
  const cookies = await page.context().cookies()
  const refreshCookie = cookies.find((c) => c.name === 'nizamio_web_refresh')
  expect(refreshCookie?.httpOnly).toBe(true)
  expect(refreshCookie?.path).toBe('/v1/auth')

  // Sayfa yenileme: bellek sıfırlanır; oturum HttpOnly çerezle sessiz refresh ile döner.
  const silentRefresh = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.reload()
  expect((await silentRefresh).status()).toBe(200)
  await expect(status).toHaveAttribute('data-status', 'authenticated')
  await expect(page.getByTestId('me-email')).toHaveText(ADMIN.email)
  expect(await storageIsEmpty(page)).toBe(true)

  await page.screenshot({ path: 'test-results/smoke-authenticated.png', fullPage: true })

  // Çıkış: gerçek POST /v1/auth/logout (204) + bellek temizliği.
  const logout = page.waitForResponse((r) => r.url().endsWith('/v1/auth/logout'))
  await page.getByTestId('logout').click()
  const logoutResponse = await logout
  expect(logoutResponse.status()).toBe(204)
  expect(logoutResponse.request().headers()['x-requested-with']).toBeTruthy()
  await expect(status).toHaveAttribute('data-status', 'anonymous')

  // Çıkıştan sonra yenileme: oturum dönmez.
  await page.reload()
  await expect(status).toHaveAttribute('data-status', 'anonymous')
})
