/**
 * 01f dönem sonu raporu önizlemesinin saf türetimleri (`ozellikler.md` §2.5, `README` (b)). Kaynak
 * yalnız `reportSeason` JSON'udur (`SeasonReport`); JSON'da olmayan değer (dosya boyutu, dönem
 * tarih aralığı, "ortalama kayma", sıra numarası …) HİÇ türetilmez, çağıran çizmez (§4).
 * Eksik anahtar sıfır sayılır (savunma: `task_status_distribution` beş anahtarı daima doldurur).
 */
import { formatShortDay, share } from './format'
import type { SeasonReport } from './types'

export type ReportTask = SeasonReport['tasks'][number]

/** Görev durumları (sözleşme sırası; tasarım etiketleri `reports.season.paper.status.*`). */
export const SEASON_STATUSES = [
  'baslanmadi',
  'devam_ediyor',
  'onaya_sunuldu',
  'iade_edildi',
  'tamamlandi',
] as const
export type SeasonStatus = (typeof SEASON_STATUSES)[number]

/** Öncelikler: tasarım sırası Acil → Düşük. */
export const SEASON_PRIORITIES = ['acil', 'yuksek', 'orta', 'dusuk'] as const
export type SeasonPriority = (typeof SEASON_PRIORITIES)[number]

export interface TaskTotals {
  total: number
  completed: number
  open: number
  overdue: number
  lateCompleted: number
  earlyCompleted: number
  onTimeCompleted: number
}

/** Görev kümesinden sayımlar (geç/erken/zamanında `ReportTask` bayraklarından; gün istemcide hesaplanmaz). */
export function taskTotals(tasks: readonly ReportTask[]): TaskTotals {
  const completed = tasks.filter((t) => t.status === 'tamamlandi')
  const late = completed.filter((t) => t.is_completed_late).length
  const early = completed.filter((t) => t.is_completed_early && !t.is_completed_late).length
  return {
    total: tasks.length,
    completed: completed.length,
    open: tasks.length - completed.length,
    overdue: tasks.filter((t) => t.is_overdue).length,
    lateCompleted: late,
    earlyCompleted: early,
    onTimeCompleted: completed.length - late - early,
  }
}

export interface DistributionRow<K extends string> {
  key: K
  count: number
  /** 0–100 çubuk genişliği. */
  width: number
}

export function distribution<K extends string>(
  keys: readonly K[],
  source: Readonly<Record<string, number>>,
): { rows: DistributionRow<K>[]; total: number } {
  const total = keys.reduce((sum, key) => sum + (source[key] ?? 0), 0)
  return {
    total,
    rows: keys.map((key) => ({
      key,
      count: source[key] ?? 0,
      width: share(source[key] ?? 0, total),
    })),
  }
}

export type LatenessKind = 'overdue' | 'late' | 'early' | 'ontime' | 'none'

/** Gecikme hücresi: "N gün gecikti" / "N gün geç bitti" / "N gün erken" / "Zamanında" / yok. */
export function lateness(task: ReportTask): { kind: LatenessKind; days: number } {
  if (task.status !== 'tamamlandi') {
    return task.is_overdue
      ? { kind: 'overdue', days: task.days_overdue }
      : { kind: 'none', days: 0 }
  }
  if (task.is_completed_late) return { kind: 'late', days: task.days_late }
  if (task.is_completed_early) return { kind: 'early', days: task.days_early }
  return { kind: 'ontime', days: 0 }
}

/** Tarih hücresi: "başlangıç → bitiş" (gg.aa) ve bitiş farklıysa "plan gg.aa". */
export function taskDates(task: ReportTask): { start: string; end: string; plan: string | null } {
  const plan =
    task.planned_end_on && task.planned_end_on !== task.end_on
      ? formatShortDay(task.planned_end_on)
      : null
  return {
    start: formatShortDay(task.start_on) ?? '',
    end: formatShortDay(task.end_on) ?? '',
    plan,
  }
}

export interface DepartmentSection {
  id: string
  name: string
  code: string | null
  description: string
  coordinators: string[]
  memberCount: number
  meetingCount: number
  totals: TaskTotals
  /** Durum şeridi: bölümün görevlerinden beş durum. */
  strip: DistributionRow<SeasonStatus>[]
  /** `created_at` artan (sıra numarası alanı yok, BE-005). */
  tasks: ReportTask[]
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'tr')

/** Koordinatörlük bölümleri: ada göre; her bölümün görevleri `department_id` ile bölünür. */
export function departmentSections(
  season: SeasonReport,
  codeOf: (departmentId: string) => string | null,
): DepartmentSection[] {
  return [...season.coordinatorship_performance].sort(byName).map((stat) => {
    const tasks = season.tasks
      .filter((t) => t.department_id === stat.department_id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
    const counts: Record<string, number> = {}
    for (const task of tasks) counts[task.status] = (counts[task.status] ?? 0) + 1
    return {
      id: stat.department_id,
      name: stat.name,
      code: codeOf(stat.department_id),
      description: stat.description ?? '',
      coordinators: stat.coordinators.map((c) => c.full_name),
      memberCount: stat.member_count,
      meetingCount: stat.meeting_count,
      totals: {
        ...taskTotals(tasks),
        total: stat.total_tasks,
        completed: stat.completed_tasks,
        overdue: stat.overdue_tasks,
      },
      strip: distribution(SEASON_STATUSES, counts).rows,
      tasks,
    }
  })
}

export interface ActivityRow {
  month: string
  count: number
  /** 0–100 sütun yüksekliği (en yüksek aya göre). */
  height: number
}

/** Aylık aktivite: yalnız gerçek seri (ay artan); toplam ve en yüksek ay. */
export function activity(season: SeasonReport): {
  rows: ActivityRow[]
  total: number
  peak: ActivityRow | null
  max: number
} {
  const sorted = [...season.monthly_activity].sort((a, b) => a.month.localeCompare(b.month))
  const max = sorted.reduce((m, row) => Math.max(m, row.count), 0)
  const rows = sorted.map((r) => ({ month: r.month, count: r.count, height: share(r.count, max) }))
  const peak = rows.reduce<ActivityRow | null>(
    (best, row) => (best === null || row.count > best.count ? row : best),
    null,
  )
  return { rows, total: rows.reduce((sum, r) => sum + r.count, 0), peak, max }
}
