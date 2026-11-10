// Gantt bileşen testleri için ortak kurulum (örnek veri; gerçek veri DEĞİLDİR).
import { buildLayout, rowWindow, type GanttLayout } from '../../model/rows'
import type { GanttLink, GanttTask } from '../../model/types'

export const RANGE = { start: '2026-11-02', end: '2026-12-06' }
export const TODAY = '2026-11-10'
export const NAMES = new Map([
  ['d1', 'Mekanik sistemler'],
  ['d2', 'Altyapı ve tesisat'],
])

export function layoutOf(
  tasks: readonly GanttTask[],
  links: readonly GanttLink[] = [],
  collapsed: string[] = [],
): GanttLayout {
  return buildLayout({
    tasks,
    links,
    departmentNames: NAMES,
    collapsed: new Set(collapsed),
  })
}

export const windowOf = (layout: GanttLayout) => rowWindow(layout.rows, 0, 100_000)
