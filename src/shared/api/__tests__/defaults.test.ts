import { describe, expect, it } from 'vitest'

import {
  makeArchiveFolder,
  makeChatHistory,
  makeChatLastMessage,
  makeChatList,
  makeChatMember,
  makeChatMessage,
  makeChatMessageQuote,
  makeChatSummary,
  makeNotification,
  makeNotificationList,
  makeNotificationUnreadCount,
  makePoll,
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

describe('pin v0.25.0-api varsayılan üreticileri (sohbet + bildirim)', () => {
  it('sohbet: zorunlu v0.25 alanları gelir, verilen alan ezer, isteğe bağlılar verilmez', () => {
    const summary = makeChatSummary({ unread_count: 3 })
    expect(summary).toMatchObject({
      read_seq: 0,
      first_unread_seq: null,
      peer_read_seq: null,
      notify_level: 'all',
      unread_count: 3,
    })
    expect(makeChatLastMessage()).toMatchObject({ kind: 'text', attachment_count: 0 })
    expect(makeChatList({ items: [summary] }).total).toBe(1)
    expect(makeChatMessageQuote().seq).toBe(1)
    expect(makeChatHistory()).toMatchObject({ read_seq: 0, first_unread_seq: null })
    expect(makeChatMember().program_role).toEqual({ department_ids: [], role: 'member' })
    expect(makePoll()).toMatchObject({ anonymous: false, results: [] })
    const message = makeChatMessage({ seq: 4 })
    expect(message).toMatchObject({ forwarded_from: null, message_id: 'm4', poll: null })
    expect(message).not.toHaveProperty('sender_role')
    expect(message).not.toHaveProperty('read_by_all')
    expect(summary).not.toHaveProperty('sender_role')
  })

  it('bildirim: nullable zorunlu alanlar boş, sayaçlar sıfır', () => {
    expect(makeNotification()).toMatchObject({
      actor: null,
      detail: null,
      action: null,
      group: null,
      muted: false,
      program_id: null,
      department_id: null,
      subject: { state: 'unknown', title: null },
    })
    expect(makeNotificationList()).toEqual({ awaiting_count: 0, items: [], unread_count: 0 })
    expect(makeNotificationUnreadCount({ count: 2 })).toEqual({ awaiting_count: 0, count: 2 })
  })
})
