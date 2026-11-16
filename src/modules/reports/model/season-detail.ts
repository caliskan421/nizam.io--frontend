/**
 * 01f koordinatörlük bölümü ayrıntı türetimleri (BE-136, pin v0.23.0-api): görev detay kartları
 * (`tasks[].detail`), toplantı kartları (`meetings[]`), dosya grupları (`files[]`). Kaynak yalnız
 * `reportSeason` JSON'udur; JSON'da olmayan alan türetilmez: görev notunda bayrak (acil/engel/soru/
 * bilgi) ve "paylaşılan" işareti YOKTUR (GAP-237) → çizilmez; kişiler yalnız ad-soyad; toplantıda
 * gündem metni ve katılımcı adı yoktur (yalnız sayaçlar). Sıralar sunucudandır (dosya: en yeni
 * önce; talep: en yeni önce; not: en yeni önce, ≤5) — dosya grupları etiketine göre gruplanır.
 */
import { formatBytes, formatDay, instantDate, instantDateTime, instantTime } from './format'
import { lateness, type DepartmentSection, type LatenessKind, type ReportTask } from './season-view'
import { taskLabel } from './gantt'
import type { SeasonReport } from './types'

type Detail = NonNullable<ReportTask['detail']>

export interface DetailRequest {
  from: string
  to: string
  status: 'pending' | 'approved' | 'rejected'
  by: string
  at: string
  reason: string | null
  reviewReason: string | null
}

export interface DetailCard {
  id: string
  label: string
  title: string
  status: string
  priority: ReportTask['priority']
  start: string
  end: string
  plan: string | null
  lateKind: LatenessKind
  lateDays: number
  assignees: string[]
  description: string
  dependencies: { label: string; title: string; status: string }[]
  noteCount: number
  notes: { no: string; at: string; author: string; content: string }[]
  requests: DetailRequest[]
  files: { name: string; meta: string }[]
}

const pad2 = (n: number): string => String(n).padStart(2, '0')

function hasContent(task: ReportTask, detail: Detail): boolean {
  return (
    detail.description.trim() !== '' ||
    detail.dependencies.length > 0 ||
    detail.recent_notes.length > 0 ||
    detail.date_requests.length > 0 ||
    task.file_count > 0
  )
}

/** Görev detay kartları: yalnız içeriği olan görevler (bölüm sırası = tablo sırası). */
export function detailCards(
  section: DepartmentSection,
  season: SeasonReport,
  timeZone: string,
): DetailCard[] {
  return section.tasks.flatMap((task) => {
    const detail = task.detail
    if (detail === null || !hasContent(task, detail)) return []
    const { kind, days } = lateness(task)
    const files = season.files
      .filter((f) => f.work_item_id === task.work_item_id)
      .map((f) => ({
        name: f.display_name,
        meta: [f.tag, formatBytes(f.size_bytes), f.uploaded_by.full_name]
          .filter((part): part is string => part !== null && part !== '')
          .join(' · '),
      }))
    return [
      {
        id: task.work_item_id,
        label: taskLabel(task),
        title: task.title,
        status: task.status,
        priority: task.priority,
        start: formatDay(task.start_on) ?? '',
        end: formatDay(task.end_on) ?? '',
        plan:
          task.planned_end_on && task.planned_end_on !== task.end_on
            ? formatDay(task.planned_end_on)
            : null,
        lateKind: kind,
        lateDays: days,
        assignees: task.assignees.map((a) => a.full_name),
        description: detail.description.trim(),
        dependencies: detail.dependencies.map((d) => ({
          label: d.code ?? d.title,
          title: d.title,
          status: d.status,
        })),
        noteCount: task.note_count,
        notes: detail.recent_notes.map((n, index) => ({
          no: pad2(index + 1),
          at: instantDateTime(n.created_at, timeZone) ?? '',
          author: n.author.full_name,
          content: n.content,
        })),
        requests: detail.date_requests.map((r) => ({
          from: formatDay(r.old_end_on) ?? '',
          to: formatDay(r.new_end_on) ?? '',
          status: r.status,
          by: r.requested_by.full_name,
          at: instantDate(r.created_at, timeZone) ?? '',
          reason: r.reason,
          reviewReason: r.review_reason,
        })),
        files,
      },
    ]
  })
}

export interface MeetingCard {
  id: string
  title: string
  date: string
  time: string
  agendaChecked: number
  agendaTotal: number
  participants: number
  notes: number
  converted: number
  /** Ortak toplantıda bu bölümün dışındaki koordinatörlükler (silinmiş işaretli). */
  others: { name: string; deleted: boolean }[]
}

/** Bölümün toplantıları (sunucu sırası: en yeni önce); bölüm sahip ya da dahil olabilir. */
export function meetingCards(
  departmentId: string,
  season: SeasonReport,
  timeZone: string,
): MeetingCard[] {
  return season.meetings
    .filter((m) => m.coordinatorships.some((c) => c.department_id === departmentId))
    .map((m) => ({
      id: m.meeting_id,
      title: m.title,
      date: instantDate(m.meeting_date, timeZone) ?? '',
      time: instantTime(m.meeting_date, timeZone) ?? '',
      agendaChecked: m.agenda_checked,
      agendaTotal: m.agenda_total,
      participants: m.participant_count,
      notes: m.note_count,
      converted: m.converted_note_count,
      others: m.coordinatorships
        .filter((c) => c.department_id !== departmentId)
        .map((c) => ({ name: c.name, deleted: c.deleted })),
    }))
}

export interface FileRow {
  id: string
  name: string
  taskLabel: string
  taskTitle: string
  by: string
  size: string
  date: string
}

export interface FileGroup {
  /** Etiket; etiketsiz dosyalar `null`. */
  tag: string | null
  count: number
  size: string
  rows: FileRow[]
}

/** Bölümün dosyaları etikete göre gruplu (etiket adına göre, etiketsiz sonda); satır sırası sunucunun. */
export function fileGroups(
  departmentId: string,
  season: SeasonReport,
  timeZone: string,
): FileGroup[] {
  const tasks = new Map(season.tasks.map((t) => [t.work_item_id, t]))
  const groups = new Map<string | null, { bytes: number; rows: FileRow[] }>()
  for (const file of season.files) {
    if (file.department_id !== departmentId) continue
    const group = groups.get(file.tag) ?? { bytes: 0, rows: [] }
    const task = tasks.get(file.work_item_id)
    group.bytes += file.size_bytes
    group.rows.push({
      id: file.file_id,
      name: file.display_name,
      taskLabel: task ? taskLabel(task) : '',
      taskTitle: task?.title ?? '',
      by: file.uploaded_by.full_name,
      size: formatBytes(file.size_bytes) ?? '',
      date: instantDate(file.created_at, timeZone) ?? '',
    })
    groups.set(file.tag, group)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b, 'tr')))
    .map(([tag, g]) => ({
      tag,
      count: g.rows.length,
      size: formatBytes(g.bytes) ?? '',
      rows: g.rows,
    }))
}
