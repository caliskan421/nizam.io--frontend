import { describe, expect, it } from 'vitest'

import { stat } from '../__tests__/harness'
import {
  approvalRemainder,
  completionPercent,
  coordSortDisabled,
  filterCounts,
  foldTr,
  initialsOf,
  matchesFilter,
  matchesQuery,
  openTasks,
  sortStats,
  statusBar,
  userCount,
  visibleStats,
} from './coordinatorships'

const NONE = { coordinators: [] }
const STATS = [
  stat('a', 'İdari işler', { overdue_tasks: 4, total_tasks: 11, completed_tasks: 1, ...NONE }),
  stat('b', 'Altyapı ve tesisat', { overdue_tasks: 3, total_tasks: 14, completed_tasks: 9 }),
  stat('c', 'Ulaşım planlama', { overdue_tasks: 3, total_tasks: 4, completed_tasks: 1 }),
  stat('d', 'Çevre', { overdue_tasks: 0, total_tasks: 6, completed_tasks: 6 }),
  stat('e', 'Isparta ofisi', { overdue_tasks: 0, member_count: 40 }),
]

describe('Türkçe katlama (E-01-23, GAP-036)', () => {
  it('İ/ı/I/i birleşir; Türkçe harfler ASCII ile eşleşir', () => {
    expect(foldTr(' İDARİ ')).toBe('idari')
    expect(foldTr('ISPARTA')).toBe('isparta')
    expect(foldTr('ıspArta')).toBe('isparta')
    expect(foldTr('Ulaşım ÇEVRE Öğüt Ğ')).toBe('ulasim cevre ogut g')
  })

  it('ad üzerinde alt dize; boş sorgu hepsi', () => {
    const idari = STATS[0]!
    expect(matchesQuery(idari, 'idari')).toBe(true)
    expect(matchesQuery(idari, 'IDARI')).toBe(true)
    expect(matchesQuery(idari, 'İŞLER')).toBe(true)
    expect(matchesQuery(idari, 'tesis')).toBe(false)
    expect(matchesQuery(idari, '   ')).toBe(true)
    expect(matchesQuery(STATS[4]!, 'ısparta')).toBe(true)
    expect(matchesQuery(STATS[4]!, 'ISPARTA')).toBe(true)
  })
})

describe('süzgeç (E-01-24)', () => {
  it('kümeler: Tümü · Gecikmesi olan · Yolunda · Koordinatörsüz', () => {
    expect(STATS.filter((s) => matchesFilter(s, 'late')).map((s) => s.department_id)).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(STATS.filter((s) => matchesFilter(s, 'on_track')).map((s) => s.department_id)).toEqual([
      'd',
      'e',
    ])
    expect(
      STATS.filter((s) => matchesFilter(s, 'no_coordinator')).map((s) => s.department_id),
    ).toEqual(['a'])
    expect(filterCounts(STATS)).toEqual({ all: 5, late: 3, on_track: 2, no_coordinator: 1 })
  })

  it('sayılar boş listede sıfır', () => {
    expect(filterCounts([])).toEqual({ all: 0, late: 0, on_track: 0, no_coordinator: 0 })
  })
})

describe('sıralama (E-01-25/26)', () => {
  const ids = (list: { department_id: string }[]) => list.map((s) => s.department_id)

  it('gecikme çoktan aza; eşitlikte ad A→Z (Türkçe: Altyapı < Ulaşım)', () => {
    expect(ids(sortStats(STATS, 'late', false))).toEqual(['a', 'b', 'c', 'd', 'e'])
    // d (Çevre) ve e (Isparta) eşit gecikme: Çevre < Isparta
    expect(ids(sortStats([STATS[4]!, STATS[3]!], 'late', false))).toEqual(['d', 'e'])
  })

  it('Türkçe ad sırası: ç ı ş harfleri bayt sırasına düşmez', () => {
    const names = ['Zeytin', 'Çevre', 'Isparta', 'İdari', 'Şehir', 'Ankara'].map((n, i) =>
      stat(String(i), n),
    )
    expect(sortStats(names, 'name', false).map((s) => s.name)).toEqual([
      'Ankara',
      'Çevre',
      'Isparta',
      'İdari',
      'Şehir',
      'Zeytin',
    ])
  })

  it('açık iş çoktan aza; tamamlanma düşükten yükseğe; kullanıcı çoktan aza', () => {
    expect(ids(sortStats(STATS, 'open', false))).toEqual(['a', 'e', 'b', 'c', 'd'])
    const withRate = STATS.map((s) => ({
      ...s,
      completion_rate: (s.completed_tasks / Math.max(s.total_tasks, 1)) * 100,
    }))
    expect(ids(sortStats(withRate, 'completion', false))).toEqual(['a', 'c', 'e', 'b', 'd'])
    expect(ids(sortStats(STATS, 'members', false))[0]).toBe('e')
  })

  it('ters çevirme bütün sırayı tersler; kopya döner', () => {
    const forward = sortStats(STATS, 'name', false)
    expect(sortStats(STATS, 'name', true)).toEqual([...forward].reverse())
    expect(STATS[0]!.department_id).toBe('a')
  })

  it('"Son yükleme" devre dışı (BE-025) ve ada düşer', () => {
    expect(coordSortDisabled('last_upload')).toBe(true)
    expect(coordSortDisabled('late')).toBe(false)
    expect(ids(sortStats(STATS, 'last_upload', false))).toEqual(
      ids(sortStats(STATS, 'name', false)),
    )
  })

  it('süzgeç + arama + sıralama birlikte', () => {
    const out = visibleStats(STATS, {
      filter: 'late',
      query: 'ULAŞIM',
      key: 'late',
      reversed: false,
    })
    expect(ids(out)).toEqual(['c'])
  })
})

describe('kart türetimleri (E-01-32…36)', () => {
  const s = stat('x', 'X', {
    total_tasks: 11,
    completed_tasks: 1,
    in_progress_tasks: 6,
    not_started_tasks: 2,
    completion_rate: 9.09,
    member_count: 1,
    coordinators: [{ account_id: 'l', full_name: 'Bahar Kılıç' }],
  })

  it('kullanıcı = member_count + koordinatörler; açık = toplam − biten', () => {
    expect(userCount(s)).toBe(2)
    expect(openTasks(s)).toBe(10)
  })

  it('4. dilim artığı "onayda/iade" (BE-078), negatif olmaz', () => {
    expect(approvalRemainder(s)).toBe(2)
    expect(approvalRemainder(stat('y', 'Y', { total_tasks: 1, completed_tasks: 5 }))).toBe(0)
  })

  it('yüzde yuvarlanır; çubuk dilimleri toplam üzerinden, görev yoksa sıfır', () => {
    expect(completionPercent(s)).toBe(9)
    const bar = statusBar(s)
    expect(bar.todo).toBeCloseTo(18.18, 1)
    expect(bar.doing).toBeCloseTo(54.55, 1)
    expect(bar.review).toBeCloseTo(18.18, 1)
    expect(bar.done).toBeCloseTo(9.09, 1)
    expect(statusBar(stat('z', 'Z', { total_tasks: 0 }))).toEqual({
      todo: 0,
      doing: 0,
      review: 0,
      done: 0,
    })
  })

  it('baş harfler: ilk iki sözcük, tr büyük harf', () => {
    expect(initialsOf('ali avcı')).toBe('AA')
    expect(initialsOf('İlker')).toBe('İ')
    expect(initialsOf('Mevlüt Yunus Kayacan')).toBe('MY')
  })
})
