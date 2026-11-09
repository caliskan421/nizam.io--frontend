import { describe, expect, it } from 'vitest'

import {
  clearedFilters,
  hasActiveFilters,
  parseTimelineQuery,
  timelineQuery,
  type TimelineUrlState,
} from './url-state'

describe('zaman çizelgesi URL durumu (K10)', () => {
  it('boş sorgu varsayılanlara düşer (hafta ölçeği, tümü, seçim yok)', () => {
    expect(parseTimelineQuery({})).toEqual({
      status: 'tumu',
      department: null,
      scale: 'hafta',
      selected: null,
      subtasks: 'kapali',
    })
  })

  it('geçerli değerler okunur; geçersiz değer varsayılana düşer', () => {
    expect(
      parseTimelineQuery({ durum: 'geciken', departman: 'd1', olcek: 'ay', secili: 'w9' }),
    ).toMatchObject({ status: 'geciken', department: 'd1', scale: 'ay', selected: 'w9' })
    expect(
      parseTimelineQuery({
        durum: 'x',
        departman: 'a b',
        olcek: 'yil',
        secili: '../w',
        altgorev: 'z',
      }),
    ).toEqual(parseTimelineQuery({}))
    expect(parseTimelineQuery({ olcek: ['gun', 'ay'] }).scale).toBe('gun')
  })

  it('varsayılanlar URL’ye yazılmaz; gidiş-dönüş kararlı', () => {
    const state: TimelineUrlState = {
      status: 'biten',
      department: 'd2',
      scale: 'gun',
      selected: 'w1',
      subtasks: 'kapali',
    }
    expect(timelineQuery(state)).toEqual({
      durum: 'biten',
      departman: 'd2',
      olcek: 'gun',
      secili: 'w1',
    })
    expect(parseTimelineQuery(timelineQuery(state))).toEqual(state)
    expect(timelineQuery(parseTimelineQuery({}))).toEqual({})
  })

  it('etkin süzgeç ve temizleme (seçim korunur)', () => {
    const state = parseTimelineQuery({ durum: 'acik', departman: 'd1', secili: 'w1' })
    expect(hasActiveFilters(state)).toBe(true)
    expect(hasActiveFilters(parseTimelineQuery({ olcek: 'ay' }))).toBe(false)
    expect(clearedFilters(state)).toEqual({ status: 'tumu', department: null, selected: 'w1' })
  })
})
