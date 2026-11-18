import { describe, expect, it } from 'vitest'

import { ganttModel } from './gantt'
import { edgeRoute, ganttEdges } from './gantt-edges'
import { departmentSections, type ReportTask } from './season-view'
import { seasonFixture, seasonTask } from '../__tests__/fixtures'

const groupsOf = (tasks: ReportTask[]) =>
  ganttModel(
    departmentSections(seasonFixture({ tasks }), () => null),
    '2026-05-30',
  ).groups

const A = seasonTask({
  work_item_id: 'a',
  title: 'Temel',
  code: 'ALT-1',
  start_on: '2026-03-02',
  end_on: '2026-03-10',
})
const B = seasonTask({
  work_item_id: 'b',
  title: 'Duvar',
  code: 'ALT-2',
  start_on: '2026-03-16',
  end_on: '2026-03-20',
})
const edge = (work_item_id: string, depends_on_id: string) => ({ work_item_id, depends_on_id })

describe('Gantt okları (REPORTING-K22)', () => {
  it('yön: depends_on_id ön görev → work_item_id bağımlı; ok ön görev ucundan bağımlı başına', () => {
    const groups = groupsOf([A, B])
    const layout = ganttEdges(groups, [edge('b', 'a')])
    const [only] = layout.edges
    expect(layout.edges).toHaveLength(1)
    expect(only!.fromName).toBe('ALT-1 Temel')
    expect(only!.toName).toBe('ALT-2 Duvar')
    const rows = groups.flatMap((g) => g.rows)
    const a = rows.find((r) => r.id === 'a')!.bar!
    const b = rows.find((r) => r.id === 'b')!.bar!
    expect(only!.x1).toBeCloseTo(a.left + a.width, 6)
    expect(only!.x2).toBeCloseTo(b.left, 6)
    expect(only!.x2).toBeGreaterThan(only!.x1)
    // Ters yön farklı kenardır: ön görev b, bağımlı a.
    const reversed = ganttEdges(groups, [edge('a', 'b')]).edges[0]!
    expect(reversed.fromName).toBe('ALT-2 Duvar')
    expect(reversed.toRow).toBeLessThan(reversed.fromRow)
  })

  it('satır dizini grup başlığını sayar: ilk görev satırı 1, rowCount başlık + görev', () => {
    const groups = groupsOf([A, B])
    const layout = ganttEdges(groups, [edge('b', 'a')])
    expect(layout.rowCount).toBe(groups.length + 2)
    expect(layout.edges[0]).toMatchObject({ fromRow: 1, toRow: 2 })
  })

  it('farklı koordinatörlükler: grup başlıkları da dikey dizine girer', () => {
    const other = seasonTask({
      work_item_id: 'c',
      title: 'Saha',
      department_id: 'd2',
      department_name: 'Operasyon',
      code: 'OPS-1',
      start_on: '2026-04-01',
      end_on: '2026-04-09',
    })
    const groups = groupsOf([A, other])
    expect(groups).toHaveLength(2)
    const layout = ganttEdges(groups, [edge('c', 'a')])
    const rowOf = (id: string) => {
      let index = 0
      for (const group of groups) {
        index += 1
        for (const row of group.rows) {
          if (row.id === id) return index
          index += 1
        }
      }
      return -1
    }
    expect(layout.edges[0]).toMatchObject({ fromRow: rowOf('a'), toRow: rowOf('c') })
    expect(rowOf('c')).toBeGreaterThan(rowOf('a') + 1)
  })

  it('boş/null/undefined kenar listesi hiçbir şey çizmez', () => {
    const groups = groupsOf([A, B])
    for (const input of [[], null, undefined]) {
      expect(ganttEdges(groups, input).edges).toEqual([])
    }
    expect(ganttEdges([], [edge('b', 'a')]).edges).toEqual([])
  })

  it('kendine, eksik uçlu, yinelenen ve çubuksuz uçlu kenarlar atlanır; geçerli olan kalır', () => {
    const bad = seasonTask({
      work_item_id: 'x',
      title: 'Bozuk',
      start_on: 'bozuk',
      end_on: 'bozuk',
    })
    const groups = groupsOf([A, B, bad])
    const layout = ganttEdges(groups, [
      edge('a', 'a'),
      edge('b', 'ghost'),
      edge('ghost', 'a'),
      edge('x', 'a'),
      edge('b', 'x'),
      edge('b', 'a'),
      edge('b', 'a'),
    ])
    expect(layout.edges.map((e) => e.key)).toHaveLength(1)
    expect(layout.edges[0]).toMatchObject({ fromName: 'ALT-1 Temel', toName: 'ALT-2 Duvar' })
  })

  it('aynı görev kimliği iki satırda ise (belirsiz) o kimliğe bağlanan kenar çizilmez', () => {
    const groups = groupsOf([A, B, { ...B, title: 'Duvar (kopya)' }])
    expect(ganttEdges(groups, [edge('b', 'a')]).edges).toEqual([])
  })

  it('görev kodu yoksa ad, kodsuz ve sırasız ise yalnız başlık gösterilir (opak kimlik yok)', () => {
    const noCode = seasonTask({
      work_item_id: 'opaque-uuid-1',
      title: 'Kodsuz iş',
      code: null,
      sequence_no: null,
      start_on: '2026-03-02',
      end_on: '2026-03-10',
    })
    const layout = ganttEdges(groupsOf([noCode, B]), [edge('b', 'opaque-uuid-1')])
    expect(layout.edges[0]!.fromName).toBe('Kodsuz iş')
    expect(`${layout.edges[0]!.fromName}|${layout.edges[0]!.toName}`).not.toContain('opaque-uuid')
  })

  it('geç biten ön görevde ok kırmızı kuyruğun sonundan çıkar (görünen çubuk ucu)', () => {
    const late = seasonTask({
      ...A,
      status: 'tamamlandi',
      completed_on: '2026-03-14',
      is_completed_late: true,
      days_late: 4,
    })
    const groups = groupsOf([late, B])
    const bar = groups[0]!.rows.find((r) => r.id === 'a')!.bar!
    expect(bar.tail).not.toBeNull()
    const [only] = ganttEdges(groups, [edge('b', 'a')]).edges
    expect(only!.x1).toBeCloseTo(bar.tail!.left + bar.tail!.width, 6)
  })

  it('geometri: ileri ok önce dikey sonra yatay (uç sağa); çakışan ok geriye yatay, ucu aşağı/yukarı', () => {
    const forward = edgeRoute({
      key: 'k',
      fromName: '',
      toName: '',
      fromRow: 1,
      toRow: 3,
      x1: 20,
      x2: 50,
    })
    expect(forward.vertical).toEqual({ x: 20, w: 0, row: 1.5, rows: 2 })
    expect(forward.horizontal).toEqual({ x: 20, w: 30, row: 3.5, rows: 0 })
    expect(forward.tip).toEqual({ x: 50, row: 3.5, dir: 'right' })
    // Gerçek çıkış ön görev satırındadır (ara satır değil): dikey çizgi aralarından geçse de nokta kaynağı gösterir.
    expect(forward.origin).toEqual({ x: 20, row: 1.5 })
    const overlap = edgeRoute({
      key: 'k',
      fromName: '',
      toName: '',
      fromRow: 4,
      toRow: 2,
      x1: 60,
      x2: 40,
    })
    expect(overlap.horizontal).toEqual({ x: 40, w: 20, row: 4.5, rows: 0 })
    expect(overlap.vertical).toEqual({ x: 40, w: 0, row: 2.5, rows: 2 })
    expect(overlap.tip.dir).toBe('up')
    expect(overlap.origin).toEqual({ x: 60, row: 4.5 })
    expect(
      edgeRoute({ key: 'k', fromName: '', toName: '', fromRow: 1, toRow: 2, x1: 10, x2: 10 }).tip
        .dir,
    ).toBe('down')
  })

  it('tarih sınırı/DST: takvim günü UTC tabanlı, ok konumu yaz-kış saatinden etkilenmez', () => {
    const spring = seasonTask({
      work_item_id: 'a',
      title: 'Önce',
      start_on: '2026-03-28',
      end_on: '2026-03-29',
    })
    const next = seasonTask({
      work_item_id: 'b',
      title: 'Sonra',
      start_on: '2026-03-30',
      end_on: '2026-03-31',
    })
    const groups = groupsOf([spring, next])
    const [only] = ganttEdges(groups, [edge('b', 'a')]).edges
    // Mart ekseni 31 gün: 29 Mart sonu = 2 günlük çubuk sonu (30/31), bağımlı 30 Mart başı = 29/31.
    expect(only!.x1).toBeCloseTo((29 / 31) * 100, 6)
    expect(only!.x2).toBeCloseTo((29 / 31) * 100, 6)
  })

  it('büyük girdi doğrusal zamanda kesintisiz çizilir (sessiz üst sınır yok)', () => {
    const tasks = Array.from({ length: 600 }, (_, i) =>
      seasonTask({
        work_item_id: `t${i}`,
        title: `G${i}`,
        start_on: '2026-03-02',
        end_on: '2026-03-10',
      }),
    )
    const edges = tasks.slice(1).map((_, i) => edge(`t${i + 1}`, `t${i}`))
    expect(ganttEdges(groupsOf(tasks), edges).edges).toHaveLength(599)
  })
})
