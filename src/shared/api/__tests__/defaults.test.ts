import { describe, expect, it } from 'vitest'

import {
  makeArchiveFolder,
  makeFileRecord,
  makeMeetingNoteCounts,
  makeMyDepartment,
  makeSeasonLimits,
  makeTaskCounters,
  makeTaskPriorityDistribution,
  makeTaskStatusDistribution,
  NEW_WORK_ITEM_FIELDS,
  withDeletedAccountDefaults,
  withDeletedTaskDefaults,
  withFileDefaults,
  withMeetingDefaults,
  withNoteListDefaults,
  withReportTaskDefaults,
  withSeasonReportDefaults,
  withWorkItemDefaults,
} from './defaults'

describe('pin v0.23.0-api varsayılan üreticileri (KESİN 36)', () => {
  it('verilen alan varsayılanı ezer; eksik alan varsayılan değeri alır', () => {
    const item = withWorkItemDefaults({ code: 'MEK-1', file_count: 3, title: 'x' })
    expect(item).toMatchObject({ code: 'MEK-1', file_count: 3, title: 'x', sequence_no: 1 })
    expect(Object.keys(NEW_WORK_ITEM_FIELDS).sort()).toEqual(
      [
        'code',
        'extended_days_total',
        'extension_count',
        'file_count',
        'has_pending_dependency',
        'last_return',
        'pending_dependency_count',
        'sequence_no',
        'submitted_at',
        'submitted_by',
      ].sort(),
    )
  })

  it('çağrı başına yeni nesne döner (paylaşılan değişken dizi/nesne yok)', () => {
    expect(makeMyDepartment({ role: 'uye' }).coordinators).not.toBe(
      makeMyDepartment({ role: 'uye' }).coordinators,
    )
    expect(withDeletedTaskDefaults({}).assignees).not.toBe(withDeletedTaskDefaults({}).assignees)
    expect(withDeletedTaskDefaults({}).subtask_counts).not.toBe(
      withDeletedTaskDefaults({}).subtask_counts,
    )
    expect(withNoteListDefaults({}).counts).not.toBe(withNoteListDefaults({}).counts)
    expect(withSeasonReportDefaults({}).meetings).not.toBe(withSeasonReportDefaults({}).meetings)
  })

  it('değerler "alan yok" anlamındadır: null / 0 / false / boş dizi (UI göstermez)', () => {
    expect(makeTaskStatusDistribution()).toEqual({
      baslanmadi: 0,
      devam_ediyor: 0,
      onaya_sunuldu: 0,
      iade_edildi: 0,
      tamamlandi: 0,
    })
    expect(makeTaskPriorityDistribution()).toEqual({ acil: 0, yuksek: 0, orta: 0, dusuk: 0 })
    expect(makeTaskCounters().total).toBe(0)
    expect(makeMeetingNoteCounts()).toEqual({ all: 0, converted: 0, mine: 0 })
    expect(makeArchiveFolder()).toMatchObject({
      task_count: 0,
      total_bytes: 0,
      last_uploaded_at: null,
    })
    expect(makeSeasonLimits().notes_per_task).toBe(5)
    expect(withMeetingDefaults({}).created_by_full_name).toBeNull()
    expect(withDeletedAccountDefaults({})).toMatchObject({ company_admin: false, teams: [] })
    expect(withReportTaskDefaults({})).toMatchObject({ code: null, detail: null, file_bytes: 0 })
    expect(withFileDefaults({ uploaded_by_full_name: 'Ayşe' }).uploaded_by_full_name).toBe('Ayşe')
    expect(makeFileRecord({ tag: 'plan' }).tag).toBe('plan')
  })
})
