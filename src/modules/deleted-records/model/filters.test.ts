import { describe, expect, it } from 'vitest'

import {
  actorCandidates,
  actorValue,
  applyFilters,
  changeKind,
  clearFilters,
  countLabel,
  departmentCandidates,
  filtersToQuery,
  isFiltered,
  parseFilters,
  rangeFloor,
  rangeNeedsMore,
  UNKNOWN_ACTOR,
  type DeletedFilters,
} from './filters'
import type { DeletedRow } from './types'

const TZ = 'Europe/Istanbul'
// Istanbul: 12 Kasım 2026 15:00.
const NOW = new Date('2026-11-12T12:00:00Z')
const CTX = { now: NOW, timezone: TZ }

function row(over: Partial<DeletedRow> & { id: string }): DeletedRow {
  return {
    kind: 'gorev',
    key: `gorev:${over.id}`,
    title: over.id,
    code: null,
    subLine: '',
    deletedAt: '2026-11-12T08:00:00Z',
    actor: null,
    departmentIds: [],
    searchText: over.id.toLocaleLowerCase('tr-TR'),
    status: null,
    fileCount: null,
    place: null,
    inviteMode: null,
    departmentNames: [],
    departmentKind: null,
    ...over,
  }
}

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

  it('türe uymayan süzgeç yok sayılır: hesapta aralık/koordinatörlük/silen, görevde silen', () => {
    expect(
      parseFilters({ tur: 'kullanici', aralik: 'bugun', koordinatorluk: 'd1', silen: 'a1' }),
    ).toMatchObject({ range: 'tumu', department: null, actor: null })
    expect(parseFilters({ tur: 'koordinatorluk', koordinatorluk: 'd1' }).department).toBeNull()
    expect(parseFilters({ silen: 'a1' }).actor).toBeNull()
    expect(parseFilters({ tur: 'toplanti', silen: 'a1' }).actor).toBe('a1')
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

  it('koordinatorluk yalnız görev/toplantıda korunur', () => {
    expect(changeKind(full, 'koordinatorluk').department).toBeNull()
    expect(changeKind(full, 'kullanici')).toMatchObject({ department: null, range: 'tumu' })
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

describe('istemci süzgeci (yüklenen küme)', () => {
  const rows = [
    row({ id: 'Işık hattı', searchText: 'ışık hattı', departmentIds: ['d1'] }),
    row({
      id: 'İzmir',
      searchText: 'izmir',
      departmentIds: ['d2'],
      deletedAt: '2026-11-09T08:00:00Z',
    }),
    row({
      id: 'Eski',
      searchText: 'eski',
      departmentIds: ['d1', 'd2'],
      deletedAt: '2026-10-01T08:00:00Z',
    }),
    row({ id: 'Tarihsiz', searchText: 'tarihsiz', deletedAt: null }),
  ]

  it('arama Türkçe katlamalı', () => {
    const ids = (q: string) => applyFilters(rows, { ...BASE, q }, CTX).map((r) => r.id)
    expect(ids('IŞIK')).toEqual(['Işık hattı'])
    expect(ids('izm')).toEqual(['İzmir'])
    expect(ids('ISIK')).toEqual([])
  })

  it('koordinatörlük süzgeci departman kimliği eşitliği', () => {
    expect(applyFilters(rows, { ...BASE, department: 'd2' }, CTX).map((r) => r.id)).toEqual([
      'İzmir',
      'Eski',
    ])
  })

  it('aralık: Bugün / Son 7 gün (kurulum saat dilimi takvim günü); tarihsiz satır düşer', () => {
    expect(applyFilters(rows, { ...BASE, range: 'bugun' }, CTX).map((r) => r.id)).toEqual([
      'Işık hattı',
    ])
    expect(applyFilters(rows, { ...BASE, range: '7gun' }, CTX).map((r) => r.id)).toEqual([
      'Işık hattı',
      'İzmir',
    ])
    expect(applyFilters(rows, BASE, CTX)).toHaveLength(4)
  })

  it('aralık eşikleri takvim günüdür (gece yarısı sınırı)', () => {
    expect(rangeFloor('bugun', CTX)).toBe('2026-11-12')
    expect(rangeFloor('7gun', CTX)).toBe('2026-11-06')
    expect(rangeFloor('tumu', CTX)).toBeNull()
    // 5 Kasım 23:30 UTC = 6 Kasım 02:30 Istanbul: Son 7 gün içinde.
    const edge = row({ id: 'sinir', deletedAt: '2026-11-05T23:30:00Z' })
    expect(applyFilters([edge], { ...BASE, range: '7gun' }, CTX)).toHaveLength(1)
    const out = row({ id: 'dis', deletedAt: '2026-11-05T20:30:00Z' })
    expect(applyFilters([out], { ...BASE, range: '7gun' }, CTX)).toHaveLength(0)
  })

  it('silen süzgeci: bilinmeyen silen ayrı aday', () => {
    const meetings = [
      row({ id: 'a', kind: 'toplanti', actor: { accountId: 'a7', name: 'Reha' } }),
      row({ id: 'b', kind: 'toplanti', actor: { accountId: null, name: '' } }),
      row({ id: 'c', kind: 'toplanti', actor: { accountId: 'a7', name: 'Reha' } }),
    ]
    expect(actorCandidates(meetings)).toEqual([
      { accountId: 'a7', name: 'Reha' },
      { accountId: null, name: '' },
    ])
    expect(actorValue({ accountId: null })).toBe(UNKNOWN_ACTOR)
    expect(applyFilters(meetings, { ...BASE, kind: 'toplanti', actor: 'a7' }, CTX)).toHaveLength(2)
    expect(
      applyFilters(meetings, { ...BASE, kind: 'toplanti', actor: UNKNOWN_ACTOR }, CTX).map(
        (r) => r.id,
      ),
    ).toEqual(['b'])
  })

  it('koordinatörlük adayları tekil kimlikler', () => {
    expect(departmentCandidates(rows)).toEqual(['d1', 'd2'])
  })
})

describe('aralık için sayfa yükleme ve sayaç', () => {
  const recent = row({ id: 'r', deletedAt: '2026-11-12T08:00:00Z' })
  const older = row({ id: 'o', deletedAt: '2026-11-01T08:00:00Z' })
  const f = { ...BASE, range: '7gun' as const }

  it('eşik aşılmadıysa ve imleç sürüyorsa daha yükle', () => {
    expect(rangeNeedsMore([recent], f, true, CTX)).toBe(true)
    expect(rangeNeedsMore([], f, true, CTX)).toBe(true)
  })

  it('eşikten eski satır görününce ya da imleç bitince durur; "tümü" ek yükleme yapmaz', () => {
    expect(rangeNeedsMore([recent, older], f, true, CTX)).toBe(false)
    expect(rangeNeedsMore([recent], f, false, CTX)).toBe(false)
    expect(rangeNeedsMore([recent], BASE, true, CTX)).toBe(false)
  })

  it('sayaç: imleç bitmediyse "n+" (yaklaşık)', () => {
    expect(countLabel(12, false)).toBe('12')
    expect(countLabel(200, true)).toBe('200+')
    expect(countLabel(0, false)).toBe('0')
  })
})
