import { describe, expect, it } from 'vitest'

import { stat, view } from '../../components/coordinatorships/__tests__/fixtures'
import { foldTr, matchesSearch, visibleCoordinatorships } from './filtering'

const VIEWS = [
  view('d1', 'İdari işler', 'IDA', stat('d1', { coordinators: [] })),
  view(
    'd2',
    'Çevre',
    null,
    stat('d2', { coordinators: [{ account_id: 'a', full_name: 'Işıl Öz' }] }),
  ),
  view('d3', 'Bilişim', 'BIL'),
  view('d4', 'ulaşım', 'ULA', null),
]

describe('arama (E-08-13)', () => {
  it('İ/ı katlama tr yerel ayarıyla', () => {
    expect(foldTr('İDARİ')).toBe('idari')
    expect(foldTr('IŞIL')).toBe('ışıl')
    expect(matchesSearch(VIEWS[0]!, 'idari')).toBe(true)
    expect(matchesSearch(VIEWS[0]!, 'İDARİ')).toBe(true)
    expect(matchesSearch(VIEWS[1]!, 'IŞIL')).toBe(true)
    expect(matchesSearch(VIEWS[1]!, 'isil')).toBe(false)
  })

  it('ad, kod ve koordinatör adı alanlarında; rapor satırı yoksa yalnız ad/kod', () => {
    expect(visibleCoordinatorships(VIEWS, 'bil', 'artan').map((v) => v.departmentId)).toEqual([
      'd3',
    ])
    expect(visibleCoordinatorships(VIEWS, 'öz', 'artan').map((v) => v.departmentId)).toEqual(['d2'])
    expect(visibleCoordinatorships(VIEWS, 'ula', 'artan').map((v) => v.departmentId)).toEqual([
      'd4',
    ])
    expect(visibleCoordinatorships(VIEWS, '  ', 'artan')).toHaveLength(4)
  })
})

describe('sıralama (E-08-16)', () => {
  it('Türkçe alfabe sırası, yön; girdi değişmez', () => {
    const before = VIEWS.map((v) => v.departmentId)
    expect(visibleCoordinatorships(VIEWS, '', 'artan').map((v) => v.displayName)).toEqual([
      'Bilişim',
      'Çevre',
      'İdari işler',
      'ulaşım',
    ])
    expect(visibleCoordinatorships(VIEWS, '', 'azalan').map((v) => v.displayName)).toEqual([
      'ulaşım',
      'İdari işler',
      'Çevre',
      'Bilişim',
    ])
    expect(VIEWS.map((v) => v.departmentId)).toEqual(before)
  })
})
