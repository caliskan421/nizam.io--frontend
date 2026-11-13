import type { components } from '@/shared/api/schema'
import type { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'

export type DownloadTicket = components['schemas']['DownloadTicketResponse']

/** Bilet isteğinin kapsam başlıkları: S2 hedef yalnız program, S3 hedef program + departman. */
export interface DownloadScopeHeaders {
  'X-Nizamio-Program'?: string
  'X-Nizamio-Department'?: string
}

/**
 * Bilet hedefi (ADR-0013; kapalı liste sunucuda): çağıran yolu üretir. `body` yalnız POST
 * hedefinde (iş yükü PDF'i; boş olmayan JSON nesnesi, ≤ 64 KiB) gönderilir, GET'te gönderilmez.
 */
export interface DownloadTarget {
  method: 'GET' | 'POST'
  /** Göreli yol + ham sorgu dizesi (`/v1/files/{id}/download`). */
  path: string
  body?: object
  headers: DownloadScopeHeaders
  /** Sunucu `Content-Disposition` vermezse kaydedilecek ad. */
  fallbackName: string
}

/** Kaydedildi. */
export interface DownloadSaved {
  kind: 'saved'
  fileName: string
}
/** Tüketimde hedefin hatası (403/404/422/429/503 …): sınıflandırılmış, tekrar yok. */
export interface DownloadFailed {
  kind: 'failed'
  error: ApiError
  /** 429 `Retry-After` (saniye); başlık yoksa `null`. */
  retryAfter: number | null
}
/** Sahip söküldü ya da eylem iptal edildi: bilet tüketilmedi / dosya kaydedilmedi, bildirim yok. */
export interface DownloadDisposed {
  kind: 'disposed'
}
export type DownloadRedeemResult = DownloadSaved | DownloadFailed | DownloadDisposed

/** Bilet ÜRETİMİ başarısız (429 açık bilet tavanı, 403, ağ …): ortak yazma sonucu. */
export interface DownloadTicketFailed<V> {
  kind: 'ticket_failed'
  outcome: MutationOutcome<V, DownloadTicket, unknown>
}
export type DownloadResult<V> = DownloadRedeemResult | DownloadTicketFailed<V>
