/**
 * Bilet tüketimi (`redeemDownloadTicket`, S0): `GET /v1/downloads/{ticket}` gövdeyi `blob` olarak
 * okur ve tarayıcı indirmesine verir. Başarısızlık sınıflandırılmış sonuç olarak döner
 * (fırlatmaz); otomatik tekrar YOKTUR. İptal (`signal`) sessizdir: bilet tüketildiyse sunucu
 * üretimi sürebilir, istemci dosyayı kaydetmez (`disposed`; 13 mekanizma §3.1).
 */
import { ApiError, normalizeErrorResponse, toApiError } from '@/shared/errors/api-error'
import { api } from '@/shared/http'

import { dispositionName, safeFileName, saveBlob, ticketOf } from './save'
import type { DownloadRedeemResult } from './types'

/** Bileti tüketir ve kaydeder; `Content-Disposition` adı yoksa `fallbackName` kullanılır. */
export async function redeemAndSave(
  ticketUrl: string,
  fallbackName: string,
  signal?: AbortSignal,
): Promise<DownloadRedeemResult> {
  const ticket = ticketOf(ticketUrl)
  if (ticket === null) {
    const error = new ApiError({ code: 'client.invalid_response' })
    return { kind: 'failed', error, retryAfter: null }
  }
  try {
    const result = await api.GET('/v1/downloads/{ticket}', {
      params: { path: { ticket } },
      parseAs: 'blob',
      signal,
    })
    if (signal?.aborted) return { kind: 'disposed' }
    if (!result.response.ok) {
      const error = normalizeErrorResponse(result.response, result.error)
      return { kind: 'failed', error, retryAfter: error.retryAfter }
    }
    const name = dispositionName(result.response.headers.get('Content-Disposition'))
    const fileName = safeFileName(name ?? fallbackName, fallbackName)
    saveBlob(result.data as Blob, fileName)
    return { kind: 'saved', fileName }
  } catch (cause) {
    if (signal?.aborted) return { kind: 'disposed' }
    const error = toApiError(cause)
    return { kind: 'failed', error, retryAfter: error.retryAfter }
  }
}
