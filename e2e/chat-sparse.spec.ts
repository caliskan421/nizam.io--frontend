// W189: gerçek backend + aynı uygulama önbelleğiyle sohbetten çıkış ve geri dönüş.
import { expect, test } from '@playwright/test'
import { cspViolations } from './csp-check'
import { sparseFixture } from './chat-sparse-fixture'

test('ilk 50 dışındaki sohbet yeniden açıldığında eski okunmamış ayırıcı çizilmez', async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(720_000)
  if (!baseURL) throw new Error('baseURL yok')
  const seed = await sparseFixture(baseURL)
  const errors: string[] = []
  const reads: { query: string; firstUnread: number | null }[] = []
  try {
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', async (response) => {
      const url = new URL(response.url())
      if (url.pathname === `/v1/chats/${seed.target.id}/messages` && response.ok()) {
        const data = (await response.json()) as { first_unread_seq: number | null }
        reads.push({ query: url.search, firstUnread: data.first_unread_seq })
      }
    })
    await page.addInitScript(
      ({ program, department }) => {
        localStorage.setItem('nizamio.pref.scope.programId', program)
        localStorage.setItem('nizamio.pref.scope.departmentId', department)
        localStorage.setItem('nizamio.pref.scope.lens', 'member')
        localStorage.setItem('nizamio.pref.ui.theme', 'dark')
        const violations: unknown[] = []
        ;(window as unknown as { __cspViolations: unknown[] }).__cspViolations = violations
        document.addEventListener('securitypolicyviolation', (event) =>
          violations.push(event.effectiveDirective),
        )
      },
      { program: seed.fixture.programId, department: seed.fixture.departmentId },
    )
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto('/')
    await page.locator('input[name="email"]').fill(seed.fixture.chat.peerEmail)
    await page.locator('input[name="password"]').fill(seed.fixture.chat.peerPassword)
    await page.getByRole('button', { name: 'giriş' }).click()
    await expect(page.getByTestId('app-shell')).toBeVisible()
    await page.goto(`/mesajlar/${seed.target.id}`)
    await page.bringToFront()
    await expect(page.getByTestId('chat-unread')).toHaveText('Okunmamış mesajlar', {
      timeout: 20_000,
    })
    await expect(page.locator(`[data-seq="${seed.target.seq}"]`)).toBeVisible()
    await info.attach('sparse-390', { body: await page.screenshot(), contentType: 'image/png' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.getByTestId('chat-unread')).toHaveText('Okunmamış mesajlar')
    await info.attach('sparse-1440', { body: await page.screenshot(), contentType: 'image/png' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
    await expect
      .poll(async () => (await seed.history(seed.target.id)).first_unread_seq, { timeout: 20_000 })
      .toBeNull()
    await page.locator(`[data-chat-id="${seed.other}"]`).first().click()
    await expect(page).toHaveURL(new RegExp(`/mesajlar/${seed.other}$`))
    const reread = page.waitForRequest((request) => {
      const url = new URL(request.url())
      return request.method() === 'GET' && url.pathname === `/v1/chats/${seed.target.id}/messages`
    })
    await page.goBack()
    const request = await reread
    const response = await request.response()
    expect(response?.status()).toBe(200)
    const body = (await response!.json()) as { first_unread_seq: number | null }
    expect(body.first_unread_seq).toBeNull()
    await expect(page).toHaveURL(new RegExp(`/mesajlar/${seed.target.id}$`))
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    await expect(page.locator(`[data-seq="${seed.target.seq}"]`)).toBeVisible()
    await expect(page.getByTestId('chat-unread')).toHaveCount(0)
    expect(await cspViolations(page)).toEqual([])
    expect(errors).toEqual([])
  } finally {
    await info.attach('sparse-evidence', {
      body: JSON.stringify({ target: seed.target, reads, errors }, null, 2),
      contentType: 'application/json',
    })
    await seed.cleanup()
  }
})
