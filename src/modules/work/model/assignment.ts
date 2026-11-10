/**
 * Üye merceği "bana atananlar" (K3, P1/P3; CX-F1-E-01). Pin v0.15.0-api'den beri daraltma
 * SUNUCUDADIR (`assignee_account_id`, BE-038; `lensAssignee` süzgeç girdisini verir). Buradaki
 * `isAssignedTo`/`assignedSubset` yüklemleri yüklenmiş satırlar üzerindeki istemci hesapları
 * (ör. 08b birim özeti) içindir. Mercek yetkiyi değiştirmez; yalnız içeriği
 * daraltır: sunucunun yetkiyle döndürdüğü başkasına ait satırlar Üye merceğinde listelenmez
 * (birleşik rolde zorunlu, salt üyede sunucu zaten yalnız atananları döndürdüğü için etkisiz).
 * Görev listesi (03) ve ana sayfa KPI'sı (01, `public.ts` üzerinden) aynı yüklemi kullanır.
 */
import type { ScopeLens } from '@/shared/scope/scope'

import type { WorkItem } from './types'

/** Görev bu hesaba atanmış mı (`assignee_account_ids ∋ accountId`). */
export function isAssignedTo(
  item: Pick<WorkItem, 'assignee_account_ids'>,
  accountId: string,
): boolean {
  return item.assignee_account_ids.includes(accountId)
}

/** Merceğin daralttığı atanan: Üye merceğinde "ben", diğerlerinde `null` (süzgeç yok). */
export function lensAssignee(
  lens: ScopeLens | null | undefined,
  accountId: string | null | undefined,
): string | null {
  return lens === 'member' ? (accountId ?? null) : null
}

/** `assignee` verilirse yalnız ona atananlar; `null` → küme olduğu gibi. */
export function assignedSubset<T extends Pick<WorkItem, 'assignee_account_ids'>>(
  items: readonly T[],
  assignee: string | null,
): readonly T[] {
  if (assignee === null) return items
  return items.filter((item) => isAssignedTo(item, assignee))
}
