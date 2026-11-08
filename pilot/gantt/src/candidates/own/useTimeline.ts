/**
 * Kendi SVG Gantt'ın hesap katmanı (DOM'suz): zaman ekseni, satır düzlemi (grup → görev →
 * statik alt görev), değişken satır yüksekliği (40/44/30), sanallaştırma penceresi, çubuk ve
 * ok geometrisi. Oklar DOM'dan değil satır ofsetlerinden hesaplanır → sanallaştırmayla uyumlu.
 */
import { computed, reactive, type Ref } from 'vue'
import {
  DAY,
  DEPARTMENTS,
  parseDay,
  plannedEnd,
  todayUtc,
  type Gantt,
  type GanttTask,
} from '../../common/mock'
import type { Scale } from '../../common/state'

export const LABEL_W = 300
const H = { group: 40, task: 44, sub: 30 } as const
const BAR_H = 24

export type Row =
  | {
      kind: 'group'
      key: string
      level: 1
      name: string
      count: number
      done: number
      open: boolean
    }
  | { kind: 'task'; key: string; level: 2; task: GanttTask; open: boolean }
  | { kind: 'sub'; key: string; level: 3; parent: string }

export function useTimeline(gantt: Ref<Gantt>, scale: Ref<Scale>) {
  const open = reactive({
    groups: new Set<string>(DEPARTMENTS.map((d) => d.id)),
    tasks: new Set<string>(),
  })
  const today = todayUtc()
  const range = computed(() => {
    let min = today.getTime()
    let max = today.getTime()
    for (const t of gantt.value.tasks) {
      min = Math.min(min, parseDay(t.start_on).getTime())
      max = Math.max(
        max,
        parseDay(t.end_on).getTime(),
        t.completed_on ? parseDay(t.completed_on).getTime() : 0,
      )
    }
    return { start: min - 7 * DAY, days: Math.ceil((max - min) / DAY) + 14 }
  })
  const dayW = computed(() => (scale.value === 'gun' ? 21 : 6))
  const width = computed(() => range.value.days * dayW.value)
  const x = (iso: string) => ((parseDay(iso).getTime() - range.value.start) / DAY) * dayW.value
  const todayX = computed(() => ((today.getTime() - range.value.start) / DAY) * dayW.value)

  const rows = computed<Row[]>(() => {
    const out: Row[] = []
    for (const d of DEPARTMENTS) {
      const tasks = gantt.value.tasks
        .filter((t) => t.department_id === d.id)
        .sort((a, b) => a.start_on.localeCompare(b.start_on))
      const g = open.groups.has(d.id)
      const done = tasks.filter((t) => t.status === 'tamamlandi').length
      out.push({
        kind: 'group',
        key: d.id,
        level: 1,
        name: d.name,
        count: tasks.length,
        done,
        open: g,
      })
      if (!g) continue
      for (const t of tasks) {
        const o = open.tasks.has(t.work_item_id)
        out.push({ kind: 'task', key: t.work_item_id, level: 2, task: t, open: o })
        if (o)
          for (const i of [1, 2])
            out.push({
              kind: 'sub',
              key: `${t.work_item_id}:${i}`,
              level: 3,
              parent: t.work_item_id,
            })
      }
    }
    return out
  })
  const offsets = computed(() => {
    const ys = [0]
    for (const r of rows.value) ys.push(ys[ys.length - 1]! + H[r.kind])
    return ys
  })
  const height = computed(() => offsets.value[offsets.value.length - 1]!)
  const rowIndex = computed(() => new Map(rows.value.map((r, i) => [r.key, i])))

  /** İkili arama: `y` konumundaki satır. */
  function rowAt(y: number): number {
    const ys = offsets.value
    let lo = 0
    let hi = ys.length - 2
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (ys[mid]! <= y) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  function windowOf(scrollTop: number, viewH: number, overscan = 6) {
    const first = Math.max(0, rowAt(scrollTop) - overscan)
    const last = Math.min(rows.value.length - 1, rowAt(scrollTop + viewH) + overscan)
    return { first, last, top: offsets.value[first]!, bottom: offsets.value[last + 1]! }
  }

  function bar(t: GanttTask) {
    const x0 = x(t.start_on)
    const xp = x(plannedEnd(t)) + dayW.value
    const overEnd = t.lateness.is_overdue
      ? todayX.value
      : t.lateness.is_completed_late
        ? x(t.completed_on) + dayW.value
        : xp
    return { x0, xp, x1: Math.max(xp, overEnd), h: BAR_H }
  }

  /** Bitiş→başlangıç oku; uç kapalı grupta ise kısa "dışarıya" saplama döner. */
  function arrows(win: { top: number; bottom: number }) {
    const out: { key: string; d: string; cross: boolean; stub: boolean }[] = []
    for (const l of gantt.value.links) {
      const si = rowIndex.value.get(l.source)
      const ti = rowIndex.value.get(l.target)
      if (si === undefined && ti === undefined) continue
      const mid = (i: number) => offsets.value[i]! + 10 + BAR_H / 2
      const src = taskById.value.get(l.source)!
      const dst = taskById.value.get(l.target)!
      const sx = bar(src).xp
      const tx = bar(dst).x0
      const sy = si !== undefined ? mid(si) : undefined
      const ty = ti !== undefined ? mid(ti) : undefined
      const lo = Math.min(sy ?? ty!, ty ?? sy!)
      const hi = Math.max(sy ?? ty!, ty ?? sy!)
      if (hi < win.top || lo > win.bottom) continue
      const stub = sy === undefined || ty === undefined
      const d = stub
        ? sy !== undefined
          ? `M${sx},${sy} h12`
          : `M${tx - 12},${ty} h12`
        : `M${sx},${sy} h8 V${ty! - 0} H${Math.max(tx - 2, sx + 8)}`
      out.push({ key: l.dependency_id, d, cross: l.cross_department, stub })
    }
    return out
  }

  function toggle(r: Row) {
    const set = r.kind === 'group' ? open.groups : open.tasks
    if (set.has(r.key)) set.delete(r.key)
    else set.add(r.key)
  }

  function expandAll(on: boolean) {
    open.tasks.clear()
    if (on) for (const t of gantt.value.tasks) open.tasks.add(t.work_item_id)
  }

  const taskById = computed(() => new Map(gantt.value.tasks.map((t) => [t.work_item_id, t])))
  const linked = computed(() => new Set(gantt.value.links.flatMap((l) => [l.source, l.target])))

  return {
    rows,
    offsets,
    height,
    width,
    dayW,
    todayX,
    range,
    windowOf,
    bar,
    arrows,
    toggle,
    expandAll,
    linked,
    taskById,
    x,
  }
}
