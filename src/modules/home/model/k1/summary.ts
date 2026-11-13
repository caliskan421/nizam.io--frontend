/**
 * K1 birim özeti (E-K1-05…13, E-K1-08…12): sayılar sunucu sayaçlarından (`countProgramWorkItems`,
 * seçili birim; BE-003) ve AYNI süzgeçli yüklenen kümeden (`listProgramWorkItems`, KESİN 21).
 * Atanmamış sayısı istemci türetimidir (sunucu sayacı yok): küme tam değilse "≥" ipucu (P4).
 */
import type { WorkItemCounts } from '@/modules/work/public'

import { assigneeNames, isOpen, openCount, type WorkRow } from '../role/common'
import { unassignedOf } from './queues'

export interface ReturnedNote {
  kind: 'none' | 'one' | 'many'
  /** `one`: tek iade görevinin atananları (adı okunamıyorsa boş). */
  names: string[]
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
  if (count === 0) return { kind: 'none', names: [], count }
  if (count === 1 && returned.length === 1) {
    return { kind: 'one', names: assigneeNames(returned[0]!), count }
  }
  return { kind: 'many', names: [], count }
}

export function longestOverdue(items: readonly WorkRow[]): number | null {
  const days = items.filter((i) => isOpen(i) && i.is_overdue).map((i) => i.days_overdue)
  return days.length === 0 ? null : Math.max(...days)
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
    pending: by.onaya_sunuldu,
    returned: by.iade_edildi,
    returnedNote: returnedNote(items, by.iade_edildi),
    unassigned: unassignedOf(items).length,
    dateRequests: counts.pending_date_requests,
    partial: !complete,
  }
}
