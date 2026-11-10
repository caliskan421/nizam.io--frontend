import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

import { task } from './__tests__/gantt-fixtures'
import {
  addDays,
  axisModel,
  barGeometry,
  DAY_WIDTH,
  durationLabel,
  ganttRange,
  GEOMETRY,
  mondayOnOrBefore,
  planDays,
  rangeDays,
  rangeWidth,
  roundedRectPath,
  scrollLeftFor,
  snapEdgeDay,
  truncateLabel,
  visibleRange,
  weekdayOf,
  xToDay,
  dayX,
  MIN_BAR_W,
} from './timeline'

const RANGE = { start: '2026-11-02', end: '2026-12-06' } // 35 gün, Pazartesi → Pazar
const TODAY = '2026-11-10'
const ctx = (scale: 'gun' | 'hafta' | 'ay' = 'gun', today = TODAY) => ({
  range: RANGE,
  scale,
  today,
})

describe('ölçüler token ile tek kaynak', () => {
  it('gün genişlikleri ve satır ölçüleri gantt-* token değerleridir', () => {
    expect(DAY_WIDTH).toEqual({ gun: 21, hafta: 6, ay: 2 })
    expect(`${GEOMETRY.labelW}px`).toBe(TOKENS['gantt-label-w'].dark)
    expect(`${GEOMETRY.rowH}px`).toBe(TOKENS['gantt-row-h'].dark)
    expect(`${GEOMETRY.groupH}px`).toBe(TOKENS['gantt-group-h'].dark)
    expect(GEOMETRY.barTop).toBe(10)
    expect(GEOMETRY.headH).toBe(62)
  })
})

describe('takvim yardımcıları', () => {
  it('haftanın günü (Pazartesi = 0) ve Pazartesi hizalama', () => {
    expect(weekdayOf('2026-11-02')).toBe(0)
    expect(weekdayOf('2026-11-08')).toBe(6)
    expect(weekdayOf('1970-01-01')).toBe(3)
    expect(weekdayOf('2026-02-30')).toBeNull()
    expect(mondayOnOrBefore('2026-11-05')).toBe('2026-11-02')
    expect(mondayOnOrBefore('2026-11-02')).toBe('2026-11-02')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('bozuk', 1)).toBeNull()
  })
})

describe('aralık (E-03C-23)', () => {
  it('görevleri ve bugünü kapsar, başlangıç Pazartesi, pay eklenir', () => {
    const range = ganttRange(
      [task({ start_on: '2026-11-04', end_on: '2026-11-20', completed_on: '2026-11-25' })],
      '2026-11-10',
    )
    expect(range).toEqual({ start: '2026-10-26', end: '2026-12-09' })
    expect(weekdayOf(range.start)).toBe(0)
  })

  it('bugün görevlerden önce/sonra olabilir; görev yoksa bugünün çevresi', () => {
    expect(ganttRange([], '2026-11-10')).toEqual({ start: '2026-11-02', end: '2026-11-24' })
    const far = ganttRange([task({ start_on: '2026-11-04', end_on: '2026-11-06' })], '2026-12-30')
    expect(far.end).toBe('2027-01-13')
  })

  it('bozuk tarihli görev aralığı bozmaz; en az gün sayısı tuvali doldurur', () => {
    const range = ganttRange([task({ start_on: 'x', end_on: '' })], '2026-11-10', { minDays: 200 })
    expect(rangeDays(range)).toBeGreaterThanOrEqual(200)
    expect(rangeWidth(range, 'gun')).toBe(rangeDays(range) * 21)
  })

  it('tarih ↔ x', () => {
    expect(dayX(RANGE, 'gun', '2026-11-02')).toBe(0)
    expect(dayX(RANGE, 'gun', '2026-11-04')).toBe(42)
    expect(dayX(RANGE, 'hafta', '2026-11-09')).toBe(42)
    expect(dayX(RANGE, 'gun', 'x')).toBeNull()
    expect(xToDay(RANGE, 'gun', 43)).toBe('2026-11-04')
    expect(xToDay(RANGE, 'gun', -5)).toBe('2026-11-02')
    expect(xToDay(RANGE, 'gun', 99_999)).toBe('2026-12-06')
  })

  it('kaydırma → görünen aralık ve ortalama', () => {
    expect(visibleRange(RANGE, 'gun', 0, 210)).toEqual({ start: '2026-11-02', end: '2026-11-11' })
    expect(visibleRange(RANGE, 'gun', 42, 63)).toEqual({ start: '2026-11-04', end: '2026-11-06' })
    expect(visibleRange(RANGE, 'gun', 9_999, 210).end).toBe('2026-12-06')
    expect(scrollLeftFor(RANGE, 'gun', '2026-11-10', 210)).toBe(8 * 21 + 10.5 - 105)
    expect(scrollLeftFor(RANGE, 'gun', '2026-11-02', 400)).toBe(0)
  })

  it('uç yapışması: başlangıç gün sol kenarına, bitiş gün sağ kenarına', () => {
    expect(snapEdgeDay('start', 44, RANGE, 'gun')).toBe('2026-11-04')
    expect(snapEdgeDay('start', 53, RANGE, 'gun')).toBe('2026-11-05')
    expect(snapEdgeDay('end', 63, RANGE, 'gun')).toBe('2026-11-04')
    expect(snapEdgeDay('end', 0, RANGE, 'gun')).toBe('2026-11-02')
    expect(snapEdgeDay('end', 999_999, RANGE, 'hafta')).toBe('2026-12-06')
    // hafta ölçeğinde de gün birimi
    expect(snapEdgeDay('start', 18, RANGE, 'hafta')).toBe('2026-11-05')
  })
})

