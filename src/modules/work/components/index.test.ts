import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import * as skeleton from './index'

const item = {
  work_item_id: 'w1',
  program_id: 'p1',
  department_id: 'd1',
  assignee_account_ids: [],
}
const subtask = { subtask_id: 's1', work_item_id: 'w1' }

// O2b sözleşmesi: ad → (zorunlu prop'lar, beklenen emit adları, sahibi W).
const CONTRACT = {
  WorkDetailPanel: [{ workItemId: 'w1' }, ['close'], 'W43'],
  SubtaskBlock: [{ item }, ['openSubtasks'], 'W44'],
  SubtaskTab: [{ item }, [], 'W44'],
  NewTaskDialog: [{ open: false }, ['update:open', 'created'], 'W45'],
  StatusMenu: [{ item }, ['transitioned', 'requestEvidence'], 'W45'],
  DeleteTaskAction: [{ item }, ['deleted'], 'W45'],
  FileUploadDialog: [{ open: false, item }, ['update:open', 'uploaded'], 'W46'],
  FilesTab: [{ item }, [], 'W46'],
  SubtaskFileSlot: [{ item, subtask }, [], 'W46'],
  NotesTab: [{ item }, [], 'W47'],
} as const

describe('görev bileşen iskeleti (W41 → O2b)', () => {
  it('iskelet tam olarak sözleşmedeki on bileşeni dışa açar', () => {
    const exported = Object.keys(skeleton).filter((k) => /^[A-Z]/.test(k))
    expect(exported.sort()).toEqual(Object.keys(CONTRACT).sort())
  })

  it.each(Object.entries(CONTRACT))('%s: prop/emit sözleşmesi', (name, [props, emits, owner]) => {
    const component = skeleton[name as keyof typeof CONTRACT]
    const wrapper = mount(component as never, { props: props as never })
    expect(wrapper.find(`[data-placeholder="${name}"]`).exists(), owner).toBe(true)
    const declared = (component as { props?: Record<string, unknown> }).props ?? {}
    for (const key of Object.keys(props)) expect(Object.keys(declared), name).toContain(key)
    const declaredEmits = (component as { emits?: string[] }).emits ?? []
    expect([...declaredEmits].sort(), name).toEqual([...emits].sort())
  })
})
