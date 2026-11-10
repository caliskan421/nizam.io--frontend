import { describe, expect, it } from 'vitest'

import { link, manyTasks, task } from './__tests__/gantt-fixtures'
import { buildLinkIndex, laneFor, linkPath, linksInWindow } from './links'
import { buildLayout, groupKey } from './rows'

const TASKS = [
  task({ work_item_id: 'a', department_id: 'd1', start_on: '2026-11-02', title: 'A' }),
  task({ work_item_id: 'b', department_id: 'd1', start_on: '2026-11-03', title: 'B' }),
  task({ work_item_id: 'c', department_id: 'd2', start_on: '2026-11-04', title: 'C' }),
]
const NAMES = new Map([
  ['d1', 'Birinci'],
  ['d2', 'İkinci'],
])
const layoutOf = (collapsed: string[] = []) =>
  buildLayout({
    tasks: TASKS,
    links: [],
    departmentNames: NAMES,
    collapsed: new Set(collapsed),
  })

describe('ok dizini — P19: yalnız iki ucu da görünür görevler arasında', () => {
  it('iki ucu da satırı olan bağ okunur', () => {
    const index = buildLinkIndex([link({ source: 'a', target: 'b' })], layoutOf())
    expect(index.refs.map((r) => [r.sourceId, r.targetId])).toEqual([['a', 'b']])
    expect(index.refs[0]).toMatchObject({ sourceRow: 1, targetRow: 2, minRow: 1, maxRow: 2 })
  })

  it('görünmeyen uca ok yok: kapalı grup, süzgeç dışı görev, bilinmeyen kimlik', () => {
    const links = [
      link({ dependency_id: 'l1', source: 'a', target: 'c' }),
      link({ dependency_id: 'l2', source: 'a', target: 'yok' }),
    ]
    expect(buildLinkIndex(links, layoutOf([groupKey('d2')])).refs).toEqual([])
    expect(buildLinkIndex(links, layoutOf()).refs.map((r) => r.id)).toEqual(['l1'])
  })

  it('kendine bağ ve yinelenen bağ elenir', () => {
    const links = [
      link({ dependency_id: 'l1', source: 'a', target: 'a' }),
      link({ dependency_id: 'l2', source: 'a', target: 'b' }),
      link({ dependency_id: 'l2', source: 'a', target: 'b' }),
    ]
    expect(buildLinkIndex(links, layoutOf()).refs.map((r) => r.id)).toEqual(['l2'])
  })

  it('grup başlığı bir uç olamaz', () => {
    const index = buildLinkIndex([link({ source: groupKey('d1'), target: 'b' })], layoutOf())
    expect(index.refs).toEqual([])
  })

  it('departmanlar arası bayrağı korunur', () => {
    const index = buildLinkIndex(
      [link({ source: 'a', target: 'c', cross_department: true })],
      layoutOf(),
    )
    expect(index.refs[0]!.crossDepartment).toBe(true)
  })
})

describe('pencere sorgusu (kaydırmada tüm links taranmaz)', () => {
  const tasks = manyTasks(250)
  const layout = buildLayout({
    tasks,
    links: [],
    departmentNames: new Map(),
    collapsed: new Set(),
  })
  const keys = layout.rows.filter((r) => r.kind === 'task').map((r) => r.key)
  const links = Array.from({ length: 60 }, (_, i) =>
    link({ dependency_id: `l${i}`, source: keys[i * 4]!, target: keys[i * 4 + 3]! }),
  )
  const index = buildLinkIndex(links, layout)

  it('pencereye değen oklar, kaba tarama ile aynı kümedir', () => {
    for (const [first, last] of [
      [0, 20],
      [100, 130],
      [240, 320],
      [500, 600],
    ] as const) {
      const expected = index.refs
        .filter((r) => r.maxRow >= first && r.minRow <= last)
        .map((r) => r.id)
      expect(linksInWindow(index, first, last).map((r) => r.id)).toEqual(expected)
    }
  })

  it('pencere dışı ve boş pencere boş döner', () => {
    expect(linksInWindow(index, 9999, 10_050)).toEqual([])
    expect(linksInWindow(index, 5, 1)).toEqual([])
    expect(linksInWindow({ refs: [], prefixMax: [] }, 0, 10)).toEqual([])
  })

  it('pencereyi kesen uzun ok (iki ucu da dışarıda) yakalanır', () => {
    const long = buildLinkIndex([link({ source: keys[0]!, target: keys[200]! })], layout)
    const [ref] = long.refs
    expect(linksInWindow(long, ref!.minRow + 20, ref!.minRow + 40)).toHaveLength(1)
  })
})

describe('ok yolu', () => {
  it('ön görev sonrası başlayan bağımlı: tek dirsekli yol', () => {
    expect(linkPath({ sx: 100, sy: 22, tx: 160, ty: 66, laneY: 44 }, 8)).toBe(
      'M100,22 H108 V66 H160',
    )
  })

  it('bağımlı ön görev bitmeden başlıyorsa koridordan dolaşır', () => {
    expect(linkPath({ sx: 100, sy: 22, tx: 90, ty: 66, laneY: 44 }, 8)).toBe(
      'M100,22 H108 V44 H82 V66 H90',
    )
  })

  it('koridor: bağımlı satır aşağıdaysa üst sınırı, yukarıdaysa alt sınırı', () => {
    expect(laneFor({ y: 40, height: 44 }, { y: 84, height: 44 })).toBe(84)
    expect(laneFor({ y: 84, height: 44 }, { y: 40, height: 44 })).toBe(84)
    expect(laneFor({ y: 40, height: 44 }, { y: 40, height: 44 })).toBe(40)
  })
})
