import { describe, expect, it } from 'vitest'

import {
  DEFAULT_KIND,
  DELETED_KINDS,
  DELETED_RANGES,
  isUnifiedView,
  singleKindOf,
  SUMMARY_FIELD,
  VIEW_KINDS,
  isDeletedKind,
  isDeletedRange,
  parseKind,
  supportsDepartmentFilter,
} from './kinds'

describe('silinen kayıt türleri (P41, P42)', () => {
  it('sekiz görünüm tasarım sırasında, varsayılan Görev; eski URL değerleri geçerli', () => {
    expect(DELETED_KINDS).toEqual([
      'tumu',
      'gorev',
      'altgorev',
      'dosya',
      'toplanti',
      'koordinatorluk',
      'kullanici',
      'notgundem',
    ])
    expect(DEFAULT_KIND).toBe('gorev')
    for (const old of ['gorev', 'toplanti', 'koordinatorluk', 'kullanici']) {
      expect(isDeletedKind(old)).toBe(true)
      expect(parseKind(old)).toBe(old)
    }
  })

  it('bilinmeyen ya da eksik değer Görev görünümüne düşer', () => {
    expect(parseKind('tasks')).toBe('gorev')
    expect(parseKind('bilinmeyen')).toBe('gorev')
    expect(parseKind(undefined)).toBe('gorev')
    expect(parseKind('notgundem')).toBe('notgundem')
  })

  it('Tümü ve Not ve gündem birleşik görünümdür ve yazma hedefi olamaz; tekler tek türdür', () => {
    expect(DELETED_KINDS.filter(isUnifiedView)).toEqual(['tumu', 'notgundem'])
    expect(singleKindOf('tumu')).toBeNull()
    expect(singleKindOf('notgundem')).toBeNull()
    expect(singleKindOf('dosya')).toBe('files')
    expect(singleKindOf('kullanici')).toBe('accounts')
    expect(VIEW_KINDS.notgundem).toEqual(['task_notes', 'meeting_notes', 'agenda_items'])
    expect(VIEW_KINDS.tumu).toHaveLength(9)
  })

  it('sayaç alanı: Tümü toplam, Not ve gündem notes (ikisi birbirine eklenmez)', () => {
    expect(SUMMARY_FIELD.tumu).toBe('total')
    expect(SUMMARY_FIELD.notgundem).toBe('notes')
    expect(SUMMARY_FIELD.altgorev).toBe('subtasks')
    expect(SUMMARY_FIELD.dosya).toBe('files')
  })

  it('aralık değerleri', () => {
    expect(DELETED_RANGES).toEqual(['bugun', '7gun', 'tumu'])
    expect(isDeletedRange('7gun')).toBe(true)
    expect(isDeletedRange('30gun')).toBe(false)
  })

  it('koordinatörlük süzgeci desteği türe göre (E-12-19)', () => {
    // Koordinatörlük türünde sunucu department_id'yi yok sayar; hesapta "herhangi bir ekip satırı".
    expect(DELETED_KINDS.filter(supportsDepartmentFilter)).toEqual([
      'tumu',
      'gorev',
      'altgorev',
      'dosya',
      'toplanti',
      'kullanici',
      'notgundem',
    ])
  })
})
