import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { bindSessionQueries, SessionChangedError, sessionBound } from './query-session'
import type { SessionSnapshot } from './auth-session'

/** Denetlenebilir oturum: nesil + hesap; `change` aboneleri uyarır. */
function fakeSession(accountId: string | null = 'acc-1') {
  const listeners = new Set<(s: SessionSnapshot) => void>()
  const state = {
    generation: 1,
    snapshot: { status: 'authenticated', accountId } as SessionSnapshot,
  }
  return {
    get generation() {
      return state.generation
    },
    get snapshot() {
      return state.snapshot
    },
    subscribe(fn: (s: SessionSnapshot) => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    change(next: { generation?: number; accountId?: string | null }) {
      state.generation = next.generation ?? state.generation
      state.snapshot = { ...state.snapshot, accountId: next.accountId ?? null }
      for (const fn of listeners) fn(state.snapshot)
    },
  }
}

describe('sessionBound (okuyucu kapısı)', () => {
  it('aynı oturumda veri döner; tekrar aynı sinyalle aynı damgayı kullanır', async () => {
    const session = fakeSession()
    const signal = new AbortController().signal
    const read = sessionBound(() => Promise.resolve('veri'), session)
    expect(await read({ signal })).toBe('veri')
    expect(await read({ signal })).toBe('veri')
  })

  it('tekrar başka oturumda: istek yapılmaz, SessionChangedError', async () => {
    const session = fakeSession()
    const signal = new AbortController().signal
    let calls = 0
    const read = sessionBound(() => {
      calls += 1
      return calls === 1 ? Promise.reject(new Error('geçici')) : Promise.resolve('veri')
    }, session)
    await expect(read({ signal })).rejects.toThrow('geçici')
    session.change({ generation: 2, accountId: 'acc-2' })
    await expect(read({ signal })).rejects.toBeInstanceOf(SessionChangedError)
    expect(calls).toBe(1)
  })

  it('geç yanıt: istek sürerken oturum değişti → veri dönmez', async () => {
    const session = fakeSession()
    let release!: (v: string) => void
    const read = sessionBound(() => new Promise<string>((r) => (release = r)), session)
    const pending = read({ signal: new AbortController().signal })
    session.change({ generation: 2, accountId: null })
    release('eski veri')
    await expect(pending).rejects.toBeInstanceOf(SessionChangedError)
  })

  it('yeni getirme (yeni sinyal) yeni oturumda serbest', async () => {
    const session = fakeSession()
    const read = sessionBound(() => Promise.resolve(session.snapshot.accountId), session)
    session.change({ generation: 2, accountId: 'acc-2' })
    expect(await read({ signal: new AbortController().signal })).toBe('acc-2')
  })
})

describe('bindSessionQueries (yaşam döngüsü)', () => {
  function seeded() {
    const client = new QueryClient()
    client.setQueryData(['me'], { account_id: 'acc-1' })
    return client
  }

  it('nesil değişimi (çıkış, kardeş sekme dahil) → önbellek boşalır', () => {
    const session = fakeSession()
    const client = seeded()
    bindSessionQueries(client, session)
    session.change({ generation: 2, accountId: null })
    expect(client.getQueryCache().getAll()).toEqual([])
  })

  it('aynı nesilde başka hesaba geçiş → boşalır; aynı hesap (yenileme) → dokunulmaz', () => {
    const session = fakeSession()
    const client = seeded()
    const off = bindSessionQueries(client, session)
    session.change({ accountId: 'acc-1' })
    expect(client.getQueryData(['me'])).toEqual({ account_id: 'acc-1' })
    session.change({ accountId: null })
    expect(client.getQueryData(['me'])).toEqual({ account_id: 'acc-1' })
    session.change({ accountId: 'acc-2' })
    expect(client.getQueryCache().getAll()).toEqual([])
    off()
    client.setQueryData(['me'], { account_id: 'acc-2' })
    session.change({ generation: 3, accountId: null })
    expect(client.getQueryData(['me'])).toEqual({ account_id: 'acc-2' })
  })
})
