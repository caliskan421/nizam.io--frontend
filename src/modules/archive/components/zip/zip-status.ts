/**
 * ZIP indirmesinin kullanıcı metni (E-06-04/34; `06-arsiv/backend.md` §2). Metin yalnız i18n'den:
 * sunucu `message` alanı gösterilmez. Otomatik tekrar YOKTUR; 429'da `Retry-After` süresi söylenir.
 *  - 422 `records.too_many_files` / `records.too_large` → "çok büyük" (ZIP'e özgü metin; ortak
 *    `errors.*` metni tek dosya içindir).
 *  - 429 `platform.rate_limited` / `records.busy` → `Retry-After` metni (`rateLimitMessage`).
 *  - Akış ortasında kopma (`client.network_error`) → yarım indirme, "tekrar deneyin" (GAP-041).
 *  - Diğer kodlar ortak hata metni (`errors.*`).
 */
import { rateLimitMessage } from '@/shared/http/mutation'
import { errorText, i18n } from '@/shared/i18n'
import { outcomeText } from '@/shared/ui/confirm'

import type { ArchiveDownloadResult } from '../../model/types'
import { zipText } from './messages'

export type ZipScope = 'folder' | 'period'

const TOO_BIG = new Set(['records.too_many_files', 'records.too_large'])
const RATE_LIMITED = new Set(['platform.rate_limited', 'records.busy'])

function rateText(retryAfter: number | null): string {
  const { key, params } = rateLimitMessage(retryAfter)
  return i18n.global.t(key, params ?? {})
}

/** Başarısız sonucun metni; bildirilecek bir şey yoksa (`saved`, `disposed`, sahip söküldü) `null`. */
export function zipFailureText(result: ArchiveDownloadResult, scope: ZipScope): string | null {
  switch (result.kind) {
    case 'saved':
    case 'disposed':
      return null
    case 'ticket_failed':
      return result.outcome.kind === 'owner_disposed' ? null : outcomeText(result.outcome)
    case 'failed': {
      const { code } = result.error
      if (TOO_BIG.has(code)) return zipText(`${scope}.tooLarge`)
      if (RATE_LIMITED.has(code)) return rateText(result.retryAfter)
      if (code === 'client.network_error') return zipText('partial')
      return errorText(result.error)
    }
  }
}
