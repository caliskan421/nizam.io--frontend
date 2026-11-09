import { describe, expect, it } from 'vitest'

import { COORDINATORSHIPS_QUERY_KEYS } from '../../routes'
import { coordsQuery, DEFAULT_COORDS_STATE, parseCoordsQuery } from './url-state'

describe('08 URL durumu (E-08-12/13/16)', () => {
  it('boş sorgu varsayılan durum; varsayılanlar yazılmaz', () => {
    expect(parseCoordsQuery({})).toEqual(DEFAULT_COORDS_STATE)
    expect(coordsQuery(DEFAULT_COORDS_STATE)).toEqual({})
  })

  it('q ve sirala gidiş-dönüş; yazılan anahtarlar katalog kümesinde', () => {
    const state = parseCoordsQuery({ q: 'mekanik', sirala: 'ad:azalan', gorunum: 'liste' })
    expect(state).toEqual({ search: 'mekanik', direction: 'azalan' })
    const query = coordsQuery(state)
    expect(query).toEqual({ q: 'mekanik', sirala: 'ad:azalan' })
    for (const key of Object.keys(query)) expect(COORDINATORSHIPS_QUERY_KEYS).toContain(key)
  })

  it('geçersiz değerler sessizce düşer (bilinmeyen alan/yön, boşluk arama, dizi)', () => {
    expect(parseCoordsQuery({ sirala: 'uye:azalan' }).direction).toBe('artan')
    expect(parseCoordsQuery({ sirala: 'ad:yukari' }).direction).toBe('artan')
    expect(parseCoordsQuery({ q: '   ' }).search).toBe('')
    expect(parseCoordsQuery({ q: ['', 'ilk'] }).search).toBe('ilk')
    expect(parseCoordsQuery({ q: 'x'.repeat(500) }).search).toHaveLength(200)
  })
})
