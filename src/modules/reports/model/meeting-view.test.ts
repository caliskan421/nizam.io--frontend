import { describe, expect, it } from 'vitest'

import {
  agendaRows,
  convertedRows,
  coordinatorships,
  noteRows,
  participantNames,
} from './meeting-view'
import type { ReportMeetingDetail } from './types'

const detail = {
  agenda: [
    { title: 'Kazı', is_checked: true },
    { title: 'Beton', is_checked: false },
    { title: 'Teslim', is_checked: true },
  ],
  meeting: {
    coordinatorships: [
      { department_id: 'd2', name: 'Elektrik', deleted: true },
      { department_id: 'd1', name: 'Altyapı', deleted: false },
      { department_id: 'd3', name: 'Ağ', deleted: false },
    ],
    created_by: { account_id: 'a', full_name: 'Ali' },
    created_by_role: 'admin',
    meeting_date: '2026-10-14T11:00:00Z',
    meeting_id: 'm1',
    members_included: true,
    note_count: 3,
    owner_department_id: 'd1',
    participant_count: 2,
    participants: [{ account_id: 'p', full_name: 'Yedek Ad' }],
    title: 'Haftalık',
  },
  notes: [
    {
      note_id: 'n2',
      content: 'ikinci',
      created_at: '2026-10-14T12:30:00Z',
      converted_to_task_id: 't1',
      converted_task_title: 'Kablo kanalı',
      author: { account_id: 'a', full_name: 'Ali' },
      author_role: 'admin',
    },
    {
      note_id: 'n1',
      content: 'birinci',
      created_at: '2026-10-14T11:05:00Z',
      converted_to_task_id: null,
      converted_task_title: null,
      author: { account_id: 'a', full_name: 'Ali' },
      author_role: '',
    },
  ],
  participants: [
    { account_id: 'p1', full_name: 'Bahar', role: 'x' },
    { account_id: 'p2', full_name: 'Kadir', role: 'y' },
  ],
} as unknown as ReportMeetingDetail

describe('toplantı raporu türetimleri', () => {
  it('gündem: sıra 01…, işaretli sayısı', () => {
    const { rows, checked } = agendaRows(detail)
    expect(rows.map((r) => r.no)).toEqual(['01', '02', '03'])
    expect(checked).toBe(2)
    expect(agendaRows({ ...detail, agenda: [] }).rows).toEqual([])
  })

  it('notlar created_at artan, saat kurulum diliminde; dönüştürülenler ayrı', () => {
    const notes = noteRows(detail, 'Europe/Istanbul')
    expect(notes.map((n) => [n.no, n.time, n.content])).toEqual([
      ['01', '14:05', 'birinci'],
      ['02', '15:30', 'ikinci'],
    ])
    const converted = convertedRows(notes)
    expect(converted).toHaveLength(1)
    expect(converted[0]).toMatchObject({ no: '02', taskTitle: 'Kablo kanalı' })
    expect(convertedRows(noteRows({ ...detail, notes: [] }, 'UTC'))).toEqual([])
  })

  it('koordinatörlükler: sahip önce, sonra Türkçe ada göre; silinmiş işareti korunur', () => {
    const list = coordinatorships(detail)
    expect(list.map((c) => c.id)).toEqual(['d1', 'd3', 'd2'])
    expect(list[0]!.owner).toBe(true)
    expect(list[2]!.deleted).toBe(true)
  })

  it('katılımcılar: ayrıntı listesi; boşsa toplantı satırı', () => {
    expect(participantNames(detail)).toEqual(['Bahar', 'Kadir'])
    expect(participantNames({ ...detail, participants: [] })).toEqual(['Yedek Ad'])
  })
})
