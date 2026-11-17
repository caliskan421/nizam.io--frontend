import { describe, expect, it } from 'vitest'

import { fakeChatServer, msg, range, seqs } from '../__tests__/fixtures'
import { emptyWindow, highSeq, lowSeq, upsertMessage, type MessageWindow } from './window'
import {
  loadAround,
  loadLatest,
  loadNewer,
  loadOlder,
  reconcile,
  refreshAround,
  type WindowStore,
} from './window-io'

function store(initial: MessageWindow = emptyWindow()) {
  let current = initial
  const s: WindowStore = {
    get: () => current,
    set: (update) => {
      current = update(current)
    },
  }
  return s
}

describe('loadLatest / loadOlder (before)', () => {
  it('ilk açılış son sayfa (imleçsiz); yukarı kaydırma before=<alt seq> sayfaları', async () => {
    const server = fakeChatServer(range(1, 130), 120)
    const s = store()
    await loadLatest(server.read, s)
    expect(seqs(s.get().items)).toEqual(range(81, 130).map((m) => m.seq))
    expect(s.get()).toMatchObject({ hasOlder: true, hasNewer: false, peerReadSeq: 120 })
    expect(server.reads[0]).toEqual({ limit: 50 })
    await loadOlder(server.read, s)
    expect(lowSeq(s.get())).toBe(31)
    expect(server.reads[1]).toEqual({ limit: 50, before: 81 })
    await loadOlder(server.read, s)
    expect(lowSeq(s.get())).toBe(1)
    expect(s.get().hasOlder).toBe(false)
    expect(s.get().items).toHaveLength(130)
  })

  it('pencere boşken loadOlder son sayfayı okur', async () => {
    const server = fakeChatServer(range(1, 5))
    const s = store()
    await loadOlder(server.read, s)
    expect(seqs(s.get().items)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('loadNewer (after)', () => {
  it('sayfa dolu döndükçe son seq ile tekrar; sonda durur', async () => {
    const server = fakeChatServer(range(1, 10))
    const s = store()
    await loadLatest(server.read, s)
    for (let seq = 11; seq <= 130; seq += 1) server.add(msg(seq))
    await loadNewer(server.read, s)
    expect(highSeq(s.get())).toBe(130)
    const afters = server.reads.filter((r) => r.after !== undefined).map((r) => r.after)
    expect(afters).toEqual([10, 60, 110])
    expect(s.get().hasNewer).toBe(false)
  })

  it('kendi gönderimimin yankısı tekilleşir (aynı message_id)', async () => {
    const server = fakeChatServer(range(1, 3))
    const s = store()
    await loadLatest(server.read, s)
    s.set((w) => upsertMessage(w, msg(4, { sender_account_id: 'me' })))
    server.add(msg(4, { sender_account_id: 'me' }))
    await loadNewer(server.read, s)
    expect(seqs(s.get().items)).toEqual([1, 2, 3, 4])
  })

  it('araya giren yerel yama okuma sırasında kaybolmaz (adım adım güncel pencereye yazılır)', async () => {
    const server = fakeChatServer(range(1, 3))
    const s = store()
    await loadLatest(server.read, s)
    server.add(msg(4))
    const slow = async (q: Parameters<typeof server.read>[0]) => {
      const page = await server.read(q)
      // Okuma sürerken kullanıcı kendi mesajını gönderdi (yerel yama).
      s.set((w) => upsertMessage(w, msg(5, { sender_account_id: 'me' })))
      return page
    }
    await loadNewer(slow, s)
    expect(seqs(s.get().items)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('loadAround / refreshAround', () => {
  it('around: pencere yeniden kurulur; iki yan açık', async () => {
    const server = fakeChatServer(range(1, 200))
    const s = store()
    await loadAround(server.read, s, 100)
    expect(server.reads[0]).toEqual({ limit: 50, around: 100 })
    expect(lowSeq(s.get())).toBeLessThan(100)
    expect(highSeq(s.get())).toBeGreaterThan(100)
    expect(s.get()).toMatchObject({ hasOlder: true, hasNewer: true })
  })

  it('refreshAround yalnız yerel mesajları günceller, pencereyi genişletmez', async () => {
    const server = fakeChatServer(range(1, 100))
    const s = store()
    await loadLatest(server.read, s)
    const before = s.get().items.length
    server.edit(95, {
      body: 'düzenli',
      edited: true,
      reactions: [{ kind: 'heart', count: 1, mine: true }],
    })
    await refreshAround(server.read, s, 95)
    expect(s.get().items).toHaveLength(before)
    expect(s.get().items.find((m) => m.seq === 95)).toMatchObject({
      body: 'düzenli',
      edited: true,
    })
    expect(server.reads.at(-1)).toEqual({ limit: 50, around: 95 })
  })
})

describe('reconcile (yeniden bağlanma protokolü)', () => {
  it('pencere boşsa ilk açılış gibi son sayfa', async () => {
    const server = fakeChatServer(range(1, 5))
    const s = store()
    await reconcile(server.read, s)
    expect(seqs(s.get().items)).toEqual([1, 2, 3, 4, 5])
  })

  it('akış dışı sürede: yeni mesajlar eklenir, silinen kalkar, düzenlenen güncellenir', async () => {
    const server = fakeChatServer(range(1, 20))
    const s = store()
    await loadLatest(server.read, s)
    server.remove(7)
    server.edit(9, { body: 'yeni gövde', edited: true })
    for (const seq of [21, 22]) server.add(msg(seq))
    await reconcile(server.read, s)
    expect(seqs(s.get().items)).toEqual([
      ...range(1, 20)
        .map((m) => m.seq)
        .filter((n) => n !== 7),
      21,
      22,
    ])
    expect(s.get().items.find((m) => m.seq === 9)?.body).toBe('yeni gövde')
  })

  it('çok sayfalı pencere: Ü+1’den before sayfalarıyla baştan okunur; sayfalar arası silme bulunur', async () => {
    const server = fakeChatServer(range(1, 200))
    const s = store()
    await loadLatest(server.read, s)
    await loadOlder(server.read, s)
    await loadOlder(server.read, s)
    await loadOlder(server.read, s)
    expect(lowSeq(s.get())).toBe(1)
    server.remove(3)
    server.remove(100)
    server.remove(199)
    server.reads.length = 0
    await reconcile(server.read, s)
    expect(s.get().items.map((m) => m.seq)).not.toContain(3)
    expect(s.get().items.map((m) => m.seq)).not.toContain(100)
    expect(s.get().items.map((m) => m.seq)).not.toContain(199)
    expect(s.get().items).toHaveLength(197)
    const befores = server.reads.filter((r) => r.before !== undefined).map((r) => r.before)
    // Ü = 200 → imleç 201, sonra her sayfanın en küçük seq'i (199 silindi: sayfa 150'ye iner).
    expect(befores.slice(0, 2)).toEqual([201, 150])
    expect(server.reads[0]).toMatchObject({ after: 200 })
  })

  it('tüm pencere silindiyse boş sonuç hepsini kaldırır', async () => {
    const server = fakeChatServer(range(1, 5))
    const s = store()
    await loadLatest(server.read, s)
    for (let i = 1; i <= 5; i += 1) server.remove(i)
    await reconcile(server.read, s)
    expect(s.get().items).toEqual([])
  })

  it('sayfa alt sınıra (A) ulaşınca durur: daha eski mesajlar okunmaz', async () => {
    const server = fakeChatServer(range(1, 300))
    const s = store()
    await loadLatest(server.read, s) // 251..300
    server.reads.length = 0
    await reconcile(server.read, s)
    const befores = server.reads.filter((r) => r.before !== undefined)
    expect(befores).toHaveLength(1)
    expect(lowSeq(s.get())).toBe(251)
  })
})
