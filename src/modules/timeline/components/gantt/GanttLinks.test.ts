import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { link, task } from '../../model/__tests__/gantt-fixtures'
import type { GanttLink, GanttTask } from '../../model/types'
import GanttLinks from './GanttLinks.vue'
import { layoutOf, RANGE, windowOf } from './gantt-test-support'

const TASKS: GanttTask[] = [
  task({
    work_item_id: 'a',
    department_id: 'd1',
    title: 'A',
    start_on: '2026-11-02',
    end_on: '2026-11-06',
  }),
  task({
    work_item_id: 'b',
    department_id: 'd1',
    title: 'B',
    start_on: '2026-11-09',
    end_on: '2026-11-12',
  }),
  task({
    work_item_id: 'c',
    department_id: 'd2',
    title: 'C',
    start_on: '2026-11-04',
    end_on: '2026-11-08',
  }),
]

function mountLinks(links: GanttLink[], collapsed: string[] = [], tasks = TASKS) {
  const layout = layoutOf(tasks, links, collapsed)
  return mount(GanttLinks, {
    props: { links, tasks, scale: 'gun', range: RANGE, layout, window: windowOf(layout) },
  })
}

describe('bağımlılık okları (E-03C-37; P19)', () => {
  it('görünür iki uç arasında ok: ön görev bitişinden bağımlı başlangıcına', () => {
    const links = mountLinks([link({ dependency_id: 'l1', source: 'a', target: 'b' })])
    const path = links.get('[data-link="l1"]')
    // a: 2 Kas → 6 Kas dahil, plan sağı 5*21 = 105; satırlar (ada göre): g:d2 0, c 40, g:d1 84, a 124, b 168
    expect(path.attributes('d')).toBe('M105,146 H113 V190 H147')
    expect(path.attributes('marker-end')).toBe('url(#gantt-link-head)')
    expect(path.classes()).not.toContain('gantt-link--cross')
  })

  it('görünmeyen uca ok yok: kapalı grup, süzgeç dışı görev', () => {
    const l = link({ dependency_id: 'l1', source: 'a', target: 'c', cross_department: true })
    expect(mountLinks([l]).findAll('[data-link]')).toHaveLength(1)
    expect(mountLinks([l], ['g:d2']).findAll('[data-link]')).toHaveLength(0)
    expect(mountLinks([l], [], TASKS.slice(0, 2)).findAll('[data-link]')).toHaveLength(0)
  })

  it('departmanlar arası ok kesikli', () => {
    const links = mountLinks([
      link({ dependency_id: 'l1', source: 'a', target: 'c', cross_department: true }),
    ])
    expect(links.get('[data-link="l1"]').classes()).toContain('gantt-link--cross')
  })

  it('bağımlı görev ön görev bitmeden başlıyorsa koridordan dolaşır', () => {
    const links = mountLinks([link({ dependency_id: 'l1', source: 'b', target: 'a' })])
    const d = links.get('[data-link="l1"]').attributes('d')!
    expect(d.split(' ').length).toBeGreaterThan(4)
    expect(d.startsWith('M')).toBe(true)
  })

  it('çizilemeyen (tarihi bozuk) uçlu bağ atlanır; süs katmanı, işaretçiyi geçirir', () => {
    const bad = [
      ...TASKS,
      task({ work_item_id: 'x', department_id: 'd1', start_on: '', end_on: '' }),
    ]
    const links = mountLinks([link({ dependency_id: 'l2', source: 'a', target: 'x' })], [], bad)
    expect(links.findAll('[data-link]')).toHaveLength(0)
    expect(links.attributes('aria-hidden')).toBe('true')
    expect(links.classes()).toContain('gantt__layer--static')
  })
})
