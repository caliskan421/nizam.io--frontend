import type { RouteLocationRaw } from 'vue-router'

import type { components } from '@/shared/api/schema'
import type { ScopeSnapshot } from '@/shared/scope/scope'

export type Calendar = components['schemas']['Calendar']
export type Milestone = components['schemas']['ProgramMilestone']
export type MilestoneCreate = components['schemas']['CreateProgramMilestoneRequest']
export type MilestoneUpdate = components['schemas']['UpdateProgramMilestoneRequest']
export type DateRange = Calendar['range']
export type Kind = 'meeting' | 'date_request' | 'table_record' | 'task' | 'season'
export type TaskMode = 'end' | 'start' | 'ongoing'

export const KINDS = {
  meeting: 'Toplantılar',
  date_request: 'Tarih talepleri',
  table_record: 'Tablo kayıtları',
  task: 'Görevler',
  season: 'Sezon',
} satisfies Record<Kind, string>

export const KIND_COUNT_LABELS = {
  meeting: 'toplantı',
  date_request: 'tarih talebi',
  table_record: 'tablo kaydı',
  task: 'görev',
  season: 'kilometre taşı',
} satisfies Record<Kind, string>

export const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const date = (day: string) => new Date(day + 'T00:00:00Z')
const iso = (value: Date) => value.toISOString().slice(0, 10)

export function installationDay(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at)
  const byType = (type: string) => parts.find((part) => part.type === type)?.value
  return [byType('year'), byType('month'), byType('day')].join('-')
}

export function formatDay(day: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('tr-TR', { ...opts, timeZone: 'UTC' }).format(date(day))
}

export function relativeDay(day: string, today: string) {
  const distance = (date(day).getTime() - date(today).getTime()) / 86_400_000
  return new Intl.RelativeTimeFormat('tr', { numeric: 'auto' }).format(distance, 'day')
}

export function shiftDay(day: string, offset: number): string {
  const base = date(day)
  base.setUTCDate(base.getUTCDate() + offset)
  return iso(base)
}

export function shiftMonth(day: string, offset: number): string {
  const base = date(day.slice(0, 7) + '-01')
  base.setUTCMonth(base.getUTCMonth() + offset)
  return iso(base)
}

