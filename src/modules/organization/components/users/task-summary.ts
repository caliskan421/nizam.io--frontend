/**
 * E-05-29 sayaçları (05 `backend.md` §4): kişinin görevleri üzerinden istemcide.
 *  - açık = `status ≠ tamamlandi` (`iade_edildi` açık sayılır, P5/G2);
 *  - geciken = açık ∧ `is_overdue` (tamamlanmış geç görev sayılmaz, G3);
 *  - onayda = `status = onaya_sunuldu`.
 */
import type { WorkItem } from '@/modules/work/public'

export interface TaskSummary {
  open: number
  overdue: number
  approval: number
}

export function taskSummary(items: readonly WorkItem[]): TaskSummary {
  const open = items.filter((item) => item.status !== 'tamamlandi')
  return {
    open: open.length,
    overdue: open.filter((item) => item.is_overdue).length,
    approval: items.filter((item) => item.status === 'onaya_sunuldu').length,
  }
}
