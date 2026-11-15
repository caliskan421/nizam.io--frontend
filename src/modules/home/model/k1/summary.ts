/**
 * K1 birim özeti (E-K1-05…13, E-K1-08…12): sayılar sunucu sayaçlarından (`countProgramWorkItems`,
 * seçili birim; BE-003) ve AYNI süzgeçli yüklenen kümeden (`listProgramWorkItems`, KESİN 21).
 * Atanmamış sayısı istemci türetimidir (sunucu sayacı yok): küme tam değilse "≥" ipucu (P4).
 */
import { workShortCode, type WorkItemCounts } from '@/modules/work/public'

import { assigneeNames, isOpen, openCount, type WorkRow } from '../role/common'
import { unassignedOf } from './queues'

export interface ReturnedNote {
  kind: 'none' | 'one' | 'many'
  /** `one`: tek iade görevinin atananları (adı okunamıyorsa boş). */
  names: string[]
  /** `one`: tek iade görevinin kodu (E-K1-11; kod yoksa boş). */
  code: string
  count: number
}

export interface UnitSummary {
  total: number
  open: number
  doing: number
  notStarted: number
  overdue: number
  /** Yüklenen kümede en uzun gecikme (gün); gecikme yoksa `null`. */
  longestOverdue: number | null
  /** En uzun gecikmeli görevin kodu (E-K1-09; kod yoksa boş). */
  longestCode: string
  pending: number
  returned: number
  returnedNote: ReturnedNote
  unassigned: number
  dateRequests: number
  /** Küme tam değil → istemci türetimleri alt sınırdır ("≥"). */
  partial: boolean
}

function returnedNote(items: readonly WorkRow[], count: number): ReturnedNote {
  const returned = items.filter((i) => i.status === 'iade_edildi')
  if (count === 0) return { kind: 'none', names: [], code: '', count }
  if (count === 1 && returned.length === 1) {
    return {
      kind: 'one',
      names: assigneeNames(returned[0]!),
      code: workShortCode(returned[0]),
      count,
    }
  }
  return { kind: 'many', names: [], code: '', count }
}

/** Yüklenen kümede en uzun gecikmeli açık görev (eşitlikte ilk); yoksa `null`. */
function longestOverdueItem(items: readonly WorkRow[]): WorkRow | null {
  let longest: WorkRow | null = null
  for (const item of items) {
    if (!isOpen(item) || !item.is_overdue) continue
    if (longest === null || item.days_overdue > longest.days_overdue) longest = item
  }
  return longest
}

export function longestOverdue(items: readonly WorkRow[]): number | null {
  return longestOverdueItem(items)?.days_overdue ?? null
}

export function unitSummary(
  counts: WorkItemCounts,
  items: readonly WorkRow[],
  complete: boolean,
): UnitSummary {
  const by = counts.by_status
  return {
    total: counts.total,
    open: openCount(counts),
    doing: by.devam_ediyor,
    notStarted: by.baslanmadi,
    overdue: counts.overdue,
    longestOverdue: longestOverdue(items),
    longestCode: workShortCode(longestOverdueItem(items)),
    pending: by.onaya_sunuldu,
    returned: by.iade_edildi,
    returnedNote: returnedNote(items, by.iade_edildi),
    unassigned: unassignedOf(items).length,
    dateRequests: counts.pending_date_requests,
    partial: !complete,
  }
}
