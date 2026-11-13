/**
 * Ü1 "Bugünün sırası" (E-Ü1-09…17, mekanizma §9.2): açık görevler (`status ≠ tamamlandi`);
 * sıra: (1) `iade_edildi`, (2) geciken (`days_overdue` azalan), (3) öncelik acil > yuksek > orta
 * > dusuk, (4) `end_on` artan; `onaya_sunuldu` olanlar en sona; ilk 5. Eşitlikte ad (tr).
 * Küme "bana atananlar"dır (sunucu süzgeci, KESİN 21); ek istek yok.
 */
import { byTitle, isOpen, priorityRank, type WorkRow } from '../role/common'

export const QUEUE_LIMIT = 5

function rank(item: WorkRow): [number, number, number, number, number] {
  return [
    item.status === 'onaya_sunuldu' ? 1 : 0,
    item.status === 'iade_edildi' ? 0 : 1,
    item.is_overdue ? 0 : 1,
    -item.days_overdue,
    priorityRank(item.priority),
  ]
}

export function compareQueue(a: WorkRow, b: WorkRow): number {
  const ra = rank(a)
  const rb = rank(b)
  for (let i = 0; i < ra.length; i += 1) {
    const diff = ra[i]! - rb[i]!
    if (diff !== 0) return diff
  }
  return a.end_on.localeCompare(b.end_on) || byTitle(a, b)
}

export interface TodayQueue {
  /** Sıralı açık görevlerin ilk `limit`'i. */
  shown: WorkRow[]
  /** Açık görev sayısı ("‹n› açık görevinden ‹m›’i"). */
  open: number
}

export function todayQueue(items: readonly WorkRow[], limit = QUEUE_LIMIT): TodayQueue {
  const open = items.filter(isOpen).sort(compareQueue)
  return { shown: open.slice(0, limit), open: open.length }
}

/** Satır eylemleri (E-Ü1-12…16); yazma yetkisi çağıranda ayrıca denetlenir. */
export type QueueAction = 'restart' | 'evidence' | 'complete' | 'start'

export function queueActions(item: Pick<WorkRow, 'status'>): QueueAction[] {
  switch (item.status) {
    case 'iade_edildi':
      return ['restart']
    case 'devam_ediyor':
      return ['evidence', 'complete']
    case 'baslanmadi':
      return ['start']
    default:
      return []
  }
}

/** Eylemin hedef durumu (`useOwnStatusWorkItem`; `evidence` durum değiştirmez). */
export function actionTarget(action: QueueAction): WorkRow['status'] | null {
  if (action === 'restart' || action === 'start') return 'devam_ediyor'
  if (action === 'complete') return 'onaya_sunuldu'
  return null
}
