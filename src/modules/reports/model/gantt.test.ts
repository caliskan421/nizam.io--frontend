import { describe, expect, it } from 'vitest'

import { dayNumber, ganttModel, taskBar, taskLabel } from './gantt'
import { departmentSections, type ReportTask } from './season-view'
import { seasonFixture, seasonTask } from '../__tests__/fixtures'

const sectionsOf = (tasks: ReportTask[]) =>
  departmentSections(
    seasonFixture({
      tasks,
      coordinatorship_performance: seasonFixture().coordinatorship_performance,
    }),
    () => null,
  )

describe('Gantt modeli (E-13-28, BE-123)', () => {
  it('gün numarası: geçerli takvim günü; geçersiz null', () => {
    expect(dayNumber('2026-03-01')).toBe(dayNumber('2026-02-28')! + 1)
    expect(dayNumber('x')).toBeNull()
    expect(dayNumber(null)).toBeNull()
  })

  it('eksen en erken ayın ilkinden en geç ayın sonuna; aylar genişlikleri toplamı 100', () => {
    const model = ganttModel(
      sectionsOf([
        seasonTask({ work_item_id: 'a', start_on: '2026-03-09', end_on: '2026-03-28' }),
        seasonTask({ work_item_id: 'b', start_on: '2026-05-04', end_on: '2026-05-29' }),
      ]),
      '2026-05-10',
    )
    expect(model.months.map((m) => m.key)).toEqual(['2026-03', '2026-04', '2026-05'])
    expect(model.months.reduce((sum, m) => sum + m.width, 0)).toBeCloseTo(100, 6)
    expect(model.months[0]!.ticks.map((t) => t.day)).toEqual([1, 15])
    expect(model.months[0]!.ticks[0]!.left).toBe(0)
    expect(model.range).toEqual({ from: '2026-03', to: '2026-05' })
    expect(model.taskCount).toBe(2)
  })

  it('görev yoksa boş model (çubuk uydurulmaz)', () => {
    const model = ganttModel([], '2026-05-10')
    expect(model).toMatchObject({ groups: [], months: [], today: null, taskCount: 0, range: null })
  })

  it('rapor günü eksene yakınsa çizgi; çok sonraysa yok', () => {
    const tasks = [seasonTask({ start_on: '2026-03-02', end_on: '2026-03-20' })]
    expect(ganttModel(sectionsOf(tasks), '2026-03-25').today).not.toBeNull()
    expect(ganttModel(sectionsOf(tasks), '2027-01-01').today).toBeNull()
    expect(ganttModel(sectionsOf(tasks), null).today).toBeNull()
  })

  const bar = (over: Partial<ReportTask>, today: number | null = null) =>
    taskBar(seasonTask(over), dayNumber('2026-03-01')!, 31, today)

  it('zamanında/erken biten: tek çubuk, kuyruk yok; geç biten: kırmızı kuyruk', () => {
    const base = { start_on: '2026-03-02', end_on: '2026-03-10', status: 'tamamlandi' }
    const ontime = bar({ ...base, completed_on: '2026-03-10' })
    expect(ontime).toMatchObject({ kind: 'done', tail: null })
    const early = bar({ ...base, completed_on: '2026-03-06' })!
    expect(early.width).toBeLessThan(ontime!.width)
    const late = bar({ ...base, completed_on: '2026-03-14' })!
    expect(late.kind).toBe('late')
    expect(late.tail).toMatchObject({ open: false })
    expect(late.tail!.left).toBeCloseTo(late.left + late.width, 6)
  })

  it('açık gecikmiş: kesik kenar; kuyruk rapor gününe kadar; gün eksende değilse yalnız kenar', () => {
    const task = { start_on: '2026-03-02', end_on: '2026-03-10', is_overdue: true }
    const withToday = bar(task, dayNumber('2026-03-20'))!
    expect(withToday.kind).toBe('overdue')
    expect(withToday.tail).toMatchObject({ open: true })
    expect(bar(task, null)).toMatchObject({ kind: 'overdue', tail: null })
  })

  it('geçersiz tarih: çubuk yok', () => {
    expect(bar({ start_on: 'x' })).toBeNull()
  })

  it('görev etiketi: kod, yoksa #sıra, yoksa —', () => {
    expect(taskLabel(seasonTask({ code: 'ALT-7', sequence_no: 7 }))).toBe('ALT-7')
    expect(taskLabel(seasonTask({ code: null, sequence_no: 7 }))).toBe('#7')
    expect(taskLabel(seasonTask({ code: null, sequence_no: null }))).toBe('—')
  })

  it('gruplar bölüm sırasında; görev satırı gecikme türü ve gün sayısı', () => {
    const model = ganttModel(
      sectionsOf([
        seasonTask({ work_item_id: 'x', is_overdue: true, days_overdue: 4 }),
        seasonTask({
          work_item_id: 'y',
          status: 'tamamlandi',
          is_completed_late: true,
          days_late: 2,
          completed_on: '2026-10-19',
        }),
      ]),
      '2026-10-21',
    )
    const rows = model.groups.flatMap((g) => g.rows)
    expect(rows.map((r) => [r.id, r.lateKind, r.lateDays])).toEqual([
      ['x', 'overdue', 4],
      ['y', 'late', 2],
    ])
  })
})
