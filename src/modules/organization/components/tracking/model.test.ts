import { describe, expect, it } from 'vitest'

import {
  calendarWeeks,
  cardItems,
  cardViews,
  daysBetween,
  distribution,
  dueNote,
  formatDay,
  groupRows,
  isMonth,
  istanbulToday,
  monthName,
  percent,
  possessiveSuffix,
  shiftMonth,
  statusLabel,
  STATUS_DOT,
  trackingCounts,
  weekBounds,
  type TrackingItem,
} from './model'

function item(id: string, patch: Partial<TrackingItem> = {}): TrackingItem {
  return {
    work_item_id: id,
    department_id: 'd1',
    title: id,
    status: 'devam_ediyor',
    end_on: '2026-11-20',
    is_overdue: false,
    days_overdue: 0,
    ...patch,
  }
}

// 2026-11-11 çarşamba: hafta 09 (pazartesi) – 15 (pazar).
const TODAY = '2026-11-11'

describe('sayım ve kartlar (E-05-49…52)', () => {
  const items = [
    item('a', { status: 'tamamlandi', end_on: '2026-11-01', is_overdue: false }),
    item('b', { status: 'iade_edildi' }),
    item('c', { status: 'onaya_sunuldu', is_overdue: true, days_overdue: 3 }),
    item('d', { status: 'baslanmadi' }),
  ]

  it('iade_edildi açık sayılır; tamamlanmış geç görev gecikmede sayılmaz', () => {
    const done = item('e', { status: 'tamamlandi', is_overdue: true, days_overdue: 2 })
    expect(trackingCounts([...items, done])).toEqual({
      total: 5,
      completed: 2,
      open: 3,
      overdue: 1,
      pending: 1,
    })
    expect(cardItems([...items, done], 'geciken').map((i) => i.work_item_id)).toEqual(['c'])
    expect(cardItems(items, 'acik').map((i) => i.work_item_id)).toEqual(['b', 'c', 'd'])
    expect(cardItems(items, 'tamamlanan').map((i) => i.work_item_id)).toEqual(['a'])
    expect(cardItems(items, 'onayda').map((i) => i.work_item_id)).toEqual(['c'])
  })

  it('kart metinleri: yüzde, Türkçe ek, zamanında, onay notu yok', () => {
    const cards = cardViews(trackingCounts(items))
    expect(cards.map((c) => c.key)).toEqual(['tamamlanan', 'acik', 'geciken', 'onayda'])
    expect(cards[0]).toMatchObject({ value: '%25', note: '4 görevin 1’i bitti', bar: 25 })
    expect(cards[1]).toMatchObject({ value: '3', note: '2 tanesi zamanında ilerliyor', bar: 75 })
    expect(cards[2]).toMatchObject({ value: '1', note: 'Açık görevlerin %33’ü', danger: true })
    expect(cards[3]).toMatchObject({ value: '1', note: null, bar: 33 })
  })

  it('toplam 0 → "%0" + nötr not; açık 0 → "Açık görev yok"', () => {
    const empty = cardViews(trackingCounts([]))
    expect(empty[0]).toMatchObject({ value: '%0', note: 'Henüz görev yok', bar: 0 })
    expect(empty[2]!.note).toBe('Henüz görev yok')
    const allDone = cardViews(trackingCounts([item('x', { status: 'tamamlandi' })]))
    expect(allDone[2]!.note).toBe('Açık görev yok')
    expect(allDone[0]!.note).toBe('1 görevin 1’i bitti')
  })

  it('Türkçe iyelik eki sayının okunuşuna göre', () => {
    expect(possessiveSuffix(0)).toBe('’ı')
    expect(possessiveSuffix(2)).toBe('’si')
    expect(possessiveSuffix(6)).toBe('’sı')
    expect(possessiveSuffix(9)).toBe('’u')
    expect(possessiveSuffix(44)).toBe('’ü')
    expect(possessiveSuffix(100)).toBe('’ü')
    expect(possessiveSuffix(40)).toBe('’ı')
  })

  it('yüzde payda 0 → 0, sınırlı', () => {
    expect(percent(1, 0)).toBe(0)
    expect(percent(2, 3)).toBe(67)
    expect(percent(5, 3)).toBe(100)
  })
})

describe('tarih yardımcıları', () => {
  it('Europe/Istanbul günü (UTC gece yarısından önce ertesi gün)', () => {
    expect(istanbulToday(new Date('2026-11-10T22:30:00Z'))).toBe('2026-11-11')
  })

  it('hafta sınırı pazartesi–pazar', () => {
    expect(weekBounds(TODAY)).toEqual({ start: '2026-11-09', end: '2026-11-15' })
    expect(weekBounds('2026-11-15')).toEqual({ start: '2026-11-09', end: '2026-11-15' })
    expect(weekBounds('2026-11-16')).toEqual({ start: '2026-11-16', end: '2026-11-22' })
    expect(weekBounds('bozuk')).toBeNull()
  })

  it('gün farkı, biçim, ay', () => {
    expect(daysBetween(TODAY, '2026-11-20')).toBe(9)
    expect(daysBetween('x', TODAY)).toBeNull()
    expect(formatDay('2026-11-04')).toBe('04.11.2026')
    expect(formatDay('bozuk')).toBe('bozuk')
    expect(isMonth('2026-11')).toBe(true)
    expect(isMonth('2026-13')).toBe(false)
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(monthName('2026-10')).toBe('Ekim')
  })
})

