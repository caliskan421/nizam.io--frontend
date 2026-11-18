// RECORDS-K51: sahte arşiv sunucusunun depolama dağılımı sözleşme değişmezlerini taşır
// (toplam eşitliği, sıfır kova yok, bayta göre azalan, eşitlikte sözleşme sırası, boş küme `[]`).
import { describe, expect, it } from 'vitest'

import { breakdown, file } from './archive-fake'

describe('arşiv sahte sunucusu: totals.by_type / by_tag (RECORDS-K51)', () => {
  const files = [
    file('a', 'w1', 'd1', 'u', { content_type: 'application/pdf', size_bytes: 100, tag: 'sonuc' }),
    file('b', 'w1', 'd1', 'u', { content_type: 'application/pdf', size_bytes: 200, tag: 'sonuc' }),
    file('c', 'w2', 'd1', 'u', { content_type: 'image/png', size_bytes: 100, tag: 'plan' }),
    file('d', 'w2', 'd1', 'u', { content_type: 'text/csv', size_bytes: 0, tag: 'plan' }),
    file('e', 'w3', 'd1', 'u', { content_type: 'application/zip', size_bytes: 100, tag: 'ister' }),
  ]

  it('MIME resmi tür kümesine iner (csv tablo, küme dışı other); kovalar bayta göre azalan', () => {
    expect(breakdown(files).by_type).toEqual([
      { type: 'pdf', file_count: 2, total_bytes: 300 },
      { type: 'image', file_count: 1, total_bytes: 100 },
      { type: 'other', file_count: 1, total_bytes: 100 },
      { type: 'spreadsheet', file_count: 1, total_bytes: 0 },
    ])
    expect(breakdown(files).by_tag).toEqual([
      { tag: 'sonuc', file_count: 2, total_bytes: 300 },
      { tag: 'ister', file_count: 1, total_bytes: 100 },
      { tag: 'plan', file_count: 2, total_bytes: 100 },
    ])
  })

  it('her dağılımın toplamı dosya sayısı ve bayt toplamına eşit; sıfır baytlı dosyalı kova yazılır', () => {
    const count = files.length
    const bytes = files.reduce((sum, x) => sum + x.size_bytes, 0)
    for (const list of [breakdown(files).by_type, breakdown(files).by_tag]) {
      expect(list.reduce((sum, b) => sum + b.file_count, 0)).toBe(count)
      expect(list.reduce((sum, b) => sum + b.total_bytes, 0)).toBe(bytes)
      expect(list.every((b) => b.file_count > 0)).toBe(true)
    }
  })

  it('dosyasız küme: ikisi de boş dizi', () => {
    expect(breakdown([])).toEqual({ by_type: [], by_tag: [] })
  })
})
