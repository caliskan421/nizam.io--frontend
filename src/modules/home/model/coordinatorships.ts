/**
 * 01 koordinatörlük kartları (E-01-21…38) — saf türetim. Girdi tek kaynaktır:
 * `reportDashboard.coordinatorship_stats[]` (v0.15 kesmez); süzgeç, arama, sıralama ve süzgeç
 * sayıları istemcide, yüklenmiş bütün satırlar üzerindedir (`mekanizma.md` §5; `backend.md` §4).
 *
 *  - Süzgeç sayıları aramadan bağımsız, toplam üzerinden (E-01-24).
 *  - Arama: ad üzerinde alt dize, Türkçe katlamalı (I/ı/İ/i, ç ğ ö ş ü; GAP-036).
 *  - Sıralama: ölçüt + ters; eşitlikte ikincil ölçüt ad A→Z `Intl.Collator('tr')` (E-01-26;
 *    sunucu sırası bayt sırasıdır). "Son yükleme" ölçütü BE-025'e kadar seçilemez.
 *  - Kart: "kullanıcı" = `member_count + coordinators.length` (E-01-36); durum çubuğunun 4.
 *    dilimi `total − başlamadı − devam − bitti` artığıdır ("onayda/iade", BE-078).
 */
import type { components } from '@/shared/api/schema'

export type CoordinatorshipStat = components['schemas']['CoordinatorshipStat']

export const COORD_FILTERS = ['all', 'late', 'on_track', 'no_coordinator'] as const
export type CoordFilter = (typeof COORD_FILTERS)[number]

export const COORD_SORT_KEYS = [
  'late',
  'open',
  'completion',
  'members',
  'last_upload',
  'name',
] as const
export type CoordSortKey = (typeof COORD_SORT_KEYS)[number]

export const DEFAULT_COORD_SORT: CoordSortKey = 'late'

/** BE-025 kapanana dek seçilemeyen ölçüt (E-01-26). */
export function coordSortDisabled(key: CoordSortKey): boolean {
  return key === 'last_upload'
}

const collator = new Intl.Collator('tr')

/** Arama katlaması: küçük harf (tr), noktalı/noktasız i birleşir, Türkçe harfler ASCII'ye iner. */
export function foldTr(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function matchesQuery(stat: CoordinatorshipStat, query: string): boolean {
  const needle = foldTr(query)
  return needle === '' || foldTr(stat.name).includes(needle)
}

export function matchesFilter(stat: CoordinatorshipStat, filter: CoordFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'late':
      return stat.overdue_tasks > 0
    case 'on_track':
      return stat.overdue_tasks === 0
    case 'no_coordinator':
      return stat.coordinators.length === 0
  }
}

/** Süzgeç sayıları (aramadan bağımsız; E-01-24). */
export function filterCounts(
  stats: readonly CoordinatorshipStat[],
): Readonly<Record<CoordFilter, number>> {
  const counts: Record<CoordFilter, number> = { all: 0, late: 0, on_track: 0, no_coordinator: 0 }
  for (const filter of COORD_FILTERS) {
    counts[filter] = stats.filter((s) => matchesFilter(s, filter)).length
  }
  return counts
}

export function openTasks(stat: CoordinatorshipStat): number {
  return stat.total_tasks - stat.completed_tasks
}

/** Kart "kullanıcı" (E-01-36): koordinatörler `member_count`'a dahil değildir. */
export function userCount(stat: CoordinatorshipStat): number {
  return stat.member_count + stat.coordinators.length
}

/** 4. dilim (BE-078): onayda + iade birlikte; negatif olamaz. */
export function approvalRemainder(stat: CoordinatorshipStat): number {
  return Math.max(
    0,
    stat.total_tasks - stat.not_started_tasks - stat.in_progress_tasks - stat.completed_tasks,
  )
}

/** Tamamlanma yüzdesi (`completion_rate` 0–100; yuvarlama istemcide, E-01-32). */
export function completionPercent(stat: CoordinatorshipStat): number {
  return Math.round(stat.completion_rate)
}

const byName = (a: CoordinatorshipStat, b: CoordinatorshipStat) => collator.compare(a.name, b.name)

/** Birincil karşılaştırma: negatif → `a` önce. */
function primary(key: CoordSortKey, a: CoordinatorshipStat, b: CoordinatorshipStat): number {
  switch (key) {
    case 'late':
      return b.overdue_tasks - a.overdue_tasks
    case 'open':
      return openTasks(b) - openTasks(a)
    case 'completion':
      return a.completion_rate - b.completion_rate
    case 'members':
      return userCount(b) - userCount(a)
    case 'last_upload':
    case 'name':
      return 0
  }
}

/** Sıralı kopya; `reversed` bütün sırayı tersler (E-01-25). */
export function sortStats(
  stats: readonly CoordinatorshipStat[],
  key: CoordSortKey,
  reversed: boolean,
): CoordinatorshipStat[] {
  const sorted = [...stats].sort((a, b) => primary(key, a, b) || byName(a, b))
  return reversed ? sorted.reverse() : sorted
}

/** Süzgeç + arama + sıralama (kart ızgarası). */
export function visibleStats(
  stats: readonly CoordinatorshipStat[],
  options: { filter: CoordFilter; query: string; key: CoordSortKey; reversed: boolean },
): CoordinatorshipStat[] {
  const kept = stats.filter(
    (s) => matchesFilter(s, options.filter) && matchesQuery(s, options.query),
  )
  return sortStats(kept, options.key, options.reversed)
}

export interface StatusBar {
  /** 0–100, çubuk doluluğu (toplam 0 ise hepsi 0). */
  todo: number
  doing: number
  review: number
  done: number
}

export function statusBar(stat: CoordinatorshipStat): StatusBar {
  const total = stat.total_tasks
  if (total <= 0) return { todo: 0, doing: 0, review: 0, done: 0 }
  const share = (n: number) => (n / total) * 100
  return {
    todo: share(stat.not_started_tasks),
    doing: share(stat.in_progress_tasks),
    review: share(approvalRemainder(stat)),
    done: share(stat.completed_tasks),
  }
}

/** Avatar baş harfleri: ilk iki sözcüğün ilk harfi, `tr-TR` büyük harf. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}
