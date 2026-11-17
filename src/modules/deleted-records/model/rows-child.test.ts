import { describe, expect, it } from 'vitest'

import { agendaItem, file, meetingNote, record, subtask, taskNote } from '../__tests__/harness'
import {
  agendaItemRow,
  fileRow,
  meetingNoteRow,
  recordRow,
  sizeText,
  subtaskRow,
  taskNoteRow,
} from './rows-child'

describe('çocuk tür satırları (yalnız liste öğesinden)', () => {
  it('dosya: ad, görev kodu/başlığı, ebeveyn, panel alanları; boyut bayttan', () => {
    const row = fileRow(
      file('f1', { display_name: 'Rapor.pdf', work_item_code: 'OPE-3', size_bytes: 3072 }),
    )
    expect(row).toMatchObject({
      kind: 'files',
      rawKind: 'files',
      key: 'files:f1',
      title: 'Rapor.pdf',
      code: 'OPE-3',
      subLine: 'Saha pano montajı',
      departmentIds: ['d1'],
      task: null,
      fileCount: null,
      parent: { kind: 'tasks', id: 'w1', name: 'Saha pano montajı', deleted: false },
    })
    expect(row.facts.map((f) => f.label)).toEqual(['size', 'contentType', 'tag', 'uploader'])
    expect(row.facts[0]!.value).toBe('3 KB')
  })

  it('görev kodu ya da başlığı yoksa kimlik yazılmaz; ebeveyn adı null kalır', () => {
    const row = fileRow(
      file('f2', { work_item_code: null, work_item_title: null, parent_deleted: true }),
    )
    expect(row.code).toBeNull()
    expect(row.subLine).toBe('')
    expect(row.parent).toEqual({ kind: 'tasks', id: 'w1', name: null, deleted: true })
  })

  it('alt görev, görev notu, toplantı notu ve gündem doğru tür, anahtar ve ebeveynle eşlenir', () => {
    expect(subtaskRow(subtask('s1', { done: true }))).toMatchObject({
      kind: 'subtasks',
      key: 'subtasks:s1',
      parent: { kind: 'tasks' },
    })
    expect(subtaskRow(subtask('s1', { done: true })).facts).toContainEqual({
      label: 'done',
      value: 'yes',
    })
    expect(taskNoteRow(taskNote('n1'))).toMatchObject({
      kind: 'task_notes',
      key: 'task_notes:n1',
      title: 'Not n1',
    })
    const note = meetingNoteRow(meetingNote('m1', { converted_to_work_item_id: 'w3' }))
    expect(note).toMatchObject({ kind: 'meeting_notes', parent: { kind: 'meetings', id: 'm1' } })
    expect(note.facts).toContainEqual({ label: 'converted', value: 'yes' })
    expect(agendaItemRow(agendaItem('a1', { is_checked: true }))).toMatchObject({
      kind: 'agenda_items',
      facts: [{ label: 'checked', value: 'yes' }],
    })
  })

  it('boyut metni: bayt, KB, MB', () => {
    expect(sizeText(900)).toBe('900 B')
    expect(sizeText(2048)).toBe('2 KB')
    expect(sizeText(5 * 1024 * 1024 + 512 * 1024)).toBe('5,5 MB')
  })
})

describe('birleşik liste satırı', () => {
  it('yalnız dönen alanlar: görev gerçeği, sayı, ilerleme, atanan uydurulmaz', () => {
    const row = recordRow(record('tasks', 't1', { name: 'Motor', department_id: null }))
    expect(row).toMatchObject({
      kind: 'tasks',
      key: 'tasks:t1',
      title: 'Motor',
      task: null,
      fileCount: null,
      status: null,
      departmentIds: [],
      facts: [],
    })
  })

  it('ebeveyn: bilinen çoğul tür taşınır, bilinmeyen tür null; ad boşsa null (kimlik ad olmaz)', () => {
    const known = recordRow(
      record('files', 'f1', {
        parent: { kind: 'meetings', id: 'm1', name: 'Toplantı', deleted: true },
      }),
    )
    expect(known.parent).toEqual({ kind: 'meetings', id: 'm1', name: 'Toplantı', deleted: true })
    const odd = recordRow(
      record('files', 'f2', { parent: { kind: 'calendar', id: 'x', name: '', deleted: true } }),
    )
    expect(odd.parent).toEqual({ kind: null, id: 'x', name: null, deleted: true })
    expect(recordRow(record('files', 'f3', { parent: null })).parent).toBeNull()
  })

  it('bilinmeyen tür: kind null, rawKind ve anahtar ham; tarih ve silen boş olabilir', () => {
    const row = recordRow(record('calendar_events', 'c1', { deleted_at: null, deleted_by: null }))
    expect(row).toMatchObject({
      kind: null,
      rawKind: 'calendar_events',
      key: 'calendar_events:c1',
      deletedAt: null,
      actor: { accountId: null, name: '' },
    })
  })
})
