/**
 * Kayıtlı eksikler (yalnız kayıtlı kimlikler; ortak-kurallar §3). Statik değer sahte veri
 * göstermez (§4): yalnız "var mı / etkin mi" bilgisi.
 *  - BE-144: "Senden bekleyen" sekmesi ve sayacı (eylem/bilgi ayrımı yok) → sekme devre dışı.
 *  - BE-146: satır içi "Onayla / Reddet" (bildirim `request_id` taşımaz) → devre dışı + "yakında";
 *    "İncele" canlıdır (03 panelini açar).
 */
import { designStub } from '@/shared/design-stub'

export const AWAITING_TAB = designStub('BE-144', { enabled: false })
export const INLINE_DECISION = designStub('BE-146', { enabled: false })
