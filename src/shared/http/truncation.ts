/**
 * `X-Result-Truncated` (GAP-027; sayfasız ≤200 listeler ve `listUsers`) — TEK okuma yardımcısı.
 *
 * Aynı sorgu anahtarını paylaşan okuyucular (ör. `scoped(['departments'])`: kabuk K7 tespiti,
 * work ad sözlüğü, organizasyon 08 ızgarası; `departments.members`: work atama adayları,
 * organizasyon ekip listesi) bu yardımcıyla okur: hangisi sorguyu ilk doldurursa doldursun
 * önbellekteki veri kesme bilgisini taşır.
 *
 * Veri biçimi: sözleşme şekli AYNEN + yalnız kesildiyse `truncated: true` alanı. Kesilmemiş
 * yanıt şekli değişmez (mevcut tüketiciler ve testleri etkilenmez); bayrak sayılabilir bir
 * alandır, TanStack yapısal paylaşımı (`replaceEqualDeep`) bayrak değişince yeni nesne üretir.
 */
import { unwrap } from './unwrap'

export const TRUNCATED_HEADER = 'X-Result-Truncated'

export interface ListResultLike<D> {
  data?: D
  error?: unknown
  response: Response
}

export type MaybeTruncated<D> = D & { truncated?: true }

/** Yanıtı veriye çevirir (`unwrap`); `X-Result-Truncated: true` ise `truncated: true` ekler. */
export async function unwrapList<D extends object>(
  call: Promise<ListResultLike<D>>,
): Promise<MaybeTruncated<D>> {
  let truncated = false
  const data = await unwrap(
    call.then((result) => {
      truncated = result.response.headers.get(TRUNCATED_HEADER) === 'true'
      return result
    }),
  )
  return truncated ? { ...data, truncated: true } : data
}

/** Önbellek verisi sunucu tarafından kesilmiş mi. */
export function isListTruncated(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { truncated?: unknown }).truncated === true
  )
}
