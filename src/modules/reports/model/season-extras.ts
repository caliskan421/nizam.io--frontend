/**
 * Dönem raporu önizlemesinin ek türetimleri (BE-132 kesme uyarısı, BE-134 iş yükü özeti; pin
 * v0.23.0-api). Kaynak yalnız `reportSeason` JSON'udur; JSON'da olmayan değer türetilmez (§4).
 */
import { share } from './format'
import type { SeasonReport } from './types'

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

/** Onaylı taleplerde ortalama kayma (gün, bir ondalık, Türkçe ondalık virgülü); yoksa `null`. */
export function shiftDays(season: SeasonReport): string | null {
  const days = season.date_change_stats.average_shift_days
  if (days === null) return null
  return days.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export interface TopRequestedRow {
  id: string
  code: string | null
  title: string
  count: number
}

/** "En çok talep alan görevler" (≤5, sunucu sırası: çok talep önce). */
export function topRequested(season: SeasonReport): TopRequestedRow[] {
  return season.date_change_stats.top_requested_tasks.map((r) => ({
    id: r.work_item_id,
    code: r.code,
    title: r.title,
    count: r.count,
  }))
}

/**
 * Aylık aktivitenin `count` dışında kalan serilerinin dönem toplamları (BE-136): not, dosya, tarih
 * talebi. `count` bunları İÇERMEZ (`created + completed + meetings + messages`); toplamlar dipnotta
 * ayrı söylenir. Hepsi 0 ise `null` (dipnot çizilmez).
 */
export function activityExtras(
  season: SeasonReport,
): { notes: number; files: number; requests: number } | null {
  const sum = (pick: (m: SeasonReport['monthly_activity'][number]) => number): number =>
    season.monthly_activity.reduce((total, m) => total + pick(m), 0)
  const extras = {
    notes: sum((m) => m.notes),
    files: sum((m) => m.files),
    requests: sum((m) => m.date_requests),
  }
  return extras.notes + extras.files + extras.requests > 0 ? extras : null
}
