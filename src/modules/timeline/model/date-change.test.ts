import { describe, expect, it } from 'vitest'

import { addDays, applyEdge, dayAndMonth, rangeDelta, sameRange, shiftEdge } from './date-change'

const R = { start: '2026-06-22', end: '2026-09-10' }

describe('addDays', () => {
  it('ay ve yıl sınırını aşar; negatif geri gider', () => {
    expect(addDays('2026-09-10', 21)).toBe('2026-10-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
  it('bozuk tarih ya da kesirli gün null', () => {
    expect(addDays('2026-02-30', 1)).toBeNull()
    expect(addDays('', 1)).toBeNull()
    expect(addDays('2026-01-01', 0.5)).toBeNull()
  })
})

describe('applyEdge — başlangıç bitişi, bitiş başlangıcı aşamaz', () => {
  it('bitişi ileri/geri taşır', () => {
    expect(applyEdge(R, 'end', '2026-10-01')).toEqual({ start: R.start, end: '2026-10-01' })
    expect(applyEdge(R, 'end', '2026-08-01')).toEqual({ start: R.start, end: '2026-08-01' })
  })
  it('bitiş başlangıçtan önceye gidemez → başlangıca yapışır', () => {
    expect(applyEdge(R, 'end', '2026-01-01')).toEqual({ start: R.start, end: R.start })
  })
  it('başlangıç bitişten sonraya gidemez → bitişe yapışır', () => {
    expect(applyEdge(R, 'start', '2027-01-01')).toEqual({ start: R.end, end: R.end })
    expect(applyEdge(R, 'start', '2026-06-01')).toEqual({ start: '2026-06-01', end: R.end })
  })
  it('bozuk girdi null', () => {
    expect(applyEdge(R, 'end', 'x')).toBeNull()
    expect(applyEdge({ start: 'x', end: R.end }, 'end', R.end)).toBeNull()
  })
})

describe('shiftEdge / rangeDelta / sameRange', () => {
  it('klavye adımı bir gün; sınırda durur', () => {
    expect(shiftEdge(R, 'end', 1)).toEqual({ start: R.start, end: '2026-09-11' })
    expect(shiftEdge(R, 'start', -1)).toEqual({ start: '2026-06-21', end: R.end })
    const one = { start: '2026-06-22', end: '2026-06-22' }
    expect(shiftEdge(one, 'end', -1)).toEqual(one)
    expect(shiftEdge(one, 'start', 1)).toEqual(one)
  })
  it('fark ve eşitlik', () => {
    const after = { start: R.start, end: '2026-10-01' }
    expect(rangeDelta(R, after)).toEqual({ start: 0, end: 21 })
    expect(rangeDelta(R, { start: '2026-06-20', end: R.end })).toEqual({ start: -2, end: 0 })
    expect(rangeDelta(R, { start: 'x', end: R.end })).toBeNull()
    expect(sameRange(R, { ...R })).toBe(true)
    expect(sameRange(R, after)).toBe(false)
  })
  it('gün/ay ayrıştırma', () => {
    expect(dayAndMonth('2026-06-22')).toEqual([22, 6])
    expect(dayAndMonth('2026-13-01')).toBeNull()
  })
})
