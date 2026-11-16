/**
 * Bekleyen bağımlılık ipucu (E-K1-20/23/25, E-Ü1-15/17; BE-138): `has_pending_dependency` ve
 * `pending_dependency_count` satır alanlarıdır. Bekleyen görevin adı/kodu alanda yoktur → yalnız
 * SAYI gösterilir (ad uydurulmaz). Engel yine sunucu hatasıyla bildirilir
 * (`work.dependency_not_completed`); rozet yalnız ipucudur.
 */
import { homeText } from '../messages'
import type { WorkRow } from './common'

export function isLocked(item: Pick<WorkRow, 'has_pending_dependency'>): boolean {
  return item.has_pending_dependency
}

/** "‹n› görev bekleniyor"; sayı 0 ise (savunma) kilit yoksa `null`. */
export function lockText(
  item: Pick<WorkRow, 'has_pending_dependency' | 'pending_dependency_count'>,
): string | null {
  if (!item.has_pending_dependency) return null
  return homeText('home.lock.waiting', { n: item.pending_dependency_count })
}

/** Dikkat kartı notu: "‹n› geciken görev" (+ " · ‹m› görev bağımlılık bekliyor"). */
export function attentionNote(items: readonly Pick<WorkRow, 'has_pending_dependency'>[]): string {
  const waiting = items.filter(isLocked).length
  return waiting > 0
    ? homeText('home.k1.attention.noteWaiting', { n: items.length, m: waiting })
    : homeText('home.k1.attention.note', { n: items.length })
}
