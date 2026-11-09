import { describe, expect, it } from 'vitest'

import * as skeleton from './index'

// O2b sözleşmesi: ad → (bildirilmesi gereken prop'lar, emit adları, sahibi W). Bileşen
// BAĞLANMAZ (dolu gövdeler Pinia / TanStack Query / router ister): yalnız derlenmiş seçenek
// nesnesindeki `props` / `emits` bildirimleri denetlenir; yer tutucu ya da dolu gövdeyle aynı
// sonuç (KESİN 22; web-1 W41b, web-2 W72 dersi).
const CONTRACT = {
  GanttView: [
    ['tasks', 'links', 'scale', 'today', 'departmentNames', 'selectedId', 'draggableIds'],
    ['select', 'edge-drag', 'scroll'],
    'W92',
  ],
  GanttAxis: [['scale', 'range', 'today'], [], 'W92'],
  GanttRows: [['tasks', 'departmentNames', 'selectedId'], ['select'], 'W92'],
  GanttBars: [
    ['tasks', 'scale', 'range', 'today', 'selectedId', 'draggableIds'],
    ['select', 'edge-drag'],
    'W92',
  ],
  GanttLinks: [['links', 'tasks', 'scale', 'range'], [], 'W92'],
  TimelineHead: [
    ['taskCount', 'doneCount', 'overdueCount', 'approximate', 'canCreateTask'],
    ['showList', 'newTask'],
    'W93',
  ],
  TimelineToolbar: [
    [
      'status',
      'scale',
      'departments',
      'departmentId',
      'showDepartmentFilter',
      'fullscreen',
      'exportReady',
    ],
    [
      'update:status',
      'update:scale',
      'update:departmentId',
      'update:fullscreen',
      'exportPdf',
      'exportImage',
    ],
    'W93',
  ],
  RangeStrip: [['range', 'histogram', 'view', 'today', 'year'], ['seek'], 'W93'],
  TimelineLegend: [[], [], 'W93'],
  SelectedTaskPanel: [['task', 'face', 'departmentName'], ['close', 'openInList'], 'W94'],
  DateRequestForm: [
    ['open', 'workItemId', 'target', 'startOn', 'endOn'],
    ['update:open', 'sent'],
    'W94',
  ],
  DateChangeSnack: [
    ['face', 'title', 'before', 'after', 'remainingMs', 'totalMs'],
    ['cancel', 'dismiss'],
    'W95',
  ],
  SubtaskRows: [['workItemId', 'target', 'open'], [], 'W96'],
} as const

type Declared = {
  props?: Record<string, unknown> | string[]
  emits?: Record<string, unknown> | string[]
}

function names(option: Declared['props']): string[] {
  if (!option) return []
  return Array.isArray(option) ? option : Object.keys(option)
}

describe('zaman çizelgesi bileşen iskeleti (W91 → O2b)', () => {
  it('iskelet tam olarak sözleşmedeki on üç bileşeni dışa açar', () => {
    const exported = Object.keys(skeleton).filter((k) => /^[A-Z]/.test(k))
    expect(exported.sort()).toEqual(Object.keys(CONTRACT).sort())
  })

  it.each(Object.entries(CONTRACT))('%s: prop/emit bildirimi', (name, [props, emits, owner]) => {
    const component = skeleton[name as keyof typeof CONTRACT] as Declared
    const declaredProps = names(component.props)
    const declaredEmits = names(component.emits)
    for (const prop of props) expect(declaredProps, `${owner} ${name} prop`).toContain(prop)
    for (const emit of emits) expect(declaredEmits, `${owner} ${name} emit`).toContain(emit)
  })
})