describe('tablo (E-05-57…65)', () => {
  it('bitiş notu üç durum: gecikti (sunucu) / kaldı (istemci) / tamamlanmış yok', () => {
    expect(dueNote(item('a', { is_overdue: true, days_overdue: 17 }), TODAY)).toEqual({
      text: '17 gün gecikti',
      tone: 'danger',
    })
    expect(dueNote(item('b', { end_on: '2026-11-13' }), TODAY)).toEqual({
      text: '2 gün kaldı',
      tone: 'faint',
    })
    expect(dueNote(item('c', { status: 'tamamlandi' }), TODAY)).toBeNull()
    expect(dueNote(item('d', { end_on: '2026-11-01' }), TODAY)).toBeNull()
  })

  it('son tarihe göre: Gecikmede → Bu hafta → Sonra; grup içi bitiş artan; boş grup yok', () => {
    const groups = groupRows(
      [
        item('sonra', { end_on: '2026-11-16' }),
        item('pazar', { end_on: '2026-11-15' }),
        item('gec', { end_on: '2026-11-05', is_overdue: true, days_overdue: 6 }),
        item('bugun', { end_on: TODAY }),
      ],
      'son-tarih',
      TODAY,
    )
    expect(groups.map((g) => [g.name, g.tone, g.rows.map((r) => r.work_item_id)])).toEqual([
      ['Gecikmede', 'danger', ['gec']],
      ['Bu hafta', 'ink', ['bugun', 'pazar']],
      ['Sonra', 'muted', ['sonra']],
    ])
    expect(groupRows([item('x', { end_on: '2026-12-01' })], 'son-tarih', TODAY)).toHaveLength(1)
  })

  it('duruma göre: 5 durum sözleşme sırasıyla, Geri gönderildi dahil', () => {
    const groups = groupRows(
      [
        item('a', { status: 'tamamlandi' }),
        item('b', { status: 'iade_edildi' }),
        item('c', { status: 'baslanmadi' }),
      ],
      'durum',
      TODAY,
    )
    expect(groups.map((g) => g.name)).toEqual(['Başlamadı', 'Geri gönderildi', 'Tamamlandı'])
  })

  it('5 durum etiketi ve nokta', () => {
    expect(Object.keys(STATUS_DOT)).toHaveLength(5)
    expect(STATUS_DOT.iade_edildi).toBe('back')
    expect(statusLabel('onaya_sunuldu')).toBe('Onay bekliyor')
    expect(statusLabel('iade_edildi')).toBe('Geri gönderildi')
  })
})

describe('takvim (E-05-68…72)', () => {
  it('pazartesi başlar; açık görevler; kaçırılan önceliklidir; bugün ve geçmiş işaretli', () => {
    const weeks = calendarWeeks(
      '2026-10',
      [
        item('a', { end_on: '2026-10-04', is_overdue: true, days_overdue: 17 }),
        item('b', { end_on: '2026-10-23' }),
        item('c', { end_on: '2026-10-23', is_overdue: true, days_overdue: 1 }),
        item('d', { end_on: '2026-10-25', status: 'tamamlandi' }),
        item('e', { end_on: '2026-11-02' }),
      ],
      '2026-10-21',
    )
    const cells = weeks.flat()
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    // 1 Ekim 2026 perşembe → 3 boş hücre.
    expect(cells.slice(0, 4).map((c) => c.day)).toEqual([null, null, null, 1])
    const day = (n: number) => cells.find((c) => c.day === n)!
    expect(day(4)).toMatchObject({ kind: 'late', past: true, label: '4 Ekim, kaçırılan son tarih' })
    expect(day(23)).toMatchObject({ kind: 'late', past: false })
    expect(day(25).kind).toBeNull()
    expect(day(21)).toMatchObject({ today: true, past: false, label: '21 Ekim' })
    expect(cells.filter((c) => c.day !== null)).toHaveLength(31)
  })

  it('yaklaşan etiketi', () => {
    const cells = calendarWeeks('2026-11', [item('a', { end_on: '2026-11-20' })], TODAY).flat()
    expect(cells.find((c) => c.day === 20)!.label).toBe('20 Kasım, yaklaşan son tarih')
  })
})

describe('durum dağılımı (E-05-73…75)', () => {
  it('açık görevlerin 4 durumu; geri gönderildi ayrı dilim; aria özeti', () => {
    const d = distribution([
      item('a', { status: 'baslanmadi' }),
      item('b', { status: 'devam_ediyor' }),
      item('c', { status: 'devam_ediyor' }),
      item('d', { status: 'iade_edildi' }),
      item('e', { status: 'tamamlandi' }),
    ])
    expect(d.total).toBe(4)
    expect(d.slices.map((s) => [s.status, s.count, s.share])).toEqual([
      ['baslanmadi', 1, 25],
      ['devam_ediyor', 2, 50],
      ['onaya_sunuldu', 0, 0],
      ['iade_edildi', 1, 25],
    ])
    expect(d.label).toBe('4 görev: 1 başlamadı, 2 devam, 0 onayda, 1 geri gönderildi')
  })
})
