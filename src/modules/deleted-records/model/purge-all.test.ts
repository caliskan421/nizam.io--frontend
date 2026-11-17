import { describe, expect, it } from 'vitest'

import { emptyRun } from './batch'
import {
  PURGE_ALL_CHUNK,
  PURGE_ALL_CONFIRM,
  purgeKindsOf,
  shouldContinue,
  summarizePurgeAll,
  supportsPurgeAll,
  typedMatches,
} from './purge-all'

describe('onay değeri eşlemesi (ADR-0045: confirm = tür yol adı)', () => {
  it('dokuz türün yol adı onay değeridir; görünüm politikası: Tümü hariç hepsi boşaltılır', () => {
    expect(PURGE_ALL_CONFIRM).toEqual({
      tasks: 'work-items',
      subtasks: 'subtasks',
      files: 'files',
      meetings: 'meetings',
      task_notes: 'task-notes',
      meeting_notes: 'meeting-notes',
      agenda_items: 'agenda-items',
      departments: 'departments',
      accounts: 'accounts',
    })
    expect(PURGE_ALL_CHUNK).toBe(50)
    for (const view of [
      'gorev',
      'altgorev',
      'dosya',
      'toplanti',
      'koordinatorluk',
      'kullanici',
      'notgundem',
    ] as const) {
      expect(supportsPurgeAll(view), view).toBe(true)
    }
    // Tümü: bir tür seçilir (tüm şirket çöpünü tek tıkla boşaltma vaadi yok).
    expect(supportsPurgeAll('tumu')).toBe(false)
    expect(purgeKindsOf('tumu')).toBeNull()
  })

  it('Not ve gündem üç türü sırayla boşaltır; tek türlü görünüm yalnız kendi türünü', () => {
    expect(purgeKindsOf('notgundem')).toEqual(['task_notes', 'meeting_notes', 'agenda_items'])
    expect(purgeKindsOf('dosya')).toEqual(['files'])
    expect(purgeKindsOf('koordinatorluk')).toEqual(['departments'])
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
    expect(typedMatches('not ve gündem', 'notgundem')).toBe(true)
    expect(typedMatches('alt görev', 'altgorev')).toBe(true)
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
