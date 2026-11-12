import { describe, expect, it } from 'vitest'

import {
  DEFAULT_KIND,
  DELETED_KINDS,
  DELETED_RANGES,
  DISABLED_KINDS,
  isDeletedKind,
  isDeletedRange,
  parseKind,
  supportsActorFilter,
  supportsDepartmentFilter,
  supportsRange,
} from './kinds'

describe('silinen kayıt türleri (P41, P42)', () => {
  it('dört canlı tür, varsayılan Görev; "Tümü" yok', () => {
    expect(DELETED_KINDS).toEqual(['gorev', 'toplanti', 'koordinatorluk', 'kullanici'])
    expect(DEFAULT_KIND).toBe('gorev')
    expect(isDeletedKind('tumu')).toBe(false)
  })

  it('devre dışı türler URL değeri olarak tanınmaz (→ Görev)', () => {
    for (const kind of DISABLED_KINDS) {
      expect(isDeletedKind(kind)).toBe(false)
      expect(parseKind(kind)).toBe('gorev')
    }
    expect(parseKind(undefined)).toBe('gorev')
    expect(parseKind('kullanici')).toBe('kullanici')
  })

  it('aralık değerleri', () => {
    expect(DELETED_RANGES).toEqual(['bugun', '7gun', 'tumu'])
    expect(isDeletedRange('7gun')).toBe(true)
    expect(isDeletedRange('30gun')).toBe(false)
  })

  it('süzgeç desteği türe göre (E-12-17/18/19)', () => {
    expect(DELETED_KINDS.filter(supportsActorFilter)).toEqual(['toplanti'])
    expect(DELETED_KINDS.filter(supportsDepartmentFilter)).toEqual(['gorev', 'toplanti'])
    expect(DELETED_KINDS.filter((kind) => !supportsRange(kind))).toEqual(['kullanici'])
  })
})
