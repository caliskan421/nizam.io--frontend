import { describe, expect, it } from 'vitest'

import { link, manyTasks, task } from './__tests__/gantt-fixtures'
import {
  buildLayout,
  groupKey,
  revealScrollTop,
  rowAt,
  rowWindow,
  type LayoutInput,
  type TaskRow,
} from './rows'

const NAMES = new Map([
  ['d1', 'Mekanik sistemler'],
  ['d2', 'Altyapı ve tesisat'],
])

function input(over: Partial<LayoutInput> = {}): LayoutInput {
  return {
    tasks: [
      task({ work_item_id: 'a', department_id: 'd1', start_on: '2026-11-05', title: 'B görev' }),
      task({ work_item_id: 'b', department_id: 'd2', start_on: '2026-11-03', title: 'Z görev' }),
      task({ work_item_id: 'c', department_id: 'd1', start_on: '2026-11-02', title: 'A görev' }),
    ],
    links: [],
    departmentNames: NAMES,
    collapsed: new Set(),
    ...over,
  }
}

describe('satır düzlemi (grup → görev)', () => {
  it('gruplar ada göre, görevler başlangıca göre; ofsetler 40/44', () => {
    const layout = buildLayout(input())
    expect(layout.rows.map((r) => r.key)).toEqual([groupKey('d2'), 'b', groupKey('d1'), 'c', 'a'])
    expect(layout.rows.map((r) => r.y)).toEqual([0, 40, 84, 124, 168])
    expect(layout.height).toBe(212)
    expect(layout.rows.map((r) => r.level)).toEqual([1, 2, 1, 2, 2])
    expect(layout.indexByKey.get('c')).toBe(3)
  })

  it('açık alt görev bloğu: görevin altına n × 32 yer açılır, sonraki satırlar kayar (03d)', () => {
    const closed = buildLayout(input())
    const open = buildLayout(input({ subtaskRows: new Map([['c', 3]]) }))
    const at = (layout: typeof open, key: string) =>
      layout.rows[layout.indexByKey.get(key)!] as TaskRow
    expect(at(open, 'c')).toMatchObject({ y: 124, height: 44, subRows: 3, subY: 168 })
    expect(at(open, 'a').y).toBe(at(closed, 'a').y + 3 * 32)
    expect(at(open, 'b').y).toBe(at(closed, 'b').y)
    expect(open.height).toBe(closed.height + 3 * 32)
    expect(at(closed, 'c').subRows).toBe(0)
  })

  it('grup sayaçları: bitti / toplam, gecikme, aralık', () => {
    const layout = buildLayout(
      input({
        tasks: [
          task({
            work_item_id: 'a',
            status: 'tamamlandi',
            start_on: '2026-11-05',
            end_on: '2026-11-09',
          }),
          task({
            work_item_id: 'b',
            start_on: '2026-11-02',
            end_on: '2026-11-20',
            planned_end_on: '2026-11-12',
            lateness: { ...task().lateness, is_overdue: true },
          }),
        ],
      }),
    )
    const group = layout.rows[0]!
    if (group.kind !== 'group') throw new Error('grup bekleniyordu')
    expect(group).toMatchObject({ total: 2, done: 1, hasOverdue: true, open: true })
    expect(group.span).toEqual({ start: '2026-11-02', end: '2026-11-12' })
    expect(group.name).toBe('Mekanik sistemler')
  })

  it('kapalı grup görevlerini gizler; kapalı grup yine de listelenir', () => {
    const layout = buildLayout(input({ collapsed: new Set([groupKey('d1')]) }))
    expect(layout.rows.map((r) => r.key)).toEqual([groupKey('d2'), 'b', groupKey('d1')])
    expect(layout.rows[2]).toMatchObject({ kind: 'group', open: false, total: 2 })
    expect(layout.indexByKey.has('a')).toBe(false)
  })

  it('adı çözülemeyen grup sona, adsız (null) olarak', () => {
    const layout = buildLayout(
      input({ tasks: [task({ work_item_id: 'x', department_id: 'dz' }), ...input().tasks] }),
    )
    const last = layout.rows.filter((r) => r.kind === 'group').at(-1)!
    expect(last).toMatchObject({ departmentId: 'dz', name: null })
  })

  it('tarihi bozuk görev grup aralığını bozmaz', () => {
    const layout = buildLayout(
      input({ tasks: [task({ work_item_id: 'x', start_on: 'x', end_on: '' })] }),
    )
    expect(layout.rows[0]).toMatchObject({ kind: 'group', span: null })
  })

  it('zincir simgesi: yalnız target olan görev', () => {
    const layout = buildLayout(input({ links: [link({ source: 'a', target: 'b' })] }))
    expect([...layout.dependentIds]).toEqual(['b'])
  })

  it('boş girdi: satır yok', () => {
    const layout = buildLayout(input({ tasks: [] }))
    expect(layout.rows).toEqual([])
    expect(layout.height).toBe(0)
    expect(rowAt(layout.rows, 10)).toBe(-1)
    expect(rowWindow(layout.rows, 0, 100)).toEqual({ first: 0, last: -1 })
  })
})

describe('pencere (sanallaştırma)', () => {
  const layout = buildLayout({
    tasks: manyTasks(250),
    links: [],
    departmentNames: new Map(),
    collapsed: new Set(),
  })

  it('ikili arama: y konumundaki satır', () => {
    expect(rowAt(layout.rows, 0)).toBe(0)
    expect(rowAt(layout.rows, 39)).toBe(0)
    expect(rowAt(layout.rows, 40)).toBe(1)
    expect(rowAt(layout.rows, 99_999_999)).toBe(layout.rows.length - 1)
  })

  it('250 görevde pencere görünür dilim + payla sınırlı', () => {
    const win = rowWindow(layout.rows, 2000, 800, 4)
    expect(win.last - win.first + 1).toBeLessThan(40)
    expect(layout.rows[win.first]!.y).toBeLessThanOrEqual(2000)
    expect(layout.rows[win.last]!.y + layout.rows[win.last]!.height).toBeGreaterThanOrEqual(2800)
  })

  it('uçlara kenetlenir', () => {
    expect(rowWindow(layout.rows, -50, 100, 2).first).toBe(0)
    expect(rowWindow(layout.rows, 9e9, 100, 2).last).toBe(layout.rows.length - 1)
  })

  it('görünür alana alma: görünürse aynı, değilse en yakın kenar', () => {
    const row = layout.rows[10]!
    expect(revealScrollTop(row, row.y - 10, 500)).toBe(row.y - 10)
    expect(revealScrollTop(row, row.y + 200, 500)).toBe(row.y)
    expect(revealScrollTop(row, 0, 100)).toBe(row.y + row.height - 100)
  })
})