describe('çubuk geometrisi (E-03C-36, 40, 43)', () => {
  it('plan: başlangıç → planlanan bitiş, bitiş günü dahil', () => {
    const bar = barGeometry(task({ start_on: '2026-11-04', end_on: '2026-11-10' }), ctx())!
    expect(bar.x).toBe(2 * 21)
    expect(bar.planW).toBe(7 * 21)
    expect(bar.planRight).toBe(9 * 21)
    expect(bar.overW).toBe(0)
    expect(bar.right).toBe(bar.planRight)
    expect(bar.overflow).toBeNull()
    expect(bar.clipLeft).toBe(false)
  })

  it('planned_end_on boşsa end_on; doluysa planned_end_on esas', () => {
    const empty = barGeometry(task({ end_on: '2026-11-10', planned_end_on: '' }), ctx())!
    const planned = barGeometry(
      task({ end_on: '2026-11-20', planned_end_on: '2026-11-10' }),
      ctx(),
    )!
    expect(planned.planRight).toBe(empty.planRight)
  })

  it('gecikmede taşma bugüne uzanır', () => {
    const late = task({
      start_on: '2026-11-02',
      end_on: '2026-11-05',
      lateness: { ...task().lateness, is_overdue: true, days_overdue: 5 },
    })
    const bar = barGeometry(late, ctx('gun', '2026-11-10'))!
    expect(bar.planRight).toBe(4 * 21)
    expect(bar.overW).toBe(9 * 21 - 4 * 21)
    expect(bar.right).toBe(9 * 21)
    expect(bar.overflow).toBe('overdue')
  })

  it('geç bitişte taşma tamamlanma gününe uzanır', () => {
    const done = task({
      status: 'tamamlandi',
      start_on: '2026-11-02',
      end_on: '2026-11-05',
      completed_on: '2026-11-08',
      lateness: { ...task().lateness, is_completed_late: true, days_late: 3 },
    })
    const bar = barGeometry(done, ctx())!
    expect(bar.right).toBe(7 * 21)
    expect(bar.overflow).toBe('completed-late')
  })

  it('zamanında biten ya da taşması planın içinde kalan görevde taşma yok', () => {
    const early = task({
      end_on: '2026-11-10',
      completed_on: '2026-11-08',
      lateness: { ...task().lateness, is_completed_early: true },
    })
    expect(barGeometry(early, ctx())!.overW).toBe(0)
    const lateInside = task({
      start_on: '2026-11-02',
      end_on: '2026-11-20',
      lateness: { ...task().lateness, is_overdue: true },
    })
    expect(barGeometry(lateInside, ctx('gun', '2026-11-10'))!.overW).toBe(0)
  })

  it('aralıktan önce başlayan çubuk kırpılır (düz sol köşe)', () => {
    const bar = barGeometry(task({ start_on: '2026-10-20', end_on: '2026-11-04' }), ctx())!
    expect(bar.clipLeft).toBe(true)
    expect(bar.x).toBe(0)
    expect(bar.planRight).toBe(3 * 21)
  })

  it('tümüyle aralığın solundaki ya da tarihi bozuk görev çizilmez', () => {
    expect(barGeometry(task({ start_on: '2026-10-01', end_on: '2026-10-05' }), ctx())).toBeNull()
    expect(barGeometry(task({ start_on: 'x' }), ctx())).toBeNull()
    expect(barGeometry(task({ end_on: '', planned_end_on: '' }), ctx())).toBeNull()
  })

  it('tek günlük görev ay ölçeğinde de en az en dar genişlikte', () => {
    const bar = barGeometry(task({ start_on: '2026-11-04', end_on: '2026-11-04' }), ctx('ay'))!
    expect(bar.planW).toBe(MIN_BAR_W)
  })

  it('bitiş başlangıçtan önceyse en az bir gün', () => {
    const bar = barGeometry(task({ start_on: '2026-11-10', end_on: '2026-11-05' }), ctx())!
    expect(bar.planW).toBe(21)
  })

  it('süre: gün/hafta/ay birimi ve en az 1', () => {
    expect(planDays(task({ start_on: '2026-11-02', end_on: '2026-11-15' }))).toBe(14)
    expect(planDays(task({ start_on: 'x' }))).toBeNull()
    expect(durationLabel(14, 'gun')).toEqual({ value: 14, unit: 'day' })
    expect(durationLabel(14, 'hafta')).toEqual({ value: 2, unit: 'week' })
    expect(durationLabel(2, 'hafta')).toEqual({ value: 1, unit: 'week' })
    expect(durationLabel(75, 'ay')).toEqual({ value: 3, unit: 'month' })
    expect(durationLabel(3, 'ay')).toEqual({ value: 1, unit: 'month' })
  })

  it('yazı kesme: sığarsa aynen, sığmazsa …; hiç sığmazsa boş', () => {
    expect(truncateLabel('Kısa', 200)).toBe('Kısa')
    const cut = truncateLabel('Çok uzun bir görev başlığı burada', 70)
    expect(cut.endsWith('…')).toBe(true)
    expect(cut.length * 7).toBeLessThanOrEqual(70)
    expect(truncateLabel('Başlık', 5)).toBe('')
    expect(truncateLabel('Başlık', 7)).toBe('')
  })

  it('seçilebilir köşeli yol', () => {
    const both = roundedRectPath(0, 0, 100, 24, 8, { left: true, right: true })
    expect(both.match(/A/g)).toHaveLength(4)
    const flatLeft = roundedRectPath(0, 0, 100, 24, 8, { left: false, right: true })
    expect(flatLeft.match(/A/g)).toHaveLength(2)
    expect(roundedRectPath(0, 0, 100, 24, 8, { left: false, right: false })).not.toContain('A')
  })
})

