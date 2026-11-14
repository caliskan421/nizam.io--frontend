import { describe, expect, it } from 'vitest'

import { msg, range, seqs } from '../__tests__/fixtures'
import {
  MESSAGE_PAGE_LIMIT,
  appendNewer,
  applyCoverage,
  coverageDone,
  emptyWindow,
  findMessage,
  highSeq,
  lowSeq,
  nextCursor,
  prependOlder,
  removeMessage,
  seqOf,
  upsertMessage,
  windowFromAround,
  windowFromLatest,
} from './window'

describe('pencere kurulumu', () => {
  it('son sayfa: seq sıralı; dolu sayfa daha eski var der, yeni yok', () => {
    const full = windowFromLatest(range(51, 100).reverse(), null)
    expect(seqs(full.items)).toEqual(range(51, 100).map((m) => m.seq))
    expect(full).toMatchObject({ hasOlder: true, hasNewer: false, peerReadSeq: null })
    expect(windowFromLatest(range(1, 10), 7)).toMatchObject({ hasOlder: false, peerReadSeq: 7 })
    expect(lowSeq(full)).toBe(51)
    expect(highSeq(full)).toBe(100)
    expect(lowSeq(emptyWindow())).toBeNull()
    expect(highSeq(emptyWindow())).toBeNull()
  })

  it('around: iki yan açık sayılır; başa dayandıysa daha eski yok', () => {
    expect(windowFromAround(range(40, 60), null, 50)).toMatchObject({
      hasOlder: true,
      hasNewer: true,
    })
    expect(windowFromAround(range(1, 20), null, 5).hasOlder).toBe(false)
  })
})

describe('sayfa birleştirme', () => {
  it('prependOlder: eski sayfa başa; sayfa boyu dolmadıysa başlangıç', () => {
    const win = windowFromLatest(range(51, 100), null)
    const older = prependOlder(win, range(1, 50))
    expect(older.items).toHaveLength(100)
    expect(seqs(older.items).slice(0, 2)).toEqual([1, 2])
    // 50'lik sayfa seq=1'i içeriyorsa başlangıca ulaşıldı.
    expect(older.hasOlder).toBe(false)
    expect(prependOlder(win, range(21, 70).slice(0, 30)).hasOlder).toBe(false)
    expect(prependOlder(win, range(2, 51).slice(0, 49)).hasOlder).toBe(false)
    const mid = prependOlder(windowFromLatest(range(101, 150), null), range(51, 100))
    expect(mid.hasOlder).toBe(true)
  })

  it('appendNewer: yeni sayfa sona; boy dolmadıysa sohbetin sonu; tik değeri güncellenir', () => {
    const win = { ...windowFromLatest(range(1, 10), 3), hasNewer: true }
    const more = appendNewer(win, range(11, 14), 9)
    expect(highSeq(more)).toBe(14)
    expect(more).toMatchObject({ hasNewer: false, peerReadSeq: 9 })
    const full = appendNewer(win, range(11, 60), null)
    expect(full.hasNewer).toBe(true)
    expect(full.peerReadSeq).toBe(3)
    expect(MESSAGE_PAGE_LIMIT).toBe(50)
  })

  it('aynı message_id tekilleşir; yeni kayıt eskinin üstüne yayılır (sender_name korunur)', () => {
    const win = windowFromLatest([msg(5, { body: 'eski', sender_name: 'Ayşe' })], null)
    const own = { ...msg(5, { body: 'yeni', edited: true }), sender_name: undefined }
    delete (own as { sender_name?: string }).sender_name
    const next = upsertMessage(win, own)
    expect(next.items).toHaveLength(1)
    expect(next.items[0]).toMatchObject({ body: 'yeni', edited: true, sender_name: 'Ayşe' })
  })

  it('upsert yeni mesajı seq sırasına koyar', () => {
    const win = windowFromLatest([msg(1), msg(3)], null)
    expect(seqs(upsertMessage(win, msg(2)).items)).toEqual([1, 2, 3])
  })
})

describe('kimlikle erişim ve kaldırma', () => {
  const win = windowFromLatest(range(1, 5), null)
  it('removeMessage kimlikle kaldırır; yoksa aynı nesne döner', () => {
    expect(seqs(removeMessage(win, 'm3').items)).toEqual([1, 2, 4, 5])
    expect(removeMessage(win, 'yok')).toBe(win)
  })
  it('seqOf / findMessage', () => {
    expect(seqOf(win, 'm4')).toBe(4)
    expect(seqOf(win, 'm9')).toBeNull()
    expect(findMessage(win, 'm2')?.seq).toBe(2)
    expect(findMessage(win, 'x')).toBeNull()
  })
})

describe('yeniden bağlanma uzlaştırması (istemci-akislari §10.5)', () => {
  const limit = 5

  it('kapsanan aralıkta olup dönmeyen yerel kayıt silinmiş sayılır', () => {
    const win = windowFromLatest(range(1, 4), null, limit)
    // Sunucu: 2 silinmiş; sayfa boydan az → aralığın altı açık, hepsi kapsanır.
    const page = [msg(1), msg(3), msg(4)]
    const next = applyCoverage(win, page, 5, limit)
    expect(seqs(next.items)).toEqual([1, 3, 4])
  })

  it('boş sonuç: imlecin altındaki bütün yerel mesajlar silinmiştir; imleç ve üstü korunur', () => {
    const win = windowFromLatest(range(1, 8), null, limit)
    const next = applyCoverage(win, [], 6, limit)
    expect(seqs(next.items)).toEqual([6, 7, 8])
  })

  it('dolu sayfa yalnız [en küçük dönen seq, imleç-1] aralığını kapsar; altı dokunulmaz', () => {
    const win = windowFromLatest(range(1, 12), null, limit)
    // imleç 13: sayfa 8..12 (dolu); 3 ve 4 aralıkta silinmiş değil; 6 silinmiş (dönmedi).
    const page = [msg(8), msg(9), msg(10), msg(11), msg(12)]
    const kept = applyCoverage(win, page, 13, limit)
    expect(seqs(kept.items)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    const withGap = applyCoverage(win, [msg(7), msg(9), msg(10), msg(11), msg(12)], 13, limit)
    expect(seqs(withGap.items)).toEqual([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12])
  })

  it('dönen kayıt yereli günceller (düzenleme)', () => {
    const win = windowFromLatest([msg(1), msg(2)], null, limit)
    const next = applyCoverage(win, [msg(1), msg(2, { body: 'düzenli', edited: true })], 3, limit)
    expect(next.items[1]).toMatchObject({ body: 'düzenli', edited: true })
  })

  it('imleç ve üstündeki yerel kayıtlar (daha yeni) korunur', () => {
    const win = windowFromLatest(range(1, 10), null, limit)
    const next = applyCoverage(win, [msg(1), msg(2)], 3, limit)
    expect(seqs(next.items)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('coverageDone: sayfa boydan azsa ya da alt sınıra (A) ulaştıysa tamam', () => {
    expect(coverageDone([msg(8)], 1, limit)).toBe(true)
    const full = range(6, 10)
    expect(coverageDone(full, 6, limit)).toBe(true)
    expect(coverageDone(full, 3, limit)).toBe(false)
    expect(nextCursor(full)).toBe(6)
  })
})
