/**
 * 01g toplantı raporu önizlemesinin saf türetimleri (`README` (c), E-13-46…53). Kaynak yalnız
 * `reportMeetingDetail`'dır. Bitiş saati alanı YOKTUR (yalnız `meeting_date`); not yazarı çizilmez
 * (tasarımda yok); görev kodu gizli (BE-005), görev başlığı `converted_task_title`; dönüştürülen
 * notun durum sütunu gizli (alan yok, BE-125). Silinmiş birim "(silinmiş)" etiketini taşır.
 */
import { instantTime } from './format'
import type { ReportMeetingDetail } from './types'

export interface MeetingAgendaRow {
  no: string
  title: string
  checked: boolean
}

export interface MeetingNoteRow {
  id: string
  no: string
  time: string
  content: string
  converted: boolean
  taskTitle: string | null
}

export interface MeetingCoordinatorship {
  id: string
  name: string
  deleted: boolean
  owner: boolean
}

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Gündem: sıra "01…", işaretli sayısı. */
export function agendaRows(detail: ReportMeetingDetail): {
  rows: MeetingAgendaRow[]
  checked: number
} {
  const rows = detail.agenda.map((item, index) => ({
    no: pad2(index + 1),
    title: item.title,
    checked: item.is_checked,
  }))
  return { rows, checked: rows.filter((r) => r.checked).length }
}

/** Notlar: `created_at` artan; "Not NN · SS:DD" için sıra ve kurulum saat diliminde saat. */
export function noteRows(detail: ReportMeetingDetail, timeZone: string): MeetingNoteRow[] {
  return [...detail.notes]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((note, index) => ({
      id: note.note_id,
      no: pad2(index + 1),
      time: instantTime(note.created_at, timeZone) ?? '',
      content: note.content,
      converted: note.converted_to_task_id !== null,
      taskTitle: note.converted_task_title,
    }))
}

/** "Göreve dönüştürülenler" tablosu satırları (dönüştürülen not yoksa boş → tablo çizilmez). */
export function convertedRows(notes: readonly MeetingNoteRow[]): MeetingNoteRow[] {
  return notes.filter((n) => n.converted)
}

/** Koordinatörlükler: sahip önce, sonra ada göre. */
export function coordinatorships(detail: ReportMeetingDetail): MeetingCoordinatorship[] {
  const owner = detail.meeting.owner_department_id
  return detail.meeting.coordinatorships
    .map((c) => ({
      id: c.department_id,
      name: c.name,
      deleted: c.deleted,
      owner: c.department_id === owner,
    }))
    .sort((a, b) => Number(b.owner) - Number(a.owner) || a.name.localeCompare(b.name, 'tr'))
}

/** Katılımcı adları: ayrıntı listesi; boşsa toplantı satırındaki liste. */
export function participantNames(detail: ReportMeetingDetail): string[] {
  const named = detail.participants.length > 0 ? detail.participants : detail.meeting.participants
  return named.map((p) => p.full_name)
}
