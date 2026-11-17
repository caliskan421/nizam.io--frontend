import { describe, expect, it } from 'vitest'

import { makeChatHistory } from '@/shared/api/__tests__/defaults'

import { msg } from '../__tests__/fixtures'
import { refreshReadState } from './read-state'
import { loadLatest, loadOlder, type MessageReader } from './window-io'
import type { ChatMessage } from './types'
import { windowFromLatest, type MessageWindow } from './window'
import type { WindowStore } from './window-io'

function store(win: MessageWindow): WindowStore & { now: () => MessageWindow } {
  let current = win
  return {
    get: () => current,
    set: (update) => void (current = update(current)),
    now: () => current,
  }
}

describe('refreshReadState', () => {
  it('grup: yalnız read_by_all (true/false/null) ve peer_read_seq güncellenir; gövde yerelde kalır', async () => {
    const local = [
      msg(1, { body: 'yerel', read_by_all: false }),
      msg(2, { read_by_all: false }),
      msg(3, { read_by_all: false }),
    ]
    const s = store(windowFromLatest(local, null))
    const fresh: ChatMessage[] = [
      msg(1, { body: 'sunucu', read_by_all: true }),
      msg(2, { read_by_all: null }),
      msg(3, { read_by_all: false }),
    ]
    const queries: unknown[] = []
    await refreshReadState((q) => {
      queries.push(q)
      return Promise.resolve(makeChatHistory({ items: fresh, peer_read_seq: null }))
    }, s)
    expect(queries).toEqual([{ limit: 50, before: 4 }])
    const items = s.now().items
    expect(items.map((m) => m.read_by_all)).toEqual([true, null, false])
    expect(items[0]!.body).toBe('yerel')
  })

  it('sunucunun null değeri önceki true durumunu temizler', async () => {
    const s = store(windowFromLatest([msg(1, { read_by_all: true })], null))
    await refreshReadState(
      () => Promise.resolve(makeChatHistory({ items: [msg(1, { read_by_all: null })] })),
      s,
    )
    expect(s.now().items[0]!.read_by_all).toBeNull()
  })

  it('birebir: peer_read_seq güncellenir; read_by_all alanı yoksa yereli bozmaz', async () => {
    const s = store(windowFromLatest([msg(1), msg(2)], null))
    await refreshReadState(
      () => Promise.resolve(makeChatHistory({ items: [msg(1), msg(2)], peer_read_seq: 2 })),
      s,
    )
    expect(s.now().peerReadSeq).toBe(2)
    expect('read_by_all' in s.now().items[0]!).toBe(false)
  })

  it('pencere boşsa son sayfa okunur', async () => {
    const s = store(windowFromLatest([], null))
    const queries: unknown[] = []
    await refreshReadState((q) => {
      queries.push(q)
      return Promise.resolve(makeChatHistory({ items: [], peer_read_seq: null }))
    }, s)
    expect(queries).toEqual([{ limit: 50 }])
  })
})

describe('refreshReadState — çok sayfalı yüklü pencere (SSE read.updated)', () => {
  /** Kendi grup mesajlarım 1..120; `readUpTo`'ya kadar herkes okudu (`read_by_all` sunucudan). */
  function groupServer(readUpTo: () => number) {
    const all = Array.from({ length: 120 }, (_, i) => msg(i + 1, { body: `sunucu ${i + 1}` }))
    const reads: Array<Record<string, unknown>> = []
    const read: MessageReader = (query) => {
      reads.push({ ...query })
      const limit = query.limit ?? 50
      let items = all.slice(-limit)
      if (query.before !== undefined) items = all.filter((m) => m.seq < query.before!).slice(-limit)
      if (query.around !== undefined) {
        const lower = all.filter((m) => m.seq < query.around!).slice(-Math.floor(limit / 2))
        items = [...lower, ...all.filter((m) => m.seq >= query.around!)].slice(0, limit)
      }
      const view = items.map((m) => ({ ...m, read_by_all: m.seq <= readUpTo() }))
      return Promise.resolve(makeChatHistory({ items: view, peer_read_seq: null }))
    }
    return { read, reads }
  }

  it('son around sayfası dışındaki eski kendi mesajlarının tiki de yenilenir; pencere ve içerik korunur, istek sınırlı', async () => {
    let upTo = 0
    const server = groupServer(() => upTo)
    const s = store(windowFromLatest([], null))
    await loadLatest(server.read, s)
    await loadOlder(server.read, s)
    await loadOlder(server.read, s)
    const before = s.now()
    expect(before.items.map((m) => m.seq)).toEqual(Array.from({ length: 120 }, (_, i) => i + 1))
    expect(before.items.every((m) => m.read_by_all === false)).toBe(true)
    // Yerel yama (ör. düzenleme): sunucudan gelen okundu yamasında kaybolmamalı.
    s.set((w) => ({
      ...w,
      items: w.items.map((m) => (m.seq === 10 ? { ...m, body: 'yerel düzenli' } : m)),
    }))
    server.reads.length = 0
    upTo = 100
    await refreshReadState(server.read, s)
    const after = s.now()
    expect(after.items.map((m) => m.seq)).toEqual(before.items.map((m) => m.seq))
    expect(after.items.find((m) => m.seq === 5)!.read_by_all).toBe(true) // son sayfa dışı
    expect(after.items.find((m) => m.seq === 100)!.read_by_all).toBe(true)
    expect(after.items.find((m) => m.seq === 101)!.read_by_all).toBe(false)
    expect(after.items.find((m) => m.seq === 10)!.body).toBe('yerel düzenli')
    expect(after.items.find((m) => m.seq === 119)!.body).toBe('sunucu 119')
    // Sınırlı: pencere boyutu / sayfa boyu kadar `before` sayfası (120 mesaj → ≤ 3), tam geçmiş taraması yok.
    expect(server.reads.length).toBeLessThanOrEqual(3)
    expect(server.reads.every((q) => q.before !== undefined || q.around !== undefined)).toBe(true)
  })

  it('sayfalar arasında pencere dışına çıkılmaz: pencere 71..120 iken yalnız o aralık okunur', async () => {
    const server = groupServer(() => 120)
    const s = store(windowFromLatest([], null))
    await loadLatest(server.read, s)
    server.reads.length = 0
    await refreshReadState(server.read, s)
    expect(server.reads).toHaveLength(1)
    expect(s.now().items.every((m) => m.read_by_all === true)).toBe(true)
  })

  it('birebir: peer_read_seq güncellenir (eski refreshPeerRead anlamı korunur)', async () => {
    const fresh = [msg(1), msg(2)]
    const s = store(windowFromLatest(fresh, 1))
    await refreshReadState(
      () => Promise.resolve(makeChatHistory({ items: fresh, peer_read_seq: 2 })),
      s,
    )
    expect(s.now().peerReadSeq).toBe(2)
  })
})
