import { describe, expect, it } from 'vitest'

import { departmentFromParams, queryWithTab, tabFromQuery } from './url-state'

describe('08b URL durumu (E-08-57)', () => {
  it('sekme katalog kümesinden; bilinmeyen / faz dışı / boş → genel', () => {
    expect(tabFromQuery({ sekme: 'uyeler' })).toBe('uyeler')
    expect(tabFromQuery({ sekme: ['ayarlar', 'genel'] })).toBe('ayarlar')
    expect(tabFromQuery({ sekme: 'arsiv' })).toBe('genel')
    expect(tabFromQuery({ sekme: 'toplantilar' })).toBe('genel')
    expect(tabFromQuery({})).toBe('genel')
  })

  it('varsayılan sekme URL’ye yazılmaz; diğer anahtarlar korunur', () => {
    expect(queryWithTab({ x: '1' }, 'gorevler')).toEqual({ x: '1', sekme: 'gorevler' })
    expect(queryWithTab({ x: '1', sekme: 'uyeler' }, 'genel')).toEqual({ x: '1' })
  })

  it('departman yol parametresi', () => {
    expect(departmentFromParams({ departmentId: 'd1' })).toBe('d1')
    expect(departmentFromParams({})).toBe('')
  })
})
