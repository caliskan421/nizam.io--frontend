import { describe, expect, it } from 'vitest'

import { OPERATIONS } from '@/shared/api/operations.gen'

import { DELETED_KINDS } from './kinds'
import {
  CHILD_KINDS,
  isChildKind,
  kindsParam,
  LIFECYCLE,
  LIFECYCLE_KINDS,
  lifecycleOf,
  needsProgram,
  toLifecycleKind,
} from './lifecycle'

const byId = new Map(
  Object.entries(OPERATIONS).map(([key, meta]) => [meta.operationId, [key, meta]]),
)

describe('yaşam döngüsü kaydı', () => {
  it('dokuz bilinen tür ve beş çocuk tür; sunucu `kinds` sözcükleri', () => {
    expect(LIFECYCLE_KINDS).toEqual([
      'tasks',
      'subtasks',
      'files',
      'meetings',
      'task_notes',
      'meeting_notes',
      'agenda_items',
      'departments',
      'accounts',
    ])
    expect(CHILD_KINDS).toEqual([
      'files',
      'subtasks',
      'task_notes',
      'meeting_notes',
      'agenda_items',
    ])
    expect(LIFECYCLE_KINDS.filter(isChildKind)).toHaveLength(5)
  })

  it('her işlem sözleşmede var; yol türün yol adıyla ve kapsam sınıfıyla uyuşur', () => {
    for (const kind of LIFECYCLE_KINDS) {
      const spec = LIFECYCLE[kind]
      for (const [action, id] of Object.entries(spec.operations)) {
        const found = byId.get(id)
        expect(found, `${kind}.${action}: ${id}`).toBeDefined()
        const [key, meta] = found as [string, { scope: string }]
        expect(key, id).toContain(spec.path)
        expect(meta.scope, id).toBe(spec.scope === 'account' ? 'S1' : 'S2')
      }
    }
  })

  it('yalnız hesap S1 (program başlığı yok)', () => {
    expect(LIFECYCLE_KINDS.filter((kind) => !needsProgram(kind))).toEqual(['accounts'])
  })

  it('mevcut dört ekran türü kayıt türüne bire bir eşlenir; çocuk türlerin ekran türü yok', () => {
    expect(DELETED_KINDS.map(lifecycleOf)).toEqual(['tasks', 'meetings', 'departments', 'accounts'])
    for (const kind of CHILD_KINDS) expect(LIFECYCLE[kind].view).toBeNull()
  })

  it('bilinmeyen (gelecek) tür `null`: yazma üretilmez', () => {
    expect(toLifecycleKind('files')).toBe('files')
    expect(toLifecycleKind('calendar_events')).toBeNull()
    expect(toLifecycleKind('')).toBeNull()
  })

  it('`kinds` parametresi: boş küme parametresiz, aksi virgüllü', () => {
    expect(kindsParam(undefined)).toBeUndefined()
    expect(kindsParam([])).toBeUndefined()
    expect(kindsParam(['task_notes', 'meeting_notes', 'agenda_items'])).toBe(
      'task_notes,meeting_notes,agenda_items',
    )
  })
})
