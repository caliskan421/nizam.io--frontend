import { describe, expect, it } from 'vitest'

import {
  DEFAULT_FOLDER_SORT,
  formatFolderSort,
  FOLDER_SORT_OPTIONS,
  parseFolderSort,
  sortKey,
} from './sort-param'

describe('06 sirala parametresi', () => {
  it('geçerli alan:yön okunur; geçersiz/bilinmeyen (sonYukleme dahil) varsayılana düşer', () => {
    expect(parseFolderSort('dosya:azalan')).toEqual({ field: 'dosya', direction: 'azalan' })
    expect(parseFolderSort(['ad:azalan', 'x'])).toEqual({ field: 'ad', direction: 'azalan' })
    for (const bad of ['sonYukleme:azalan', 'ad', 'ad:yukari', '', undefined, 3, null]) {
      expect(parseFolderSort(bad)).toEqual(DEFAULT_FOLDER_SORT)
    }
  })

  it('varsayılan sıra URL’ye yazılmaz; diğerleri gidiş-dönüş', () => {
    expect(formatFolderSort(DEFAULT_FOLDER_SORT)).toBeUndefined()
    for (const o of FOLDER_SORT_OPTIONS) {
      const sort = { field: o.field, direction: o.direction }
      const text = formatFolderSort(sort)
      expect(parseFolderSort(text)).toEqual(sort)
      expect(sortKey(sort)).toBe(o.key)
    }
  })
})
