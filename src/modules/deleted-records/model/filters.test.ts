import { describe, expect, it } from 'vitest'

import {
  changeKind,
  clearFilters,
  DEFAULT_SORT,
  filtersToQuery,
  firstOrder,
  isFiltered,
  parseFilters,
  rangeFrom,
  toggleSort,
  toListQuery,
  type DeletedFilters,
} from './filters'

const TZ = 'Europe/Istanbul'
// Istanbul: 12 Kasım 2026 15:00.
const NOW = new Date('2026-11-12T12:00:00Z')
const CTX = { now: NOW, timezone: TZ }

const BASE: DeletedFilters = {
  kind: 'gorev',
  q: '',
  department: null,
  range: 'tumu',
  actor: null,
  selected: null,
}

describe('URL ⇄ süzgeç (K10; P43)', () => {
  it('varsayılan: Görev, tümü, süzgeç yok', () => {
    expect(parseFilters({})).toEqual(BASE)
    expect(filtersToQuery(BASE)).toEqual({})
    expect(isFiltered(BASE)).toBe(false)
  })

  it('gidip gelir', () => {
    const query = {
      tur: 'toplanti',
      q: 'fuar',
      koordinatorluk: 'd1',
      aralik: '7gun',
      silen: 'a7',
      kayit: 'm1',
    }
    const parsed = parseFilters(query)
    expect(parsed).toEqual({
      kind: 'toplanti',
      q: 'fuar',
      department: 'd1',
      range: '7gun',
      actor: 'a7',
      selected: 'm1',
    })
    expect(filtersToQuery(parsed)).toEqual(query)
  })

  it('kayıtsız / devre dışı tür Görev’e düşer; geçersiz aralık tümü', () => {
    expect(parseFilters({ tur: 'altgorev' }).kind).toBe('gorev')
    expect(parseFilters({ tur: 'dosya' }).kind).toBe('gorev')
    expect(parseFilters({ aralik: '30gun' }).range).toBe('tumu')
  })

  it('türe uymayan süzgeç yok sayılır: koordinatörlükte department_id; silen dört türde geçerli (BE-108)', () => {
    // Hesapta tarih aralığı ve "herhangi bir ekip satırı" koordinatörlük süzgeci canlıdır (BE-118).
    expect(
      parseFilters({ tur: 'kullanici', aralik: 'bugun', koordinatorluk: 'd1', silen: 'a1' }),
    ).toMatchObject({ range: 'bugun', department: 'd1', actor: 'a1' })
    expect(parseFilters({ tur: 'koordinatorluk', koordinatorluk: 'd1' }).department).toBeNull()
    for (const tur of ['gorev', 'toplanti', 'koordinatorluk', 'kullanici']) {
      expect(parseFilters({ tur, silen: 'a1' }).actor, tur).toBe('a1')
    }
  })

  it('dizi değeri ilk öğe; aranan metin kırpılır', () => {
    expect(parseFilters({ q: ['  ab ', 'c'] }).q).toBe('ab')
  })
})

describe('tür değişimi (mekanizma §3)', () => {
  const full: DeletedFilters = {
    kind: 'toplanti',
    q: 'x',
    department: 'd1',
    range: 'bugun',
    actor: 'a7',
    selected: 'm1',
  }

  it('kayit ve silen temizlenir; q ve aralik korunur', () => {
    expect(changeKind(full, 'gorev')).toEqual({
      ...full,
      kind: 'gorev',
      selected: null,
      actor: null,
    })
  })

  it('koordinatorluk koordinatörlük türünde temizlenir; hesapta ve aralık korunur', () => {
    expect(changeKind(full, 'koordinatorluk').department).toBeNull()
    expect(changeKind(full, 'kullanici')).toMatchObject({ department: 'd1', range: 'bugun' })
  })

  it('Filtreleri temizle: tür ve seçim korunur', () => {
    expect(clearFilters(full)).toEqual({
      kind: 'toplanti',
      q: '',
      department: null,
      range: 'tumu',
      actor: null,
      selected: 'm1',
    })
    expect(isFiltered(full)).toBe(true)
  })
})

