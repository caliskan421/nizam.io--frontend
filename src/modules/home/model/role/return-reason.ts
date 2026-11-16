/**
 * İade gerekçesi (BE-139, WORK-K96): `TransitionRequest.reason` isteğe bağlıdır — kırpılır, boş ya
 * da 3–500 karakter. Okuma yüzü `WorkItem.last_return` (nesne null olabilir; `reason` null olabilir).
 * Gerekçe KULLANICI METNİDİR: yalnız metin düğümü olarak çizilir, uzunluğu kırpılır (XSS yok).
 */
import type { WorkRow } from './common'

/** Satırda gösterilen en çok karakter (devamı "…"; tam metin 03 panelinde). */
const SHOWN_MAX = 120

// Gönderim denetimi tek kaynaktan (`work/public`; W175 tek kaynağa indirme girdisi):
// boş → gerekçesiz iade; 1–2 ya da >500 karakter → geçersiz. Home kendi kopyasını tutmaz.
export { checkReturnReason, RETURN_REASON_MAX, RETURN_REASON_MIN } from '@/modules/work/public'

/** Satır/nota sığacak gerekçe (kırpılmış, boşlukları sadeleşmiş); yoksa `null`. */
export function shownReason(item: Pick<WorkRow, 'last_return'>): string | null {
  const raw = item.last_return?.reason?.replace(/\s+/g, ' ').trim()
  if (!raw) return null
  const chars = [...raw]
  return chars.length > SHOWN_MAX ? `${chars.slice(0, SHOWN_MAX).join('')}…` : raw
}

/** En son iade edilmiş görevin gerekçesi (E-Ü1-08 kart notu); gerekçe yoksa `null`. */
export function latestReturnReason(items: readonly WorkRow[]): string | null {
  let best: WorkRow | null = null
  for (const item of items) {
    if (item.status !== 'iade_edildi' || shownReason(item) === null) continue
    const at = item.last_return?.returned_at ?? ''
    if (best === null || at > (best.last_return?.returned_at ?? '')) best = item
  }
  return best === null ? null : shownReason(best)
}
