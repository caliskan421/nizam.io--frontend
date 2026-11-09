import { describe, expect, it } from 'vitest'

import * as skeleton from './index'

// O2b sözleşmesi: ad → (bildirilmesi gereken prop'lar, emit adları, sahibi W). Bileşen
// BAĞLANMAZ (dolu gövdeler Pinia / TanStack Query ister): yalnız derlenmiş seçenek nesnesindeki
// `props` / `emits` bildirimleri denetlenir; yer tutucu ya da dolu gövdeyle aynı sonuç.
const CONTRACT = {
  WorkDetailPanel: [['workItemId', 'initialTab'], ['close'], 'W43'],
  SubtaskBlock: [['item'], ['openSubtasks'], 'W44'],
  SubtaskTab: [['item'], [], 'W44'],
  NewTaskDialog: [['open', 'departmentId'], ['update:open', 'created'], 'W45'],
  StatusMenu: [['item'], ['transitioned', 'requestEvidence'], 'W45'],
  DeleteTaskAction: [['item'], ['deleted'], 'W45'],
  FileUploadDialog: [['open', 'item', 'subtaskId'], ['update:open', 'uploaded'], 'W46'],
  FilesTab: [['item'], [], 'W46'],
  SubtaskFileSlot: [['item', 'subtask'], [], 'W46'],
  NotesTab: [['item'], [], 'W47'],
} as const

type Declared = {
  props?: Record<string, unknown> | string[]
  emits?: Record<string, unknown> | string[]
}

function names(option: Declared['props']): string[] {
  if (!option) return []
  return Array.isArray(option) ? option : Object.keys(option)
}

describe('görev bileşen iskeleti (W41 → O2b)', () => {
  it('iskelet tam olarak sözleşmedeki on bileşeni dışa açar', () => {
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
