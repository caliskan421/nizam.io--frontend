import { describe, expect, it } from 'vitest'

import {
  clearedFilters,
  DEFAULT_TASKS_STATE,
  hasActiveFilters,
  nextSort,
  parseTasksQuery,
  tasksQuery,
} from './url-state'

describe('görev listesi URL durumu (K10)', () => {
  it('boş sorgu → varsayılanlar (Tümü, süzgeç yok, sunucu sırası, panel kapalı)', () => {
    expect(parseTasksQuery({})).toEqual(DEFAULT_TASKS_STATE)
    expect(tasksQuery(DEFAULT_TASKS_STATE)).toEqual({})
  })

  it('geçerli değerler okunur; gidiş-dönüş aynı', () => {
    const query = {
      durum: 'geciken',
      talep: '1',
      q: 'İstanbul rapor',
      koordinatorluk: 'd-2',
      sirala: 'bitis:azalan',
      gorev: 'w_9',
    }
    const state = parseTasksQuery(query)
    expect(state).toEqual({
      tab: 'geciken',
      requests: true,
      search: 'İstanbul rapor',
      department: 'd-2',
      sort: { field: 'bitis', direction: 'azalan' },
      open: 'w_9',
    })
    expect(tasksQuery(state)).toEqual(query)
  })

  it('iade_edildi kendi sekmesi (P5)', () => {
    expect(parseTasksQuery({ durum: 'iade_edildi' }).tab).toBe('iade_edildi')
  })

  it('geçersiz değer sessizce düşer; kisi ve imleç taşınmaz', () => {
    expect(
      parseTasksQuery({
        durum: 'yok',
        talep: 'true',
        q: '   ',
        koordinatorluk: 'a/b',
        sirala: 'kisi:artan',
        gorev: [null, 'w1'],
        kisi: 'acc-1',
        cursor: 'c1',
      }),
    ).toEqual({ ...DEFAULT_TASKS_STATE, open: 'w1' })
    expect(parseTasksQuery({ sirala: 'gorev:yukari' }).sort).toBeNull()
    expect(parseTasksQuery({ q: 'x'.repeat(300) }).search).toHaveLength(200)
  })

  it('sıralama döngüsü: artan → azalan → varsayılan; başka sütun artandan başlar', () => {
    const asc = nextSort(null, 'gorev')
    expect(asc).toEqual({ field: 'gorev', direction: 'artan' })
    const desc = nextSort(asc, 'gorev')
    expect(desc).toEqual({ field: 'gorev', direction: 'azalan' })
    expect(nextSort(desc, 'gorev')).toBeNull()
    expect(nextSort(desc, 'bitis')).toEqual({ field: 'bitis', direction: 'artan' })
  })

  it('süzgeç temizleme sekme/talep/arama/koordinatörlüğü sıfırlar, sıralama ve panel kalır', () => {
    const state = parseTasksQuery({
      durum: 'tamamlandi',
      talep: '1',
      q: 'a',
      koordinatorluk: 'd1',
      sirala: 'durum:artan',
      gorev: 'w1',
    })
    expect(hasActiveFilters(state)).toBe(true)
    const cleared = clearedFilters(state)
    expect(hasActiveFilters(cleared)).toBe(false)
    expect(tasksQuery(cleared)).toEqual({ sirala: 'durum:artan', gorev: 'w1' })
  })
})
