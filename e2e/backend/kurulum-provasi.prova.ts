// Kurulum provası (F15 WP-428 K7; D-0183/7): üretim benzeri paket (backend build/compose.prod.yaml:
// kenar Caddy + web statik imajı + server + db) https üzerinden, AYNI ORIGIN.
//
// Koşum: NIZAMIO_PROVA_BASE_URL=https://localhost:18443 NIZAMIO_PROVA_ADMIN_EMAIL=…
//        NIZAMIO_PROVA_ADMIN_PASSWORD=… pnpm exec playwright test   (bkz. playwright.config.ts)
//
// Kanıtlananlar: giriş başarılı · sayfa yenileme sonrası HttpOnly + Secure refresh çereziyle oturum
// sürer · CORS hatası yok · konsolda/olayda CSP ihlali 0 · PrimeVue'nun çalışma anında enjekte
// ettiği <style> öğeleri istek başı nonce'u taşır ve tema değişkenleri uygulanmıştır (CSP
// `style-src 'nonce-…'`, 'unsafe-inline' yok). Yerel CA sertifikası tarayıcıya yüklenmez
// (ignoreHTTPSErrors); TLS geçerliliği duman.sh'ta `curl --cacert` ile ayrıca kanıtlanır.
import { writeFileSync } from 'node:fs'

import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

const email = process.env.NIZAMIO_PROVA_ADMIN_EMAIL ?? ''
const password = process.env.NIZAMIO_PROVA_ADMIN_PASSWORD ?? ''
const summaryPath = process.env.NIZAMIO_PROVA_SUMMARY ?? 'test-results/kurulum-provasi.json'

declare global {
  interface Window {
    __cspViolations?: string[]
  }
}

async function cspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__cspViolations ?? [])
}

test('https: giriş → yenileme sonrası refresh çereziyle oturum → CSP ihlali 0, CORS hatası 0', async ({
  page,
}) => {
  expect(email, 'NIZAMIO_PROVA_ADMIN_EMAIL').not.toBe('')
  expect(password, 'NIZAMIO_PROVA_ADMIN_PASSWORD').not.toBe('')

  const consoleProblems: string[] = []
  const failedRequests: string[] = []
  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text()
    if (/content security policy|cross-origin|cors/i.test(text)) consoleProblems.push(text)
  })
  page.on('requestfailed', (req) => failedRequests.push(`${req.url()} ${req.failure()?.errorText}`))
  // Her belge yüklemesinde (yenileme dahil) ihlal olaylarını topla.
  await page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations?.push(`${e.violatedDirective} ${e.blockedURI}`)
    })
  })

  const status = page.getByTestId('session-status')
  const documentResponse = await page.goto('/')
  expect(documentResponse?.status()).toBe(200)
  const headers = documentResponse?.headers() ?? {}
  const csp = headers['content-security-policy'] ?? ''
  expect(csp).toContain("style-src 'self' 'nonce-")
  expect(csp).not.toContain('unsafe-inline')
  expect(csp).not.toContain('unsafe-eval')
  expect(headers['strict-transport-security']).toBeTruthy()
  await expect(status).toHaveAttribute('data-status', 'anonymous')

  // PrimeVue tema stilleri nonce'la enjekte edildi ve uygulandı.
  const nonceInHeader = /'nonce-([^']+)'/.exec(csp)?.[1]
  const primevue = await page.evaluate(() => {
    const styles = Array.from(
      document.querySelectorAll<HTMLStyleElement>('style[data-primevue-style-id]'),
    )
    return {
      count: styles.length,
      nonces: [...new Set(styles.map((s) => s.nonce))],
      primaryColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--p-primary-color')
        .trim(),
    }
  })
  expect(primevue.count).toBeGreaterThan(0)
  expect(primevue.nonces).toEqual([nonceInHeader])
  expect(primevue.primaryColor).not.toBe('')

  // Giriş: gerçek POST /v1/auth/login → GET /v1/me (aynı origin, kenar Caddy → server).
  const meAfterLogin = page.waitForResponse(
    (r) => r.url().endsWith('/v1/me') && r.request().method() === 'GET',
  )
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'giriş' }).click()
  expect((await meAfterLogin).status()).toBe(200)
  await expect(status).toHaveAttribute('data-status', 'authenticated')
  await expect(page.getByTestId('me-email')).toHaveText(email)

  const refreshCookie = (await page.context().cookies()).find(
    (c) => c.name === 'nizamio_web_refresh',
  )
  expect(refreshCookie?.httpOnly).toBe(true)
  expect(refreshCookie?.secure).toBe(true)

  // Sayfa yenileme: bellek sıfırlanır; oturum HttpOnly çerezle sessiz refresh ile döner.
  const silentRefresh = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.reload()
  expect((await silentRefresh).status()).toBe(200)
  await expect(status).toHaveAttribute('data-status', 'authenticated')
  await expect(page.getByTestId('me-email')).toHaveText(email)

  const violations = await cspViolations(page)
  await page.screenshot({ path: 'test-results/kurulum-provasi.png', fullPage: true })
  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        baseURL: page.url(),
        csp,
        hsts: headers['strict-transport-security'],
        primevueStyles: primevue,
        refreshCookie: {
          httpOnly: refreshCookie?.httpOnly,
          secure: refreshCookie?.secure,
          sameSite: refreshCookie?.sameSite,
          path: refreshCookie?.path,
        },
        cspViolations: violations,
        consoleCspOrCors: consoleProblems,
        failedRequests,
      },
      null,
      2,
    ),
  )
  expect(violations, 'CSP ihlali').toEqual([])
  expect(consoleProblems, 'konsolda CSP/CORS iletisi').toEqual([])
  expect(failedRequests, 'başarısız istek').toEqual([])
})
