/**
 * 08b türetilen değerleri (08 `backend.md` §1, §4) — saf fonksiyonlar, istek yok.
 *
 *  - KPI (E-08-64…69): açık = `total_tasks − completed_tasks` (rapor `onaya_sunuldu` /
 *    `iade_edildi`'yi ayrı saymaz); geciken sayısı `overdue_tasks`; "En uzunu G gün" ve tarih
 *    talebi tek birimin görev listesinden (`department_id`); tamamlanma `completion_rate` (0–100,
 *    P: kabul), sezon ortalaması `reportDashboard` `completed_tasks / total_tasks`. Görev listesi
 *    sonuna dek yüklenmediyse liste kaynaklı notlar "yüklenen kayıtlar içinde" (§10).
 *  - Dikkat (E-08-83): `is_overdue` süzülür, `days_overdue` azalan, ilk 3; kısa kod `KOD-—`
 *    (BE-005: görev numarası yok).
 *  - Ekip (E-08-81): ilk 6 etkin kişi, koordinatörler önce, sonra ad (`tr`); açık iş = bu kişiye
 *    atanmış (`isAssignedTo`, KESİN 21) ve tamamlanmamış görevler.
 */
import { isAssignedTo, type WorkItem } from '@/modules/work/public'

import { teamRoleOf } from '../../model/capabilities'
import type { CoordinatorshipStat, DashboardReport, RosterMember } from '../../model/types'
import { detailText } from './messages'

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })
const DONE: WorkItem['status'] = 'tamamlandi'

/** Sekme şeridi öğesi: `phase` varsa faz dışı (seçilemez, `aria-disabled`, sayı yok). */
export interface DetailTabItem {
  value: string
  label: string
  count?: number
  phase?: string
}

export const TEAM_TILE_LIMIT = 6
export const ATTENTION_LIMIT = 3

