// Duman senaryosu (F06 kapsam 11): giriş → /v1/me → (sayfa yenileme → sessiz refresh) → çıkış,
// tarayıcıda gerçek uygulama yığınından (Vue + Pinia + http katmanı + vite preview proxy)
// gerçek backend'e karşı. Giriş ekranı yer tutucudur (tasarım program sonrası istemci geliştirmesi).
import { expect, test, type Response } from '@playwright/test'

import { cspViolations, describeViolations, enforceCaddyCsp, loadedFontFamilies } from './csp-check'
import { ADMIN, readFixture } from './fixture'
import { componentLayerProbe } from './layer-check'
import { storageHasOnlyAllowedKeys } from './storage-check'

/** İstekteki erişim belirteci (bilinen gizli değer: hiçbir depoda geçmemeli). */
function bearerOf(request: { headers(): Record<string, string> }): string {
  return (request.headers()['authorization'] ?? '').replace(/^Bearer\s+/, '')
}

/** Sessiz refresh yanıtı başarılı; dönen erişim belirteci (depo denetiminde aranacak gizli değer). */
async function accessTokenOf(response: Response): Promise<string> {
  expect(response.status()).toBe(200)
  return ((await response.json()) as { access_token?: string }).access_token ?? ''
}

test('giriş → /v1/me → yenileme sonrası sessiz refresh → çıkış', async ({ page }) => {
  const fixture = readFixture()
  const status = page.getByTestId('session-status')

  // Üretim CSP'si (deploy/Caddyfile) belgeye eklenir; ihlaller sayfada toplanır (csp-check.ts).
  await enforceCaddyCsp(page)
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
  // W145 KUSUR 1: kapının yönlendirdiği giriş (`/oturum?next=/`) sonrası kullanıcı `/oturum`'da
  // kalmaz, geldiği rotaya (ana sayfa) döner.
  await expect(page.getByTestId('app-shell')).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await expect(status).toHaveCount(0)

  // Üretim CSP'sinde BÜTÜN ihlaller 0 (CX-F1-Ö-03; yazı tipi CX-F0-Ö-05 dahil): kendi barındırılan
  // yazı tipleri `font-src 'self'` ile yüklendi; ayrıntı hata iletisinde. Giriş sonrası belge
  // ana sayfadır (anonim `/` → `/oturum?next=/` → giriş → `/`); dolu KPI tanığı
  // değildir (CX-F1-Ö-06; F2 borcu).
  const violations = await cspViolations(page)
  expect(violations, describeViolations('/', violations)).toEqual([])
  expect(await loadedFontFamilies(page)).toEqual(expect.arrayContaining(['Inter', 'Poppins']))

  // Katman sırası (W61b): kabuk yüklendi; components katmanı Tailwind base/preflight'ın üstünde.
  // Bozulursa dolgular 0 olur ve iki tema simgesi birden görünür.
  await expect(page.getByTestId('app-shell')).toBeVisible()
  const layers = await componentLayerProbe(page)
  expect(layers.themeIconsVisible).toBe(1)
  expect(layers.sidePaddingTop).toBeGreaterThan(0)
  expect(layers.cardPaddingTop).toBeGreaterThan(0)

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
  await expect(page.getByTestId('app-shell')).toBeVisible()
  expect(await storageHasOnlyAllowedKeys(page, [accessToken, renewed])).toEqual([])

  await page.screenshot({ path: 'test-results/smoke-authenticated.png', fullPage: true })

  // Kimlik sayfası (`/oturum`, `next`siz doğrudan ziyaret S0'da kalır): `session-status` / `logout`
  // yalnız bu sayfadadır.
  const sessionPath = '/oturum'

  // Görev listesi parçası da üretim CSP'sinde ihlalsiz (CX-F1-Ö-03). Tam gezinme: bellek sıfırlanır,
  // oturum sessiz refresh ile döner; ihlal toplayıcı her belgede yeniden kurulur.
  const tasksRefresh = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.goto('/gorevler')
  const tasksToken = await accessTokenOf(await tasksRefresh)
  await expect(page.getByTestId('app-shell')).toBeVisible()
  await page.waitForLoadState('networkidle')
  const taskViolations = await cspViolations(page)
  expect(taskViolations, describeViolations('/gorevler', taskViolations)).toEqual([])

  // Kimlik sayfasına geri dönüş (tam gezinme → sessiz refresh); testin geri kalanı orada.
  const backRefresh = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.goto(sessionPath)
  const backToken = await accessTokenOf(await backRefresh)
  await expect(status).toHaveAttribute('data-status', 'authenticated')
  await expect(page.getByTestId('me-email')).toHaveText(ADMIN.email)
  await expect(page.getByTestId('logout')).toBeVisible()
  const seenTokens = [accessToken, renewed, tasksToken, backToken]
  expect(await storageHasOnlyAllowedKeys(page, seenTokens)).toEqual([])

  // Çıkış: gerçek POST /v1/auth/logout (204) + bellek temizliği.
  const logout = page.waitForResponse((r) => r.url().endsWith('/v1/auth/logout'))
  await page.getByTestId('logout').click()
  const logoutResponse = await logout
  expect(logoutResponse.status()).toBe(204)
  expect(logoutResponse.request().headers()['x-requested-with']).toBeTruthy()
  await expect(status).toHaveAttribute('data-status', 'anonymous')
  // Çıkışta kapsam kimlikleri silinir, yalnız tema tercihi kalabilir (E-00-29).
  expect(await storageHasOnlyAllowedKeys(page, seenTokens)).toEqual([])
  const kept = await page.evaluate(() => Object.keys(window.localStorage))
  expect(kept.filter((key) => key.includes('scope.'))).toEqual([])

  // Çıkıştan sonra yenileme: oturum dönmez.
  await page.reload()
  await expect(status).toHaveAttribute('data-status', 'anonymous')
})
