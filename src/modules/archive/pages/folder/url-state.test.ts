import { describe, expect, it } from 'vitest'

import { ARCHIVE_FOLDER_QUERY_KEYS } from '../../routes'
import { folderQuery, parseFolderQuery } from './url-state'

describe('07 URL durumu (K10)', () => {
  it('boş sorgu varsayılanlar: görev yok, etiket yok, ızgara, dosya yok, boş arama', () => {
    expect(parseFolderQuery({})).toEqual({
      task: null,
      tag: null,
      view: 'izgara',
      file: null,
      q: '',
    })
  })

  it('geçerli değerler okunur; çoklu değerde ilk dolu alınır', () => {
    expect(
      parseFolderQuery({
        gorev: 'w-1',
        etiket: 'plan',
        gorunum: 'liste',
        dosya: 'f_9',
        q: ['', 'rapor'],
      }),
    ).toEqual({ task: 'w-1', tag: 'plan', view: 'liste', file: 'f_9', q: 'rapor' })
  })

  it('geçersiz değer sessizce düşer (etiket kümesi dışı, biçimsiz kimlik, bilinmeyen görünüm)', () => {
    expect(
      parseFolderQuery({ gorev: '../x', etiket: 'saha', gorunum: 'kart', dosya: 'a b' }),
    ).toEqual({ task: null, tag: null, view: 'izgara', file: null, q: '' })
  })

  it('arama 200 karakterle sınırlı', () => {
    expect(parseFolderQuery({ q: 'a'.repeat(300) }).q).toHaveLength(200)
  })

  it('folderQuery varsayılanları yazmaz ve yalnız katalog anahtarlarını üretir', () => {
    expect(folderQuery({ task: null, tag: null, view: 'izgara', file: null, q: ' ' })).toEqual({})
    const all = folderQuery({ task: 'w', tag: 'girdi', view: 'liste', file: 'f', q: ' ad ' })
    expect(all).toEqual({ gorev: 'w', etiket: 'girdi', gorunum: 'liste', dosya: 'f', q: 'ad' })
    expect(Object.keys(all).sort()).toEqual([...ARCHIVE_FOLDER_QUERY_KEYS].sort())
  })

  it('gidiş-dönüş', () => {
    const state = { task: 'w1', tag: 'cikti', view: 'liste', file: 'f2', q: 'x' } as const
    expect(parseFolderQuery(folderQuery(state))).toEqual(state)
  })
})
