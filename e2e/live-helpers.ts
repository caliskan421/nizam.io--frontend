// W176 O3: canlıya alma e2e senaryolarının ortak tarayıcı yardımcıları (giriş, kapsam tercihi,
// üretim CSP'si, ölçüm kaydı). Gerçek backend v0.23 + üretim paketi + Caddy CSP'si.
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, type Browser, type Page, type TestInfo } from '@playwright/test'

import { cspViolations, describeViolations, enforceCaddyCsp } from './csp-check'

export type Lens = 'admin' | 'coordinator' | 'member'

/** Yeni bağlam + sayfa: üretim CSP'si ve kapsam tercihi (izinli anahtarlar, K2). */
export async function newPage(
  browser: Browser,
  scope: { programId: string; lens: Lens; departmentId?: string },
): Promise<Page> {
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()
  await enforceCaddyCsp(page)
  await page.addInitScript((s) => {
    window.localStorage.setItem('nizamio.pref.scope.programId', s.programId)
    window.localStorage.setItem('nizamio.pref.scope.lens', s.lens)
    if (s.departmentId)
      window.localStorage.setItem('nizamio.pref.scope.departmentId', s.departmentId)
  }, scope)
  return page
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/')
  await expect(page.getByTestId('session-status')).toHaveAttribute('data-status', 'anonymous')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'giriş' }).click()
  await expect(page.getByTestId('app-shell')).toBeVisible()
}

/** Tam gezinme: bellek sıfırlanır, oturum HttpOnly çerezle sessiz refresh ile döner. */
export async function open(page: Page, path: string): Promise<void> {
  const refreshed = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.goto(path)
  expect((await refreshed).status()).toBe(200)
  await expect(page.getByTestId('app-shell')).toBeVisible()
}

/** Üretim CSP'sinde ihlal 0 (şimdiki belge). */
export async function expectNoViolations(page: Page, where: string): Promise<void> {
  const violations = await cspViolations(page)
  expect(violations, describeViolations(where, violations)).toEqual([])
}

/** Yatay taşma yok (KESİN 17): belge genişliği görünüm genişliğini aşmaz. */
export async function expectNoOverflow(page: Page): Promise<void> {
  const o = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(o.scrollWidth).toBeLessThanOrEqual(o.innerWidth)
}

/**
 * Ölçümü hem test ekine hem `e2e/.state/live-<ad>.json`'a yazar (KESİN 33: senaryo başına ayrı dosya).
 * Kanıt, koordinatörün `.git/koordinator/web8-w176/` dizinine rapor sırasında taşınır.
 */
export async function recordMeasure(info: TestInfo, name: string, data: unknown): Promise<void> {
  const body = JSON.stringify({ senaryo: name, kosum: new Date().toISOString(), data }, null, 2)
  mkdirSync(resolve(import.meta.dirname, '.state'), { recursive: true })
  writeFileSync(resolve(import.meta.dirname, `.state/live-${name}.json`), body)
  await info.attach(`live-${name}.json`, { body, contentType: 'application/json' })
}
