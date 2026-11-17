import { describe, expect, it } from 'vitest'

import {
  ARCHIVE_PAGE_LIMIT,
  ARCHIVE_SORTS,
  filterKey,
  isArchiveSort,
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
      search_scope: 'all',
      work_item_id: 'w1',
      uploader_id: 'a1',
      sort: 'name',
      limit: ARCHIVE_PAGE_LIMIT,
    })
    expect(filterKey({ kind: 'tumu', search: '   ', sort: '' })).toEqual({})
  })

  it('arama doluyken search_scope=all gider (anahtarda ve sorguda); arama yoksa yok', () => {
    expect(toQuery({ search: ' İş ' })).toEqual({
      search: 'İş',
      search_scope: 'all',
      limit: ARCHIVE_PAGE_LIMIT,
    })
    expect(filterKey({ search: 'ı' })).toEqual({ search: 'ı', search_scope: 'all' })
    expect(toQuery({ tag: 'plan' })).not.toHaveProperty('search_scope')
    expect(filterKey({ search: '  ' })).not.toHaveProperty('search_scope')
    expect(filterKey({ search: 'rapor' })).not.toEqual(filterKey({ search: 'rapor', tag: 'plan' }))
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
  it('son yüklemeye göre (BE-025): en yeni önce; yüklemesi olmayan klasör yönden bağımsız sonda', () => {
    const list = [
      { name: 'Boş', last_uploaded_at: null },
      { name: 'Eski', last_uploaded_at: '2026-10-01T09:00:00Z' },
      { name: 'Yeni', last_uploaded_at: '2026-11-10T09:00:00Z' },
      { name: 'Hiç', last_uploaded_at: null },
    ]
    expect(sortFolders(list, 'son', 'azalan').map((f) => f.name)).toEqual([
      'Yeni',
      'Eski',
      'Boş',
      'Hiç',
    ])
    expect(sortFolders(list, 'son', 'artan').map((f) => f.name)).toEqual([
      'Eski',
      'Yeni',
      'Boş',
      'Hiç',
    ])
  })
  it('girdiyi değiştirmez', () => {
    const copy = [...folders]
    sortFolders(folders, 'dosya')
    expect(folders).toEqual(copy)
  })
})