export function weekDays(day: string): string[] {
  const start = shiftDay(day, -((date(day).getUTCDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => shiftDay(start, i))
}

export function monthDays(month: string): string[][] {
  const firstWeek = weekDays(shiftMonth(month, 0))
  const last = shiftDay(shiftMonth(month, 1), -1)
  const weeks: string[][] = [firstWeek]
  while (weeks.at(-1)![6]! < last) {
    weeks.push(weekDays(shiftDay(weeks.at(-1)![6]!, 1)))
  }
  return weeks
}

export function isDay(day: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(date(day).getTime()) &&
    iso(date(day)) === day
  )
}

export interface CalendarEvent {
  key: string
  kind: Kind
  day: string
  title: string
  label?: string
  detail?: string
  navigationHint?: string
  live?: boolean
  late?: boolean
  to?: RouteLocationRaw
  table?: { name: string; column: string; outsideUnit: boolean }
  taskMode?: TaskMode
  done?: boolean
}

function taskLink(
  id: string,
  departmentId: string | undefined,
  scope: ScopeSnapshot,
): RouteLocationRaw | undefined {
  if (departmentId && scope.lens === 'admin') {
    return { name: 'work.tasks', query: { gorev: id, koordinatorluk: departmentId } }
  }
  if (departmentId && departmentId !== scope.departmentId) return undefined
  return { name: 'work.tasks', query: { gorev: id } }
}

function taskEvent(
  task: Calendar['tasks'][number],
  day: string,
  mode: TaskMode,
  scope: ScopeSnapshot,
): CalendarEvent {
  const status = {
    baslanmadi: 'Başlanmadı',
    devam_ediyor: 'Devam ediyor',
    onaya_sunuldu: 'Onaya sunuldu',
    iade_edildi: 'İade edildi',
    tamamlandi: 'Tamamlandı',
  }
  const label = status[task.status as keyof typeof status]
  const to = taskLink(task.id, task.department.id, scope)
  return {
    key: task.id + ':' + mode,
    kind: 'task',
    day,
    title: task.title,
    label: task.code,
    detail: [
      task.department.name,
      label,
      task.overdue && task.late_days > 0 ? task.late_days + ' gün gecikti' : '',
      task.assignees.map((person) => person.full_name).join(', '),
    ]
      .filter(Boolean)
      .join(' · '),
    taskMode: mode,
    late: task.overdue,
    done: task.status === 'tamamlandi',
    to,
    navigationHint: !to ? 'Görevi açmak için ilgili koordinatörlüğü seçin.' : undefined,
  }
}

type RegisterEvent = (event: CalendarEvent) => void

function registerScheduled(result: Calendar, scope: ScopeSnapshot, register: RegisterEvent) {
  for (const m of result.season.milestones) {
    register({ key: m.id, kind: 'season', day: m.on, title: m.name })
  }
  for (const m of result.meetings) {
    register({
      key: m.id,
      kind: 'meeting',
      day: m.local_date,
      title: m.title,
      label: m.local_time,
      detail: [
        ...m.departments.map((dep) => dep.name),
        m.participant_count + ' katılımcı',
        m.agenda_count + ' gündem',
      ].join(' · '),
      live: m.live,
      to: { name: 'collaboration.meeting', params: { meetingId: m.id } },
    })
  }
  const departments = new Map(result.tasks.map((task) => [task.id, task.department.id]))
  for (const r of result.date_requests) {
    const to = taskLink(r.work_item.id, departments.get(r.work_item.id), scope)
    register({
      key: r.id,
      kind: 'date_request',
      day: r.new_end_on,
      title: r.work_item.title,
      label: r.work_item.code,
      detail:
        r.requested_by.full_name +
        ' · Bitiş ' +
        r.current_end_on +
        ' → ' +
        r.new_end_on +
        ' · Karar bekliyor',
      to,
      navigationHint: !to ? 'Görevi açmak için ilgili koordinatörlüğü seçin.' : undefined,
    })
  }
}

function registerTables(result: Calendar, departmentId: string | null, register: RegisterEvent) {
  for (const r of result.table_records ?? []) {
    const unit = r.space === 'coordinatorship'
    const outsideUnit = unit && (!departmentId || r.department_id !== departmentId)
    register({
      key: [r.table_id, r.column_id, r.row_id].join(':'),
      kind: 'table_record',
      day: r.on,
      title: r.row_label,
      detail: r.fields
        .map((f) => {
          const value =
            typeof f.value === 'boolean' ? (f.value ? 'Evet' : 'Hayır') : f.labels?.join(', ')
          return value ? f.name + ': ' + value : ''
        })
        .filter(Boolean)
        .join(' · '),
      table: { name: r.table_name, column: r.column_name, outsideUnit },
      to: outsideUnit
        ? undefined
        : {
            name: 'tables.detail',
            params: { tableId: r.table_id },
            query: unit ? { alan: 'birim' } : {},
          },
    })
  }
}

function registerTasks(result: Calendar, scope: ScopeSnapshot, register: RegisterEvent) {
  for (const task of result.tasks) {
    register(taskEvent(task, task.end_on, 'end', scope))
    if (task.start_on) register(taskEvent(task, task.start_on, 'start', scope))
    if (task.status === 'tamamlandi' || !task.start_on || !task.end_on) continue
    let day = shiftDay(task.start_on, 1)
    if (day < result.range.from) day = result.range.from
    while (day < task.end_on && day <= result.range.to) {
      register(taskEvent(task, day, 'ongoing', scope))
      day = shiftDay(day, 1)
    }
  }
}

export function eventIndex(result: Calendar | undefined, scope: ScopeSnapshot) {
  const days = new Map<string, CalendarEvent[]>()
  const register = (event: CalendarEvent) => {
    const existing = days.get(event.day)
    if (existing) existing.push(event)
    else days.set(event.day, [event])
  }
  if (!result) return days
  registerScheduled(result, scope, register)
  registerTables(result, scope.departmentId, register)
  registerTasks(result, scope, register)
  return days
}

export function resultTruncated(result?: Calendar) {
  return Boolean(
    result &&
    (result.tasks_truncated ||
      result.meetings_truncated ||
      result.date_requests_truncated ||
      result.table_records_truncated),
  )
}
