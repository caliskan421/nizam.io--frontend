/**
 * K1/Ü1 ortak türetimler (saf; KESİN 21 — ayrı süzme kodu yok, kümeler `work/public.ts`
 * yüklemleriyle ve tek yüklemden). Görev satırı = `listProgramWorkItems` satırı; sayaçlar
 * `countProgramWorkItems` (sunucu, kesin).
 */
import type { WorkItem, WorkItemCounts } from '@/modules/work/public'

export type WorkRow = WorkItem

export const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/** Açık görev: tamamlanmamış (`onaya_sunuldu` ve `iade_edildi` açıktır; E-K1-08). */
export function isOpen(item: Pick<WorkRow, 'status'>): boolean {
  return item.status !== 'tamamlandi'
}

/** Sunucu sayaçlarından açık görev sayısı: toplam − tamamlanan. */
export function openCount(counts: WorkItemCounts): number {
  return counts.total - counts.by_status.tamamlandi
}

const PRIORITY_RANK: Readonly<Record<WorkRow['priority'], number>> = {
  acil: 0,
  yuksek: 1,
  orta: 2,
  dusuk: 3,
}

/** Öncelik sırası (küçük = önce): acil > yüksek > orta > düşük. */
export function priorityRank(priority: WorkRow['priority']): number {
  return PRIORITY_RANK[priority]
}

/** Atananların adları (adı okunamayan nötr etiketle atlanır → çağıran metni verir). */
export function assigneeNames(item: Pick<WorkRow, 'assignees'>): string[] {
  return item.assignees.flatMap((a) => (a.full_name ? [a.full_name] : []))
}

/** Görev başlığına göre kararlı sıralama için tr karşılaştırma. */
export function byTitle(a: Pick<WorkRow, 'title'>, b: Pick<WorkRow, 'title'>): number {
  return collator.compare(a.title, b.title)
}

/**
 * Yükleme tamlığı: imleç bitti → küme tam; bitmedi → sayılar "yüklenen kayıtlar içinde"
 * (ortak-kurallar §10, P4; `≥` ipucu).
 */
export interface LoadScope {
  complete: boolean
}

/**
 * Kısmi yükleme durumu (CX-F6-E-03): `loading` sürüyor, `capped` sayfa tavanına dayandı,
 * `failed` sonraki sayfa hatası. `null` = küme tam. Kısmi kümede türevler "≥" + "ilk N görev".
 */
export type RoleLoadScope = 'loading' | 'capped' | 'failed'
