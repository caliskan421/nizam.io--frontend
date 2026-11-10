import { describe, expect, it } from 'vitest'

import {
  addDays,
  barHeights,
  bucketDays,
  dayAt,
  dayFraction,
  rangeText,
  shortDay,
  spanDays,
  viewWindow,
} from './strip-model'

const range = { start: '2026-06-01', end: '2026-06-30' }

describe('şerit hesapları (E-03C-14…18)', () => {
  it('gün ve aralık metni; bozuk gün olduğu gibi', () => {
    expect(shortDay('2026-06-16')).toBe('16 Haz')
    expect(rangeText({ start: '2026-06-16', end: '2026-09-30' })).toBe('16 Haz – 30 Eyl')
    expect(shortDay('bozuk')).toBe('bozuk')
  })

  it('gün ekleme ay/yıl sınırını aşar; bozuk gün null', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('x', 1)).toBeNull()
  })

  it('aralık gün sayısı uçlar dahil; ters aralık null', () => {
    expect(spanDays(range)).toBe(30)
    expect(spanDays({ start: '2026-06-30', end: '2026-06-01' })).toBeNull()
  })

  it('gün konumu 0–1; dışarıdaki gün null (işaret çizilmez)', () => {
    expect(dayFraction(range, '2026-06-01')).toBe(0)
    expect(dayFraction(range, '2026-06-16')).toBe(0.5)
    expect(dayFraction(range, '2026-05-31')).toBeNull()
    expect(dayFraction(range, '2026-07-01')).toBeNull()
  })

  it('görünen aralık penceresi aralığa kırpılır', () => {
    expect(viewWindow(range, { start: '2026-06-01', end: '2026-06-15' })).toEqual({
      left: 0,
      width: 50,
    })
    expect(viewWindow(range, { start: '2026-05-20', end: '2026-06-15' })).toEqual({
      left: 0,
      width: 50,
    })
    expect(viewWindow(range, { start: '2026-07-02', end: '2026-07-09' })).toBeNull()
  })

  it('şerit konumundan gün; uçlar kırpılır', () => {
    expect(dayAt(range, 0)).toBe('2026-06-01')
    expect(dayAt(range, 0.5)).toBe('2026-06-16')
    expect(dayAt(range, 1)).toBe('2026-06-30')
    expect(dayAt(range, -3)).toBe('2026-06-01')
  })

  it('kova günleri: son kova kısmi; çubuk yüksekliği orantılı, boş hafta iz', () => {
    expect([0, 1, 2, 3, 4].map((i) => bucketDays(range, i))).toEqual([7, 7, 7, 7, 2])
    expect(barHeights([0, 2, 4])).toEqual([6, 62, 100])
    expect(barHeights([0, 0])).toEqual([6, 6])
  })
})
