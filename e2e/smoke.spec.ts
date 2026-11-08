// Duman senaryosu (F06 kapsam 11): giriş → /v1/me → (sayfa yenileme → sessiz refresh) → çıkış,
// tarayıcıda gerçek uygulama yığınından (Vue + Pinia + http katmanı + vite preview proxy)
// gerçek backend'e karşı. Giriş ekranı yer tutucudur (tasarım program sonrası istemci geliştirmesi).
import { expect, test } from '@playwright/test'

import { ADMIN, readFixture } from './fixture'
import { storageHasOnlyAllowedKeys } from './storage-check'

/** İstekteki erişim belirteci (bilinen gizli değer: hiçbir depoda geçmemeli). */
function bearerOf(request: { headers(): Record<string, string> }): string {
  return (request.headers()['authorization'] ?? '').replace(/^Bearer\s+/, '')
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

  // Belirteç tarayıcı depolarına yazılmadı: yalnız K2 izinli tercih anahtarları (kapsam kimlikleri,
  // tema), sessionStorage boş, gerçek erişim belirteci hiçbir yerde yok; yenileme çerezi HttpOnly.
  const accessToken = bearerOf(meResponse.request())
  expect(accessToken).not.toBe('')
  expect(await storageHasOnlyAllowedKeys(page, [accessToken])).toEqual([])
  const cookies = await page.context().cookies()
  const refreshCookie = cookies.find((c) => c.name === 'nizamio_web_refresh')
  expect(refreshCookie?.httpOnly).toBe(true)
  expect(refreshCookie?.path).toBe('/v1/auth')

  // Sayfa yenileme: bellek sıfırlanır; oturum HttpOnly çerezle sessiz refresh ile döner.
  const silentRefresh = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.reload()
  const refreshed = await silentRefresh
  expect(refreshed.status()).toBe(200)
  const renewed = ((await refreshed.json()) as { access_token?: string }).access_token ?? ''
  await expect(status).toHaveAttribute('data-status', 'authenticated')
  await expect(page.getByTestId('me-email')).toHaveText(ADMIN.email)
  expect(await storageHasOnlyAllowedKeys(page, [accessToken, renewed])).toEqual([])

  await page.screenshot({ path: 'test-results/smoke-authenticated.png', fullPage: true })

  // Çıkış: gerçek POST /v1/auth/logout (204) + bellek temizliği.
  const logout = page.waitForResponse((r) => r.url().endsWith('/v1/auth/logout'))
  await page.getByTestId('logout').click()
  const logoutResponse = await logout
  expect(logoutResponse.status()).toBe(204)
  expect(logoutResponse.request().headers()['x-requested-with']).toBeTruthy()
  await expect(status).toHaveAttribute('data-status', 'anonymous')
  // Çıkışta kapsam kimlikleri silinir, yalnız tema tercihi kalabilir (E-00-29).
  expect(await storageHasOnlyAllowedKeys(page, [accessToken, renewed])).toEqual([])
  const kept = await page.evaluate(() => Object.keys(window.localStorage))
  expect(kept.filter((key) => key.includes('scope.'))).toEqual([])

  // Çıkıştan sonra yenileme: oturum dönmez.
  await page.reload()
  await expect(status).toHaveAttribute('data-status', 'anonymous')
})
