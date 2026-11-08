import { describe, expect, it, vi } from 'vitest'

import { createFakeBrowser, T } from '../../../tests/support/fake-backend'
import { AuthSession } from './auth-session'
import { SESSION_MESSAGE_VERSION } from './messages'

const login = (n: number) => ({
  token: T(n),
  account_id: 'acc-1',
  expires_at: Math.floor(Date.now() / 1000) + 900,
  force_password_change: false,
})

function tab(browser: ReturnType<typeof createFakeBrowser>) {
  const fetch = vi.fn<(input: Request) => Promise<Response>>(() =>
    Promise.resolve(new Response(null, { status: 500 })),
  )
  const session = new AuthSession({
    baseUrl: 'http://localhost',
    fetch,
    coordination: browser.tab(),
  })
  return { session, fetch }
}

describe('AuthSession — sunucu çıkışı doğrulanamadı (ortak-kurallar §8)', () => {
  it('bayrak açıkken refresh ağa çıkmaz; kardeş sekme belirteci kabul edilmez', async () => {
    const browser = createFakeBrowser()
    const a = tab(browser)
    const b = tab(browser)
    a.session.establish(login(1))
    a.session.clear({ serverUnverified: true })
    expect(a.session.snapshot).toMatchObject({ status: 'anonymous', serverLogoutUnverified: true })

    expect(await a.session.refresh(null)).toBe('ended')
    expect(a.fetch).not.toHaveBeenCalled()

    b.session.establish(login(2))
    await new Promise((r) => setTimeout(r, 0))
    expect(a.session.token).toBeNull()
    expect(a.session.snapshot.serverLogoutUnverified).toBe(true)

    // Kardeşten gelen çıkış iletisi bayrağı düşürmez.
    browser.inject({ v: SESSION_MESSAGE_VERSION, type: 'logout', accountId: 'acc-1' })
    await new Promise((r) => setTimeout(r, 0))
    expect(a.session.snapshot.serverLogoutUnverified).toBe(true)
  })

  it('açık giriş bayrağı kapatır; normal çıkış bayrak koymaz', () => {
    const { session } = tab(createFakeBrowser())
    session.establish(login(1))
    session.clear({ serverUnverified: true })
    session.establish(login(2))
    expect(session.snapshot).toMatchObject({
      status: 'authenticated',
      serverLogoutUnverified: false,
    })
    session.clear()
    expect(session.snapshot.serverLogoutUnverified).toBe(false)
  })
})