describe('sunucu sorgusu (BE-117)', () => {
  it('varsayılan süzgeç ve sıra parametresiz gider', () => {
    expect(toListQuery(BASE, DEFAULT_SORT, CTX)).toEqual({})
  })

  it('arama, koordinatörlük, silen ve aralık sunucu parametresine eşlenir', () => {
    const filters: DeletedFilters = {
      ...BASE,
      kind: 'toplanti',
      q: 'fuar',
      department: 'd1',
      actor: 'a7',
      range: 'bugun',
    }
    expect(toListQuery(filters, DEFAULT_SORT, CTX)).toEqual({
      q: 'fuar',
      department_id: 'd1',
      deleted_by: 'a7',
      // 12 Kasım 2026 Istanbul günü 00:00 = 11 Kasım 21:00 UTC (UTC gün sınırı DEĞİL).
      deleted_from: '2026-11-11T21:00:00Z',
    })
  })

  it('silen dört türde deleted_by olarak gider (BE-108)', () => {
    for (const kind of ['gorev', 'toplanti', 'koordinatorluk', 'kullanici'] as const) {
      const query = toListQuery({ ...BASE, kind, actor: 'a7' }, DEFAULT_SORT, CTX)
      expect(query.deleted_by, kind).toBe('a7')
    }
  })

  it('koordinatörlük türünde department_id gitmez', () => {
    const filters: DeletedFilters = { ...BASE, kind: 'koordinatorluk', department: 'd1' }
    expect(toListQuery(filters, DEFAULT_SORT, CTX)).toEqual({})
  })

  it('hesap listesi varsayılan sırada da sort=deleted_at&order=desc ister (oluşturma sırası değil)', () => {
    expect(toListQuery({ ...BASE, kind: 'kullanici' }, DEFAULT_SORT, CTX)).toEqual({
      sort: 'deleted_at',
      order: 'desc',
    })
    expect(
      toListQuery({ ...BASE, kind: 'kullanici', range: '7gun' }, DEFAULT_SORT, CTX),
    ).toMatchObject({ deleted_from: '2026-11-05T21:00:00Z', sort: 'deleted_at' })
  })

  it('sıra yalnız varsayılandan farklıysa yazılır', () => {
    expect(toListQuery(BASE, { key: 'deleted_at', order: 'asc' }, CTX)).toEqual({
      sort: 'deleted_at',
      order: 'asc',
    })
    expect(toListQuery(BASE, { key: 'name', order: 'asc' }, CTX)).toEqual({
      sort: 'name',
      order: 'asc',
    })
  })
})

describe('aralık sınırı (kurulum saat dilimi gün başlangıcı)', () => {
  it('Bugün = bugünün başı; Son 7 gün = bugün ve önceki 6 gün; Tümü = sınır yok', () => {
    expect(rangeFrom('bugun', CTX)).toBe('2026-11-11T21:00:00Z')
    expect(rangeFrom('7gun', CTX)).toBe('2026-11-05T21:00:00Z')
    expect(rangeFrom('tumu', CTX)).toBeUndefined()
  })

  it('gece yarısı sonrası (UTC hâlâ önceki gün) kurulum gününe göre hesaplanır', () => {
    // 11 Kasım 22:30 UTC = 12 Kasım 01:30 Istanbul.
    const late = { now: new Date('2026-11-11T22:30:00Z'), timezone: TZ }
    expect(rangeFrom('bugun', late)).toBe('2026-11-11T21:00:00Z')
  })

  it('saat ilerlese de gün içinde aynı sınır (sorgu anahtarı değişmez)', () => {
    const a = rangeFrom('bugun', { now: new Date('2026-11-12T01:00:00Z'), timezone: TZ })
    const b = rangeFrom('bugun', { now: new Date('2026-11-12T20:00:00Z'), timezone: TZ })
    expect(a).toBe(b)
  })

  it('UTC saat diliminde gün sınırı UTC gece yarısıdır', () => {
    expect(rangeFrom('bugun', { now: NOW, timezone: 'UTC' })).toBe('2026-11-12T00:00:00Z')
  })
})

describe('sıralama (E-12-31)', () => {
  it('ilk yön: zaman azalan, ad artan', () => {
    expect(firstOrder('deleted_at')).toBe('desc')
    expect(firstOrder('name')).toBe('asc')
  })

  it('etkin eksen yön çevirir; başka eksen kendi ilk yönüyle açılır', () => {
    expect(toggleSort(DEFAULT_SORT, 'deleted_at')).toEqual({ key: 'deleted_at', order: 'asc' })
    expect(toggleSort({ key: 'deleted_at', order: 'asc' }, 'deleted_at')).toEqual(DEFAULT_SORT)
    expect(toggleSort(DEFAULT_SORT, 'name')).toEqual({ key: 'name', order: 'asc' })
    expect(toggleSort({ key: 'name', order: 'asc' }, 'name')).toEqual({
      key: 'name',
      order: 'desc',
    })
  })
})
