// F7 sohbet duman senaryosu (W160 · O3): iki hesap, gerçek backend, üretim paketi + üretim CSP'si.
// Yönetici ve tohumlu ikinci hesap (e2e/global-setup.ts) aynı grupta: gönder → diğer hesapta
// SSE ile (sayfa yenilenmeden) görünür → okundu → liste ve menü rozeti türevleri düşer. Her koşum
// benzersiz metin kullanır (veritabanı koşumlar arası kalıcıdır); gerçek zaman beklemesi yok —
// beklemeler koşula bağlıdır (`expect` zaman aşımı SSE birleştirme penceresini aşar).
import { expect, test, type Browser, type Page } from '@playwright/test'

import { cspViolations, describeViolations, enforceCaddyCsp } from './csp-check'
import { ADMIN, readChatFixture } from './fixture'
import { storageHasOnlyAllowedKeys } from './storage-check'

const LIVE = { timeout: 20_000 }

async function newPage(
  browser: Browser,
  scope: { programId: string; lens: 'admin' | 'member'; departmentId?: string },
): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await enforceCaddyCsp(page)
  // Kapsam tercihi (izinli anahtarlar, K2): çok program olan e2e veritabanında seçim beklenmesin.
  await page.addInitScript((s) => {
    window.localStorage.setItem('nizamio.pref.scope.programId', s.programId)
    window.localStorage.setItem('nizamio.pref.scope.lens', s.lens)
    if (s.departmentId)
      window.localStorage.setItem('nizamio.pref.scope.departmentId', s.departmentId)
  }, scope)
  return page
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/')
  await expect(page.getByTestId('session-status')).toHaveAttribute('data-status', 'anonymous')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'giriş' }).click()
  await expect(page.getByTestId('app-shell')).toBeVisible()
}

/** Üretim CSP'sinde ihlal 0 (şimdiki belge). */
async function expectNoViolations(page: Page, where: string): Promise<void> {
  const violations = await cspViolations(page)
  expect(violations, describeViolations(where, violations)).toEqual([])
}

/** Tam gezinme: oturum HttpOnly çerezle sessiz refresh ile döner. */
async function open(page: Page, path: string): Promise<void> {
  const refreshed = page.waitForResponse((r) => r.url().endsWith('/v1/auth/refresh'))
  await page.goto(path)
  expect((await refreshed).status()).toBe(200)
  await expect(page.getByTestId('app-shell')).toBeVisible()
}

const sendMessage = async (page: Page, text: string) => {
  const field = page.locator('[data-chat-composer-input]')
  await field.fill(text)
  await page.getByRole('button', { name: 'Gönder' }).click()
}
const bubble = (page: Page, text: string) =>
  page.locator('[data-testid="chat-message"]').filter({ hasText: text })
const row = (page: Page, groupId: string) => page.locator(`[data-chat-id="${groupId}"]`)
const menuBadge = (page: Page) => page.locator('nav .side-badge[data-badge="unread"]')

test('F7 sohbet: iki hesap — gönder → SSE ile canlı → okundu → rozetler', async ({ browser }) => {
  const fixture = readChatFixture()
  const { chat } = fixture
  const run = Date.now().toString(36)
  const admin = await newPage(browser, { programId: fixture.programId, lens: 'admin' })
  const peer = await newPage(browser, {
    programId: fixture.programId,
    lens: 'member',
    departmentId: fixture.departmentId,
  })
  try {
    await signIn(admin, ADMIN.email, ADMIN.password)
    await signIn(peer, chat.peerEmail, chat.peerPassword)

    // Üye listede grubu görür (konuşma kapalı: akış açık, liste canlı).
    await open(peer, '/mesajlar')
    await expect(row(peer, chat.groupId)).toBeVisible(LIVE)
    await expectNoViolations(peer, '/mesajlar (üye listesi)')

    // Yönetici aynı grubu açar ve yazar; üye satırında canlı rozet + menü rozeti görür
    // (veritabanı koşumlar arası kalıcıdır: okunmamış durumu bu koşumun mesajı üretir).
    await open(admin, `/mesajlar/${chat.groupId}`)
    await expect(admin.locator('[data-testid="chat-message"]').first()).toBeVisible(LIVE)
    await sendMessage(admin, `Merhaba ${run}`)
    await expect(bubble(admin, `Merhaba ${run}`)).toBeVisible(LIVE)
    await expect(row(peer, chat.groupId)).toContainText(`Merhaba ${run}`, LIVE)
    await expect(row(peer, chat.groupId).locator('.chat-row__badge')).toBeVisible(LIVE)
    await expect(menuBadge(peer)).toBeVisible(LIVE)

    // Üye grubu açar: yeni mesaj görünür; okundu işaretlenir (pencere odakta) → satır ve menü rozeti düşer.
    await peer.bringToFront()
    await row(peer, chat.groupId).click()
    await expect(bubble(peer, `Merhaba ${run}`)).toBeVisible(LIVE)
    await expect(row(peer, chat.groupId).locator('.chat-row__badge')).toHaveCount(0, LIVE)
    await expect(menuBadge(peer)).toHaveCount(0, LIVE)

    // Üye yanıtlar; yönetici sayfayı yenilemeden SSE ile görür (liste, sohbet ve rozet türevleri).
    await sendMessage(peer, `Selam ${run}`)
    await expect(bubble(peer, `Selam ${run}`)).toBeVisible(LIVE)
    await expect(bubble(admin, `Selam ${run}`)).toBeVisible(LIVE)

    // Konuşma açıkken gelen mesaj okunmamış sayılmaz (okundu işareti sürer): rozet çıkmaz.
    await sendMessage(admin, `Tekrar ${run}`)
    await peer.bringToFront()
    await expect(bubble(peer, `Tekrar ${run}`)).toBeVisible(LIVE)
    await expect(menuBadge(peer)).toHaveCount(0, LIVE)

    // Dar ekran (390): liste ↔ konuşma gerçek tıklama; CSP ihlali yok.
    await peer.setViewportSize({ width: 390, height: 844 })
    await peer.getByTestId('chat-back').click()
    await expect(peer.getByTestId('chat-page')).toHaveAttribute('data-pane', 'list')
    await row(peer, chat.groupId).click()
    await expect(peer.getByTestId('chat-page')).toHaveAttribute('data-pane', 'conversation')
    await expectNoViolations(peer, '/mesajlar/:id (390)')
    await expectNoViolations(admin, '/mesajlar/:id (yönetici)')
    expect(await storageHasOnlyAllowedKeys(admin)).toEqual([])
    expect(await storageHasOnlyAllowedKeys(peer)).toEqual([])
  } finally {
    await admin.context().close()
    await peer.context().close()
  }
})