describe('eksen başlığı (E-03C-23…26)', () => {
  it('ay genişliği = gün sayısı oranı; aralığa kırpılır', () => {
    const axis = axisModel('hafta', RANGE, TODAY)
    expect(axis.width).toBe(35 * 6)
    expect(axis.top.map((c) => [c.month, c.width])).toEqual([
      [10, 29 * 6],
      [11, 6 * 6],
    ])
    expect(axis.top[0]!.x).toBe(0)
    expect(axis.top[1]!.x).toBe(29 * 6)
    expect(axis.top[0]!.current).toBe(true)
  })

  it('hafta ölçeği: Pazartesi hücreleri, bugünün haftası vurgulu, çizgiler', () => {
    const axis = axisModel('hafta', RANGE, TODAY)
    expect(axis.bottom.map((c) => c.day)).toEqual([2, 9, 16, 23, 30])
    expect(axis.bottom.filter((c) => c.current).map((c) => c.day)).toEqual([9])
    expect(axis.lines).toEqual([42, 84, 126, 168])
    expect(axis.weekends).toEqual([])
    expect(axis.todayX).toBe(8 * 6 + 3)
  })

  it('gün ölçeği: hafta sonu gölgesi ve haftalık etiket', () => {
    const axis = axisModel('gun', RANGE, TODAY)
    expect(axis.bottom.every((c) => c.kind === 'day')).toBe(true)
    expect(axis.weekends).toHaveLength(10)
    expect(axis.weekends[0]).toEqual({ x: 5 * 21, width: 21 })
    expect(axis.lines[0]).toBe(7 * 21)
  })

  it('ay ölçeği: üst satır yıl, alt satır ay', () => {
    const axis = axisModel('ay', { start: '2026-11-30', end: '2027-02-10' }, '2027-01-05')
    expect(axis.top.map((c) => [c.year, c.width])).toEqual([
      [2026, 32 * 2],
      [2027, 41 * 2],
    ])
    expect(axis.bottom.map((c) => c.month)).toEqual([10, 11, 0, 1])
    expect(axis.bottom.find((c) => c.month === 0)!.current).toBe(true)
    expect(axis.weekends).toEqual([])
  })

  it('bugün aralık dışındaysa işaret yok', () => {
    expect(axisModel('gun', RANGE, '2027-05-05').todayX).toBeNull()
  })
})

describe('plan kenarları (oklar için)', () => {
  it('taşmasız sol ve sağ kenar; çizilemeyen görev null', async () => {
    const { planEdges } = await import('./timeline')
    const late = task({
      start_on: '2026-11-02',
      end_on: '2026-11-05',
      lateness: { ...task().lateness, is_overdue: true },
    })
    expect(planEdges(late, RANGE, 'gun')).toEqual({ left: 0, planRight: 4 * 21 })
    expect(planEdges(task({ start_on: 'x' }), RANGE, 'gun')).toBeNull()
  })
})