/** Kod rozeti (E-08-28/51): kod; yoksa adın ilk iki sözcüğünün baş harfleri (`tr`). */
export function badgeText(displayName: string, code: string | null): string {
  if (code) return code
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

// --- Türkçe iyelik eki ("12 görevin 7’si bitti") ---------------------------------------------

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
const SCALES: ReadonlyArray<readonly [number, string]> = [
  [1_000_000_000, 'milyar'],
  [1_000_000, 'milyon'],
  [1_000, 'bin'],
  [100, 'yüz'],
]
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'])
const BACK = new Set(['a', 'ı', 'o', 'u'])
const ROUNDED = new Set(['o', 'u', 'ö', 'ü'])

function lastSpokenWord(value: number): string {
  const n = Math.floor(Math.abs(value))
  if (n === 0) return 'sıfır'
  if (n % 10 !== 0) return ONES[n % 10]!
  if (n % 100 !== 0) return TENS[(n % 100) / 10]!
  return SCALES.find(([unit]) => n % unit === 0)?.[1] ?? 'yüz'
}

/** Sayıya eklenecek 3. tekil iyelik eki: "’i", "’u", "’si", "’sı" … (kesme U+2019). */
export function possessiveSuffix(value: number): string {
  const word = lastSpokenWord(value)
  const last = [...word].reverse().find((ch) => VOWELS.has(ch)) ?? 'i'
  const vowel = ROUNDED.has(last) ? (BACK.has(last) ? 'u' : 'ü') : BACK.has(last) ? 'ı' : 'i'
  return `’${VOWELS.has(word.at(-1) ?? '') ? 's' : ''}${vowel}`
}

// --- KPI ------------------------------------------------------------------------------------

export type KpiKey = 'open' | 'overdue' | 'completion' | 'dateRequest' | 'archive'

export interface KpiCell {
  key: KpiKey
  label: string
  value: string
  note: string
  danger: boolean
  /** Faz dışı hücre (Arşiv, F5): `aria-disabled`. */
  disabled: boolean
}

export interface WorkSet {
  items: readonly WorkItem[]
  /** İmleç bitti (sayaçlar kesin). */
  complete: boolean
}

const EMPTY = () => detailText('coordinatorship.kpi.empty')
const loadedSuffix = (work: WorkSet) =>
  work.complete ? '' : ` · ${detailText('coordinatorship.kpi.loaded')}`

export function longestOverdue(items: readonly WorkItem[]): number | null {
  const days = items.filter((i) => i.is_overdue).map((i) => i.days_overdue)
  return days.length > 0 ? Math.max(...days) : null
}

export function pendingDateRequests(items: readonly WorkItem[]): WorkItem[] {
  return items.filter((i) => i.pending_date_request !== null)
}

function openCell(stat: CoordinatorshipStat | null): KpiCell {
  const base = {
    key: 'open',
    label: detailText('coordinatorship.kpi.open'),
    danger: false,
  }
  if (!stat) return { ...base, key: 'open', value: EMPTY(), note: '', disabled: false }
  const done = stat.completed_tasks
  return {
    ...base,
    key: 'open',
    value: String(stat.total_tasks - done),
    note: detailText('coordinatorship.kpi.openNote', {
      total: stat.total_tasks,
      done,
      suffix: possessiveSuffix(done),
    }),
    disabled: false,
  }
}

function overdueCell(stat: CoordinatorshipStat | null, work: WorkSet): KpiCell {
  const longest = longestOverdue(work.items)
  const note =
    longest === null
      ? work.complete
        ? detailText('coordinatorship.kpi.overdueNone')
        : ''
      : detailText('coordinatorship.kpi.overdueNote', { days: longest }) + loadedSuffix(work)
  return {
    key: 'overdue',
    label: detailText('coordinatorship.kpi.overdue'),
    value: stat ? String(stat.overdue_tasks) : EMPTY(),
    note,
    danger: stat !== null && stat.overdue_tasks > 0,
    disabled: false,
  }
}

/** Sezon ortalaması (program geneli, `reportDashboard`): görev yoksa `null`. */
export function seasonAverage(dashboard: DashboardReport | null | undefined): number | null {
  if (!dashboard || dashboard.total_tasks === 0) return null
  return Math.round((dashboard.completed_tasks / dashboard.total_tasks) * 100)
}

function completionCell(stat: CoordinatorshipStat | null, season: number | null): KpiCell {
  return {
    key: 'completion',
    label: detailText('coordinatorship.kpi.completion'),
    value: stat
      ? detailText('coordinatorship.kpi.completionValue', {
          p: Math.round(stat.completion_rate),
        })
      : EMPTY(),
    note: season === null ? '' : detailText('coordinatorship.kpi.completionNote', { p: season }),
    danger: false,
    disabled: false,
  }
}

function dateRequestCell(work: WorkSet, loading: boolean): KpiCell {
  const pending = pendingDateRequests(work.items)
  const first = pending[0]?.title
  const note = first
    ? first + loadedSuffix(work)
    : work.complete
      ? detailText('coordinatorship.kpi.dateRequestNone')
      : ''
  return {
    key: 'dateRequest',
    label: detailText('coordinatorship.kpi.dateRequest'),
    value: loading ? EMPTY() : String(pending.length),
    note,
    danger: false,
    disabled: false,
  }
}

/** KPI şeridi (E-08-64): 5 hücre; Arşiv F5'e dek devre dışı. */
export function kpiCells(input: {
  stat: CoordinatorshipStat | null
  dashboard: DashboardReport | null | undefined
  work: WorkSet
  workLoading: boolean
}): KpiCell[] {
  return [
    openCell(input.stat),
    overdueCell(input.stat, input.work),
    completionCell(input.stat, seasonAverage(input.dashboard)),
    dateRequestCell(input.work, input.workLoading),
    {
      key: 'archive',
      label: detailText('coordinatorship.kpi.archive'),
      value: EMPTY(),
      note: detailText('coordinatorship.phase.f5'),
      danger: false,
      disabled: true,
    },
  ]
}

// --- Dikkat gerektirenler -------------------------------------------------------------------

export interface AttentionRow {
  workItemId: string
  title: string
  status: WorkItem['status']
  who: string
  late: string
}

export function attentionRows(
  items: readonly WorkItem[],
  code: string,
  limit = ATTENTION_LIMIT,
): AttentionRow[] {
  return items
    .filter((i) => i.is_overdue)
    .sort((a, b) => b.days_overdue - a.days_overdue)
    .slice(0, limit)
    .map((i) => {
      const names = i.assignees.map((a) => a.full_name).filter((n): n is string => Boolean(n))
      const parts = [detailText('coordinatorship.attention.code', { code }), ...names]
      if (i.pending_date_request !== null) {
        parts.push(detailText('coordinatorship.attention.dateRequest'))
      }
      return {
        workItemId: i.work_item_id,
        title: i.title,
        status: i.status,
        who: parts.join(' · '),
        late: detailText('coordinatorship.attention.late', { days: i.days_overdue }),
      }
    })
}

// --- Ekip -----------------------------------------------------------------------------------

export function isCoordinator(member: RosterMember): boolean {
  return teamRoleOf(member.role) === 'coordinator'
}

/** Koordinatörler önce, sonra ad (`tr`). */
export function teamOrder(members: readonly RosterMember[]): RosterMember[] {
  return [...members].sort(
    (a, b) =>
      Number(isCoordinator(b)) - Number(isCoordinator(a)) ||
      collator.compare(a.full_name, b.full_name),
  )
}

export interface TeamTile {
  accountId: string
  name: string
  coordinator: boolean
  open: number
}

export function openCountFor(items: readonly WorkItem[], accountId: string): number {
  return items.filter((i) => i.status !== DONE && isAssignedTo(i, accountId)).length
}

export function teamTiles(
  active: readonly RosterMember[],
  items: readonly WorkItem[],
  limit = TEAM_TILE_LIMIT,
): TeamTile[] {
  return teamOrder(active)
    .slice(0, limit)
    .map((m) => ({
      accountId: m.account_id,
      name: m.full_name,
      coordinator: isCoordinator(m),
      open: openCountFor(items, m.account_id),
    }))
}
