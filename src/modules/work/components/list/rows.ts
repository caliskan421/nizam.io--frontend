/**
 * Görev listesinin istemci hesapları (03 `backend.md` §4). Hepsi YÜKLENMİŞ satırlar üzerindedir;
 * imleç bitmemişse sonuç "yüklenen kayıtlar içinde"dir (ortak-kurallar §10, P4). Sunucu durum
 * süzgeci, arama ve sıralama yok (BE-003, BE-004, BE-040): sekme, arama ve sıralama burada.
 */
import type { WorkItem, WorkItemStatus } from '../../model/types'
import { WORK_ITEM_STATUSES } from '../../model/types'

/** Sekme süzgeci: "Tümü", beş durum ya da "Geciken" (`is_overdue`, durumla kesişir). */
export type RowTab = 'tumu' | WorkItemStatus | 'geciken'
export type RowSortField = 'gorev' | 'durum' | 'bitis'
export interface RowSort {
  field: RowSortField
  direction: 'artan' | 'azalan'
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base', numeric: true })

/** Türkçe katlama (GAP-036): `tr-TR` küçük harf ("İ" → "i", "I" → "ı"). */
export function foldTr(text: string): string {
  return text.toLocaleLowerCase('tr-TR').trim()
}

/** Satırın aranan metinleri: başlık + kısa kod öneki (BE-005) + atanan adları (BE-004). */
export function searchHaystack(item: WorkItem, code: string | null): string {
  const names = item.assignees.map((a) => a.full_name ?? '')
  return foldTr([item.title, code ?? '', ...names].join(' '))
}

export function matchesSearch(item: WorkItem, needle: string, code: string | null): boolean {
  const folded = foldTr(needle)
  return folded === '' || searchHaystack(item, code).includes(folded)
}

/** Bekleyen tarih talebi var mı (WORK-K82; üyede hep `null`). */
export function hasDateRequest(item: WorkItem): boolean {
  return item.pending_date_request != null
}

export function inTab(item: WorkItem, tab: RowTab): boolean {
  if (tab === 'tumu') return true
  if (tab === 'geciken') return item.is_overdue
  return item.status === tab
}

/** Sekme sayaçları (E-03-08): her sekme için satır sayısı. */
export function tabCounts(items: readonly WorkItem[]): Record<RowTab, number> {
  const counts = { tumu: items.length, geciken: 0 } as Record<RowTab, number>
  for (const status of WORK_ITEM_STATUSES) counts[status] = 0
  for (const item of items) {
    counts[item.status] += 1
    if (item.is_overdue) counts.geciken += 1
  }
  return counts
}

const STATUS_RANK = new Map<WorkItemStatus, number>(WORK_ITEM_STATUSES.map((s, i) => [s, i]))

function byTie(a: WorkItem, b: WorkItem): number {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1
  if (a.work_item_id === b.work_item_id) return 0
  return a.work_item_id < b.work_item_id ? -1 : 1
}

const COMPARE: Record<RowSortField, (a: WorkItem, b: WorkItem) => number> = {
  gorev: (a, b) => collator.compare(a.title, b.title),
  durum: (a, b) => (STATUS_RANK.get(a.status) ?? 0) - (STATUS_RANK.get(b.status) ?? 0),
  bitis: (a, b) => (a.end_on === b.end_on ? 0 : a.end_on < b.end_on ? -1 : 1),
}

/**
 * İstemci sıralaması (E-03-16, BE-040): görev = `title` (`tr`), durum = enum sırası, bitiş =
 * `end_on`; eşitlikte `created_at`, `work_item_id` (kararlı). `null` = sunucu sırası.
 */
export function sortItems(items: readonly WorkItem[], sort: RowSort | null): WorkItem[] {
  if (!sort) return [...items]
  const sign = sort.direction === 'artan' ? 1 : -1
  const compare = COMPARE[sort.field]
  return [...items].sort((a, b) => sign * compare(a, b) || byTie(a, b))
}

/** Tekil atanan sayısı (E-03-04 "kişi"; yüklenen `assignees[]`). */
export function uniqueAssigneeCount(items: readonly WorkItem[]): number {
  return new Set(items.flatMap((item) => item.assignees.map((a) => a.account_id))).size
}

/** Talepli satırların tekil departmanları (E-03-13 band adları), ilk görülme sırasıyla. */
export function requestDepartmentIds(items: readonly WorkItem[]): string[] {
  return [...new Set(items.filter(hasDateRequest).map((item) => item.department_id))]
}
