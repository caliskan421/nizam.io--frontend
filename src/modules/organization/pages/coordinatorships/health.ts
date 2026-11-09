/**
 * Yapı sağlığı şeridi (E-08-07…11; 08 `backend.md` §4). Yalnız rapor satırı olan birimler sayılır
 * (raporda olmayan birim — yarış — için olgu yok). Sayımlar:
 *  - E-08-08 koordinatörsüz: `coordinators.length === 0`.
 *  - E-08-09 üyesi olmayan: `member_count === 0` (yalnız `uye` rolü; koordinatör sayılmaz).
 *  - E-08-10 bu sezon görevsiz: `total_tasks === 0` + adlar (programdaki ad).
 *  - E-08-11 30+ gündür sessiz: `last_activity_at` yok ya da 30 günden eski (görev hareketi).
 */
import { isQuiet } from '../../components/coordinatorships/card-view'
import type { CoordinatorshipView } from '../../model/types'

export interface HealthSummary {
  noLead: number
  noMembers: number
  noTasks: number
  noTaskNames: string[]
  quiet: number
}

export function healthSummary(views: readonly CoordinatorshipView[], now: number): HealthSummary {
  const summary: HealthSummary = { noLead: 0, noMembers: 0, noTasks: 0, noTaskNames: [], quiet: 0 }
  for (const view of views) {
    const stat = view.stat
    if (!stat) continue
    if (stat.coordinators.length === 0) summary.noLead += 1
    if (stat.member_count === 0) summary.noMembers += 1
    if (stat.total_tasks === 0) {
      summary.noTasks += 1
      summary.noTaskNames.push(view.displayName)
    }
    if (isQuiet(stat.last_activity_at, now)) summary.quiet += 1
  }
  return summary
}
