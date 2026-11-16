import { describe, expect, it } from 'vitest'

import { BATCH_LIMIT, chunk, emptyRun, mergeRun, summarizeBatch } from './batch'
import { batchFailureText } from './outcome'

const rows = [
  { id: 'a', title: 'Alfa' },
  { id: 'b', title: 'Beta' },
  { id: 'c', title: 'Gama' },
]

describe('parçalama (≤100 kimlik / istek)', () => {
  it('100 tavan; 250 kimlik 100 + 100 + 50; sıra korunur; boş küme parça üretmez', () => {
    expect(BATCH_LIMIT).toBe(100)
    const ids = Array.from({ length: 250 }, (_, i) => `k${i}`)
    const parts = chunk(ids)
    expect(parts.map((p) => p.length)).toEqual([100, 100, 50])
    expect(parts.flat()).toEqual(ids)
    expect(chunk([])).toEqual([])
    expect(chunk(['x'])).toEqual([['x']])
  })
})

describe('sonuç birleştirme', () => {
  it('parçaların succeeded/failed listeleri sırayla birleşir', () => {
    let run = emptyRun()
    run = mergeRun(run, { succeeded: ['a'], failed: [{ id: 'b', code: 'work.not_deleted' }] })
    run = mergeRun(run, { succeeded: ['c'], failed: [] })
    expect(run).toEqual({ succeeded: ['a', 'c'], failed: [{ id: 'b', code: 'work.not_deleted' }] })
  })
})

describe('özet', () => {
  it('hepsi başarılı: tek cümle, hata satırı yok', () => {
    const run = { succeeded: ['a', 'b', 'c'], failed: [] }
    expect(summarizeBatch('restore', rows, run, false)).toEqual({
      message: '3 kayıt geri yüklendi.',
      tone: 'success',
      failures: [],
    })
    expect(summarizeBatch('purge', rows, run, false).message).toBe('3 kayıt kalıcı olarak silindi.')
  })

  it('kısmi başarı: başarısız her kayıt adıyla ve gerekçesiyle', () => {
    const run = {
      succeeded: ['a'],
      failed: [
        { id: 'b', code: 'organization.department_in_use' },
        { id: 'zz', code: 'bilinmeyen.kod' },
      ],
    }
    const summary = summarizeBatch('purge', rows, run, false)
    expect(summary.message).toBe('1 kayıt işlendi, 2 kayıt işlenemedi.')
    expect(summary.tone).toBe('danger')
    expect(summary.failures).toEqual([
      {
        id: 'b',
        title: 'Beta',
        reason: 'Kalıcı silinemedi: koordinatörlüğün görevleri veya program katılımı var.',
      },
      // Satır listede yoksa kimlik gösterilir (sahte ad yok); bilinmeyen kod nötr cümle.
      { id: 'zz', title: 'zz', reason: 'Bu kayıt işlenemedi.' },
    ])
  })

  it('hiçbiri işlenmedi ve yarıda kesilen işlem ayrı cümleler', () => {
    const none = summarizeBatch(
      'restore',
      rows,
      { succeeded: [], failed: [{ id: 'a', code: 'work.department_unavailable' }] },
      false,
    )
    expect(none.message).toBe('Hiçbir kayıt işlenemedi (1 kayıt).')
    expect(none.failures[0]!.reason).toContain('Önce Koordinatörlük sekmesinden geri yükleyin')
    const cut = summarizeBatch('restore', rows, { succeeded: ['a'], failed: [] }, true)
    expect(cut.message).toContain('yarıda kaldı')
    expect(cut.message).toContain('1 kayıt işlendi')
  })
})

describe('hata kodu → cümle (tekil yazmayla aynı sözlük + toplu koda özgü)', () => {
  it('kendi hesabı ve çakışma', () => {
    expect(batchFailureText('purge', 'organization.not_authorized')).toBe(
      'Kendi hesabınız kalıcı silinemez.',
    )
    expect(batchFailureText('restore', 'platform.conflict_retry')).toContain('yeniden deneyin')
    expect(batchFailureText('purge', 'identity.account_referenced')).toContain('kullanılıyor')
    expect(batchFailureText('restore', 'identity.not_deleted')).toBe('Kayıt zaten geri yüklenmiş.')
  })
})
