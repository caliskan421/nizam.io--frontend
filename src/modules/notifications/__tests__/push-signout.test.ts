import { afterEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'

import { installBrowser, type BrowserFake } from '../components/push/__tests__/browser-fakes'
import { ensurePushSignOutHook, installPushSignOutHook } from '../model/push-signout'

describe('çıkış kancası (E-14-79)', () => {
  function fakeSession() {
    const listeners = new Set<(s: { accountId: string | null }) => void>()
    const state = { generation: 0, snapshot: { accountId: 'a1' as string | null } }
    return {
      state,
      session: {
        get generation() {
          return state.generation
        },
        get snapshot() {
          return state.snapshot as never
        },
        subscribe: (listener: (s: { accountId: string | null }) => void) => {
          listeners.add(listener)
          return () => void listeners.delete(listener)
        },
      },
      emit: () => listeners.forEach((l) => l(state.snapshot)),
    }
  }

  it('nesil artınca (çıkış, kardeş sekme dahil) yerel abonelik iptal edilir', () => {
    const unsubscribe = vi.fn(() => Promise.resolve())
    const { session, state, emit } = fakeSession()
    installPushSignOutHook(session as never, unsubscribe)
    emit() // nesil aynı: değişiklik yok
    expect(unsubscribe).not.toHaveBeenCalled()
    state.generation = 1
    state.snapshot = { accountId: null }
    emit()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('başka hesaba geçişte iptal edilir; aynı hesapta yenilemede edilmez', () => {
    const unsubscribe = vi.fn(() => Promise.resolve())
    const { session, state, emit } = fakeSession()
    installPushSignOutHook(session as never, unsubscribe)
    state.snapshot = { accountId: 'a1' }
    emit()
    expect(unsubscribe).not.toHaveBeenCalled()
    state.snapshot = { accountId: 'a2' }
    emit()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('dinlemeyi bırakma işlevi döner', () => {
    const unsubscribe = vi.fn(() => Promise.resolve())
    const { session, state, emit } = fakeSession()
    const off = installPushSignOutHook(session as never, unsubscribe)
    off()
    state.generation = 1
    emit()
    expect(unsubscribe).not.toHaveBeenCalled()
  })
})

describe('çıkış kancası: gerçek oturum nesnesiyle', () => {
  let fake: BrowserFake | null = null
  afterEach(() => {
    fake?.restore()
    fake = null
  })

  it('çıkışta (authSession.clear) tarayıcı aboneliği yerelde iptal edilir; unregisterPushTarget yok', async () => {
    const browser = installBrowser({ existing: true })
    fake = browser
    ensurePushSignOutHook()
    ensurePushSignOutHook() // idempotent: ikinci kurulum ikinci dinleyici eklemez
    authSession.establish({
      token: 'tok-1',
      account_id: 'acc-1',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      force_password_change: false,
    })
    expect(browser.subscription.unsubscribe).not.toHaveBeenCalled()
    authSession.clear()
    await vi.waitFor(() => expect(browser.subscription.unsubscribe).toHaveBeenCalledTimes(1))
  })
})
