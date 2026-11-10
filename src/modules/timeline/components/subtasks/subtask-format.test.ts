import { describe, expect, it } from 'vitest'

import { countSubtasks, dayMonth, subtaskDateLabel } from './subtask-format'

describe('alt görev biçimleri', () => {
  it('gün-ay: baştaki sıfır yok, Türkçe kısaltma; biçimsiz değer aynen', () => {
    expect(dayMonth('2026-10-08')).toBe('8 Eki')
    expect(dayMonth('2026-12-25')).toBe('25 Ara')
    expect(dayMonth('bozuk')).toBe('bozuk')
  })

  it('tarih yazısı: iki uç varsa "1 Eki – 8 Eki", biri eksikse null ("Tarih yok")', () => {
    expect(subtaskDateLabel({ start_on: '2026-10-01', end_on: '2026-10-08' })).toBe('1 Eki – 8 Eki')
    expect(subtaskDateLabel({})).toBeNull()
    expect(subtaskDateLabel({ start_on: '2026-10-01' })).toBeNull()
  })

  it('sayaç: biten/toplam', () => {
    expect(countSubtasks([{ done: true }, { done: false }, { done: false }])).toEqual({
      done: 1,
      total: 3,
    })
    expect(countSubtasks([])).toEqual({ done: 0, total: 0 })
  })
})
