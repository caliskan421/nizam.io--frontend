import { afterEach, describe, expect, it, vi } from 'vitest'

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

/** Kontrollü Promise: zamanlama testleri gerçek süreye dayanmaz. */
function deferred<T = void>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const refreshOk = (n: number) =>
  new Response(
    JSON.stringify({
      token: T(n),
      account_id: 'acc-1',
      expires_at: Math.floor(Date.now() / 1000) + 900,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )

/** Refresh isteği çağrıldığında haber veren, yanıtı test elinde tutan sekme. */
function pendingTab(browser: ReturnType<typeof createFakeBrowser>) {
  const called = deferred()
  const reply = deferred<Response>()
  const fetch = vi.fn<(input: Request) => Promise<Response>>(() => {
    called.resolve()
    return reply.promise
  })
  const session = new AuthSession({
    baseUrl: 'http://localhost',
    fetch,
    coordination: browser.tab(),
    syncWaitMs: 0,
  })
  return { session, fetch, called, reply }
}

describe('AuthSession — oturum nesli (CX-F0-E-03)', () => {
  it.each([
    ['doğrulanamadı', true],
    ['doğrulandı', false],
  ])('gecikmiş refresh yanıtı çıkıştan (%s) sonra gelirse uygulanmaz', async (_n, unverified) => {
    const browser = createFakeBrowser()
    const a = pendingTab(browser)
    a.session.establish(login(1))
    const outcome = a.session.refresh(T(1))
    await a.called.promise

    a.session.clear({ serverUnverified: unverified })
    a.reply.resolve(refreshOk(2))

    expect(await outcome).toBe('ended')
    expect(a.session.token).toBeNull()
    expect(a.session.snapshot).toMatchObject({
      status: 'anonymous',
      accountId: null,
      serverLogoutUnverified: unverified,
    })
    expect(browser.published).not.toContainEqual(expect.objectContaining({ token: T(2) }))
  })

  it('kilitte bekleyen refresh çıkıştan sonra ağa çıkmaz; yeni nesil eskisine katılmaz', async () => {
    const gate = deferred()
    const fetch = vi.fn<(input: Request) => Promise<Response>>(() => Promise.resolve(refreshOk(3)))
    const session = new AuthSession({
      baseUrl: 'http://localhost',
      fetch,
      syncWaitMs: 0,
      coordination: {
        crossTabLock: true,
        withLock: (_name, task) => gate.promise.then(task),
        publish: () => undefined,
        subscribe: () => undefined,
      },
    })
    session.establish(login(1))
    const stale = session.refresh(T(1))
    session.clear({ serverUnverified: true })
    session.establish(login(2)) // yeni açık giriş: bayrak kapanır, yeni nesil
    const fresh = session.refresh(T(2))
    expect(fresh).not.toBe(stale)

    gate.resolve()
    expect(await stale).toBe('ended')
    expect(await fresh).toBe('ok')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(session.token).toBe(T(3))
  })

  it('eski nesilde başlamış açık giriş yanıtı uygulanmaz; bayrağı yalnız yeni giriş kapatır', () => {
    const { session } = tab(createFakeBrowser())
    session.establish(login(1))
    const before = session.generation
    session.clear({ serverUnverified: true })

    expect(session.establish(login(2), false, before)).toBe(false)
    expect(session.snapshot).toMatchObject({ status: 'anonymous', serverLogoutUnverified: true })

    expect(session.establish(login(3), false, session.generation)).toBe(true)
    expect(session.snapshot).toMatchObject({
      status: 'authenticated',
      serverLogoutUnverified: false,
    })
  })

  describe('kardeş sekme', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('çıkıştan önce başlamış kardeş refresh belirteci eski nesilde reddedilir', async () => {
      vi.useFakeTimers({ now: 1_800_000_000_000 })
      const browser = createFakeBrowser({ deliveryDelayMs: 10 })
      const a = pendingTab(browser)
      const b = pendingTab(browser)
      a.session.establish(login(1))
      await vi.advanceTimersByTimeAsync(20)
      expect(b.session.token).toBe(T(1))

      const outcome = b.session.refresh(T(1))
      await b.called.promise
      await vi.advanceTimersByTimeAsync(20)
      a.session.clear()
      // B'nin yanıtı A'nın çıkışından sonra, çıkış iletisi B'ye ulaşmadan gelir.
      await vi.advanceTimersByTimeAsync(2)
      b.reply.resolve(refreshOk(2))
      expect(await outcome).toBe('ok')
      expect(b.session.token).toBe(T(2))

      await vi.advanceTimersByTimeAsync(20)
      expect(a.session.token).toBeNull()
      expect(a.session.snapshot.status).toBe('anonymous')
      expect(b.session.token).toBeNull()

      // Çıkıştan SONRA alınmış belirteç (kardeşte yeni açık giriş) kabul edilir.
      b.session.establish(login(4))
      await vi.advanceTimersByTimeAsync(20)
      expect(a.session.token).toBe(T(4))
    })

    it('açılış refresh’i sürerken kardeşin çıkışı gelirse yanıt uygulanmaz, oturum anonim', async () => {
      const browser = createFakeBrowser()
      const a = pendingTab(browser)
      a.session.establish(login(1))
      const c = pendingTab(browser) // A'nın yayınından sonra açılan sekme: durum `unknown`
      const boot = c.session.refresh(null)
      await c.called.promise
      a.session.clear()
      // Çıkış iletisi mikro görevle teslim edilir; ondan sonra kuyruğa giren görev bekler.
      await new Promise<void>((r) => queueMicrotask(r))
      c.reply.resolve(refreshOk(5))
      expect(await boot).toBe('ended')
      expect(c.session.token).toBeNull()
      expect(c.session.snapshot.status).toBe('anonymous')
    })
  })
})
