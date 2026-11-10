/**
 * KPI şeridi (01 E-01-03…07) — saf türetim. İki kaynak, tek görünüm:
 *
 *  - **Admin** (yalnız şirket yöneticisi + Admin merceği, REPORTING-K01): `reportDashboard`
 *    sunucu sayaçları — `total_tasks`, `completed_tasks`, `active_tasks` (total − completed;
 *    `onaya_sunuldu` + `iade_edildi` dahil), `overdue_tasks`, `pending_approvals` (GAP-075).
 *  - **Koordinatör / Üye**: `countProgramWorkItems` sunucu sayaçları (BE-003, BE-009; pin
 *    v0.15.0-api) — seçili birim, Üye merceğinde `assignee_account_id` = ben (BE-038; görev
 *    listesiyle AYNI süzgeç ve görünürlük). Kesin sayılar: istemci sayımı ve "yüklenen kayıtlar
 *    içinde" etiketi yok. `overdue` sunucuda tamamlanmamış + `end_on` < bugün (G3).
 *
 * Türetme (backend.md §4): Tamamlanma % = biten/toplam; açık = toplam − biten; zamanında =
 * açık − geciken; Gecikmede % = geciken/açık; Onay çubuğu = onayda/açık. Yüzdeler tam sayıya
 * yuvarlanır; payda 0 iken nötr not ("0 görevin 0’ı" yazılmaz, §4). "Onay bekleyen" notu
 * öneri olduğundan boştur (E-01-07).
 */
import type { WorkItemCounts } from '@/modules/work/public'
import type { IconName } from '@/shared/ui'

import { homeText } from './messages'
import { possessiveSuffix } from './turkish'
import type { DashboardReport } from './types'

export interface KpiCounts {
  total: number
  completed: number
  open: number
  overdue: number
  pending: number
}

export type KpiKey = 'completion' | 'open' | 'overdue' | 'pending'
export type KpiTone = 'accent' | 'violet' | 'danger' | 'gold'
/** 03 `durum` süzgeci (katalog `work.tasks.query.durum`); `null` = süzgeçsiz. */
export type KpiStatusFilter = 'tamamlandi' | 'geciken' | 'onaya_sunuldu' | null

export interface KpiCard {
  key: KpiKey
  label: string
  value: string
  /** Alt not; `null` → satır çizilmez (E-01-07). */
  note: string | null
  /** Çubuk doluluğu, 0–100. */
  bar: number
  tone: KpiTone
  icon: IconName
  /** Sayı `--danger` (E-01-06). */
  danger: boolean
  /** Tıklama hedefi 03 süzgeci. */
  status: KpiStatusFilter
}

/** Admin: sunucu sayaçları (kesin). */
export function countsFromDashboard(report: DashboardReport): KpiCounts {
  return {
    total: report.total_tasks,
    completed: report.completed_tasks,
    open: report.active_tasks,
    overdue: report.overdue_tasks,
    pending: report.pending_approvals,
  }
}

/**
 * K/Ü: `countProgramWorkItems` sayaçları. Açık = toplam − tamamlanan (`onaya_sunuldu` +
 * `iade_edildi` dahil); onayda = `onaya_sunuldu`; geciken sunucunun `overdue`'su.
 */
export function countsFromWorkCounts(counts: WorkItemCounts): KpiCounts {
  const completed = counts.by_status.tamamlandi
  return {
    total: counts.total,
    completed,
    open: counts.total - completed,
    overdue: counts.overdue,
    pending: counts.by_status.onaya_sunuldu,
  }
}

/** Yuvarlanmış yüzde; payda 0 → 0. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)))
}

const number = new Intl.NumberFormat('tr-TR')
const fmt = (n: number) => number.format(n)

function completionCard(c: KpiCounts): KpiCard {
  const p = percent(c.completed, c.total)
  const note =
    c.total === 0
      ? homeText('home.kpi.noTasks')
      : homeText('home.kpi.completionNote', {
          total: fmt(c.total),
          done: fmt(c.completed),
          suffix: possessiveSuffix(c.completed),
        })
  return {
    key: 'completion',
    label: homeText('home.kpi.completion'),
    value: homeText('home.kpi.completionValue', { p }),
    note,
    bar: p,
    tone: 'accent',
    icon: 'check',
    danger: false,
    status: 'tamamlandi',
  }
}

function openCard(c: KpiCounts): KpiCard {
  const onTrack = Math.max(0, c.open - c.overdue)
  return {
    key: 'open',
    label: homeText('home.kpi.open'),
    value: fmt(c.open),
    note:
      c.total === 0
        ? homeText('home.kpi.noTasks')
        : homeText('home.kpi.openNote', { n: fmt(onTrack) }),
    bar: percent(c.open, c.total),
    tone: 'violet',
    icon: 'bolt',
    danger: false,
    status: null,
  }
}

function overdueCard(c: KpiCounts): KpiCard {
  const q = percent(c.overdue, c.open)
  return {
    key: 'overdue',
    label: homeText('home.kpi.overdue'),
    value: fmt(c.overdue),
    note:
      c.open === 0
        ? homeText(c.total === 0 ? 'home.kpi.noTasks' : 'home.kpi.noOpen')
        : homeText('home.kpi.overdueNote', { q, suffix: possessiveSuffix(q) }),
    bar: q,
    tone: 'danger',
    icon: 'alert',
    danger: true,
    status: 'geciken',
  }
}

function pendingCard(c: KpiCounts): KpiCard {
  return {
    key: 'pending',
    label: homeText('home.kpi.pending'),
    value: fmt(c.pending),
    note: null,
    bar: percent(c.pending, c.open),
    tone: 'gold',
    icon: 'clock',
    danger: false,
    status: 'onaya_sunuldu',
  }
}

/** Dört kart, tasarım sırasıyla (E-01-04…07). */
export function kpiCards(counts: KpiCounts): KpiCard[] {
  return [completionCard(counts), openCard(counts), overdueCard(counts), pendingCard(counts)]
}
