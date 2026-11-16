/**
 * 01f dönem sonu raporu önizlemesinin saf türetimleri (`ozellikler.md` §2.5, `README` (b)). Kaynak
 * yalnız `reportSeason` JSON'udur (`SeasonReport`); JSON'da olmayan değer (dosya boyutu, dönem
 * tarih aralığı, "ortalama kayma", sıra numarası …) HİÇ türetilmez, çağıran çizmez (§4).
 * Sunucu dağılımları (`task_status_distribution`, `priority_distribution`) kapalı şemadır (BE-133,
 * pin v0.23.0-api: beş durum, dört öncelik, sıfırlar dahil); eksik anahtar savunması yalnız
 * bölüm şeridinin görev sayımı içindir (`departmentSections`).
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

/**
 * Pin v0.23.0-api: `TaskStatusDistribution`/`TaskPriorityDistribution` kapalı şemadır (anahtar
 * kümesi sabit, `additionalProperties` yok); kaynak anahtarları satır anahtarlarıyla sınırlıdır.
 * Kısmi kaynak (bölüm şeridi sayımı) için eksik anahtar sıfır sayılır.
 */
export function distribution<K extends string>(
  keys: readonly K[],
  source: Readonly<Partial<Record<K, number>>>,
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
  /** Sıra numarası artan (BE-005); numarasız görevler `created_at` artan sonda. */
  tasks: ReportTask[]
}

/** Bölüm içi görev sırası: koordinatörlük sıra numarası (BE-005); yoksa oluşturulma anı. */
function bySequence(a: ReportTask, b: ReportTask): number {
  const left = a.sequence_no ?? Number.POSITIVE_INFINITY
  const right = b.sequence_no ?? Number.POSITIVE_INFINITY
  return left === right ? a.created_at.localeCompare(b.created_at) : left < right ? -1 : 1
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
      .sort(bySequence)
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

export interface SeasonTruncation {
  tasks: { shown: number; total: number } | null
  files: { shown: number; total: number } | null
}

/**
 * Kesme uyarısı (BE-132, pin v0.23.0-api): `limits` her yanıtta gelir; görev ya da dosya satırı
 * sınırda kesildiyse (5000 görev, 2000 dosya) "gösterilen N / toplam M". Kesme yoksa `null`
 * (uyarı çizilmez; sessiz eksik veri yok). Seçilmeyen bölümün toplamı 0'dır (kesme sayılmaz).
 */
export function truncation(season: SeasonReport): SeasonTruncation | null {
  const { limits } = season
  const tasks =
    limits.tasks_returned < limits.tasks_total
      ? { shown: limits.tasks_returned, total: limits.tasks_total }
      : null
  const files =
    limits.files_returned < limits.files_total
      ? { shown: limits.files_returned, total: limits.files_total }
      : null
  return tasks || files ? { tasks, files } : null
}

const pct = (part: number, whole: number): number => Math.round(share(part, whole) * 100) / 100

export interface WorkloadRow {
  id: string
  name: string
  active: number
  overdue: number
  completed: number
  total: number
  /** 0–100 dağılım çubuğu bölükleri (en büyük toplama göre): tamamlanan · aktif (zamanında) · geciken. */
  done: number
  ontime: number
  late: number
}

/**
 * İş yükü özeti (BE-134, `SeasonReport.workload_summary`): sunucu sırası korunur (aktif göreve göre
 * azalan). Aktif = açık görev (geciken dahil); zamanında aktif = aktif − geciken; toplam sunucudan.
 * Çubuk genişlikleri en büyük toplama göre (tasarım: ilk satır en uzun).
 */
export function workloadRows(season: SeasonReport): WorkloadRow[] {
  const max = season.workload_summary.reduce((m, r) => Math.max(m, r.total), 0)
  return season.workload_summary.map((r) => ({
    id: r.account_id,
    name: r.full_name,
    active: r.active,
    overdue: r.overdue,
    completed: r.completed,
    total: r.total,
    done: pct(r.completed, max),
    ontime: pct(Math.max(0, r.active - r.overdue), max),
    late: pct(r.overdue, max),
  }))
}
