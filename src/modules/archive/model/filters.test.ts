import { describe, expect, it } from 'vitest'

import {
  ARCHIVE_PAGE_LIMIT,
  ARCHIVE_SORTS,
  countLabel,
  filterKey,
  isArchiveSort,
  knownTotal,
  sortFolders,
  toQuery,
} from './filters'

describe('süzgeç → sunucu sorgusu', () => {
  it('boş süzgeç yalnız sayfa boyu taşır; imleç yalnız verilince', () => {
    expect(toQuery({})).toEqual({ limit: ARCHIVE_PAGE_LIMIT })
    expect(toQuery({}, 'c1')).toEqual({ limit: ARCHIVE_PAGE_LIMIT, cursor: 'c1' })
  })

  it('UI adları sunucu adlarına eşlenir; Tümü ve boş değerler düşer', () => {
    expect(
      toQuery({
        tag: 'plan',
        kind: 'belge',
        search: '  rapor ',
        workItemId: 'w1',
        uploaderId: 'a1',
        sort: 'name',
      }),
    ).toEqual({
      tag: 'plan',
      mime_category: 'belge',
      search: 'rapor',
      work_item_id: 'w1',
      uploader_id: 'a1',
      sort: 'name',
      limit: ARCHIVE_PAGE_LIMIT,
    })
    expect(filterKey({ kind: 'tumu', search: '   ', sort: '' })).toEqual({})
  })

  it('bilinmeyen etiket ve sort gönderilmez (sunucu 422 / varsayılan)', () => {
    expect(filterKey({ tag: 'saha' as never, sort: 'created_at' as never, kind: 'belge' })).toEqual(
      { mime_category: 'belge' },
    )
    expect(ARCHIVE_SORTS).toEqual(['', 'name', 'size'])
    expect(isArchiveSort('size')).toBe(true)
    expect(isArchiveSort('created_at')).toBe(false)
  })

  it('süzgeç anahtarı imleci taşımaz: süzgeç değişince anahtar değişir (imleç sıfırlanır)', () => {
    expect(filterKey({ tag: 'plan' })).not.toEqual(filterKey({ tag: 'girdi' }))
    expect(filterKey({ tag: 'plan' })).toEqual(filterKey({ tag: 'plan' }))
  })
})

describe('sayaç ("n+") ve kesin toplam', () => {
  it('kesin toplam yalnız süzgeçsiz ya da yalnız görev süzgecinde', () => {
    expect(knownTotal({}, { folder: 9, task: 4 })).toBe(9)
    expect(knownTotal({ sort: 'size' }, { folder: 9 })).toBe(9)
    expect(knownTotal({ workItemId: 'w1' }, { folder: 9, task: 4 })).toBe(4)
    expect(knownTotal({ workItemId: 'w1', tag: 'plan' }, { folder: 9, task: 4 })).toBeNull()
    expect(knownTotal({ search: 'x' }, { folder: 9 })).toBeNull()
    expect(knownTotal({}, {})).toBeNull()
  })

  it('toplam yoksa yüklenen sayı + devam varsa yaklaşık', () => {
    expect(countLabel(50, true, null)).toEqual({ value: 50, approximate: true })
    expect(countLabel(7, false, null)).toEqual({ value: 7, approximate: false })
    expect(countLabel(7, true, 30)).toEqual({ value: 30, approximate: false })
  })
})

describe('klasör sırası (istemci)', () => {
  const folders = [
    { name: 'Çevre', file_count: 2 },
    { name: 'Ağ', file_count: 9 },
    { name: 'Zemin', file_count: 2 },
  ]
  it('ada göre (tr-TR) ve yön', () => {
    expect(sortFolders(folders, 'ad').map((f) => f.name)).toEqual(['Ağ', 'Çevre', 'Zemin'])
    expect(sortFolders(folders, 'ad', 'azalan').map((f) => f.name)).toEqual([
      'Zemin',
      'Çevre',
      'Ağ',
    ])
  })
  it('dosya sayısına göre; eşitlikte ad', () => {
    expect(sortFolders(folders, 'dosya', 'azalan').map((f) => f.name)).toEqual([
      'Ağ',
      'Çevre',
      'Zemin',
    ])
  })
  it('girdiyi değiştirmez', () => {
    const copy = [...folders]
    sortFolders(folders, 'dosya')
    expect(folders).toEqual(copy)
  })
})
