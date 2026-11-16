import { describe, expect, it } from 'vitest'

import { emptyRun } from './batch'
import {
  PURGE_ALL_CHUNK,
  PURGE_ALL_CONFIRM,
  shouldContinue,
  summarizePurgeAll,
  supportsPurgeAll,
  typedMatches,
} from './purge-all'

describe('onay değeri eşlemesi (ADR-0045: confirm = tür yol adı)', () => {
  it('görev work-items, toplantı meetings, kullanıcı accounts; koordinatörlük desteklenmez', () => {
    expect(PURGE_ALL_CONFIRM).toEqual({
      gorev: 'work-items',
      toplanti: 'meetings',
      kullanici: 'accounts',
    })
    expect(PURGE_ALL_CHUNK).toBe(50)
    expect(supportsPurgeAll('gorev')).toBe(true)
    expect(supportsPurgeAll('toplanti')).toBe(true)
    expect(supportsPurgeAll('kullanici')).toBe(true)
    // Uç şirket geneli çalışır, programa bağlı departmanı silemez: sekme kümesiyle örtüşmez.
    expect(supportsPurgeAll('koordinatorluk')).toBe(false)
  })
})

describe('tür adı yazarak onay', () => {
  it('kırpılmış, Türkçe katlamalı eşleşme; başka metin eşleşmez', () => {
    expect(typedMatches('görev', 'gorev')).toBe(true)
    expect(typedMatches('  GÖREV ', 'gorev')).toBe(true)
    expect(typedMatches('TOPLANTI', 'toplanti')).toBe(true)
    expect(typedMatches('Kullanıcı', 'kullanici')).toBe(true)
    expect(typedMatches('KULLANICI', 'kullanici')).toBe(true)
    expect(typedMatches('gorev', 'gorev')).toBe(false)
    expect(typedMatches('', 'gorev')).toBe(false)
    expect(typedMatches('görevler', 'gorev')).toBe(false)
    expect(typedMatches('work-items', 'gorev')).toBe(false)
  })
})

describe('döngü durma kuralı', () => {
  it('remaining > 0 ve en az bir başarı → devam; başarısız çağrıdan sonra ya da remaining 0 → dur', () => {
    expect(shouldContinue({ succeeded: ['a'], failed: [], remaining: 10 })).toBe(true)
    expect(shouldContinue({ succeeded: [], failed: [{ id: 'a', code: 'x' }], remaining: 10 })).toBe(
      false,
    )
    expect(shouldContinue({ succeeded: ['a'], failed: [], remaining: 0 })).toBe(false)
    expect(shouldContinue({ succeeded: ['a'], failed: [] })).toBe(false)
  })
})

describe('sonuç özeti', () => {
  it('tümü silindi: tek cümle', () => {
    const run = { succeeded: Array.from({ length: 120 }, (_, i) => `k${i}`), failed: [] }
    expect(summarizePurgeAll(run, 0, 'done')).toEqual({
      message: 'Çöp boşaltıldı: 120 kayıt kalıcı olarak silindi.',
      tone: 'success',
      failures: [],
    })
  })

  it('kalan başarısızlar koda göre gruplanır ("3 kayıt" + gerekçe)', () => {
    const run = {
      succeeded: ['a'],
      failed: [
        { id: 'b', code: 'identity.account_referenced' },
        { id: 'c', code: 'identity.account_referenced' },
        { id: 'd', code: 'organization.not_authorized' },
      ],
    }
    const summary = summarizePurgeAll(run, 3, 'done')
    expect(summary.message).toBe('1 kayıt silindi, 3 kayıt silinemedi.')
    expect(summary.tone).toBe('danger')
    expect(summary.failures).toEqual([
      {
        id: 'identity.account_referenced',
        title: '2 kayıt',
        reason: 'Kalıcı silinemedi: kayıt başka kayıtlarca kullanılıyor.',
      },
      {
        id: 'organization.not_authorized',
        title: '1 kayıt',
        reason: 'Kendi hesabınız kalıcı silinemez.',
      },
    ])
  })

  it('durduruldu ve yarıda kaldı ayrı cümleler', () => {
    const run = { ...emptyRun(), succeeded: ['a', 'b'] }
    expect(summarizePurgeAll(run, 10, 'cancelled').message).toBe(
      'Durduruldu: 2 kayıt silindi, kalanına dokunulmadı.',
    )
    expect(summarizePurgeAll(run, null, 'interrupted').message).toContain('yarıda kaldı')
  })
})
