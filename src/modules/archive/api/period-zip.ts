/**
 * Dönem arşivi ZIP'i (BE-120/BE-124): `issueDownloadTicket` (S1; hedef `programArchiveZip`, S2 —
 * yalnız program başlığı) → hemen `redeemDownloadTicket` (S0). Akış `shared/download` ile aynıdır
 * (kapalı bilet listesi, bilet önbelleğe girmez, `Retry-After` korunur, otomatik tekrar yok);
 * fark yalnız tüketimde: yanıt `X-Result-Truncated: true` başlığını taşıyorsa (raporlu ZIP'te
 * gömülü rapor satır/not sınırında kesildi, RECORDS-K43) sonuç `truncated` olur. Sözleşme tüketimde
 * yalnız gövde, Content-Type ve Content-Disposition'ı güvence eder; başlık gelmezse uyarı çıkmaz
 * (PDF içindeki "gösterilen/toplam" uyarısı geçerlidir).
 *
 * Sahip bilet beklerken söküldüyse ya da `signal` iptal edildiyse bilet TÜKETİLMEZ (`disposed`).
 */
import { programHeaders } from '@/modules/work/public'
import {
  dispositionName,
  linkSignals,
  safeFileName,
  saveBlob,
  ticketBody,
  ticketOf,
  type DownloadTarget,
  type DownloadTicket,
} from '@/shared/download'
import { ApiError, normalizeErrorResponse, toApiError } from '@/shared/errors/api-error'
import { api } from '@/shared/http'
import { ownerLife, useProtectedMutation } from '@/shared/http/mutation'

import type { ArchiveDownloadResult, PeriodZipRequest } from '../model/types'

/** Bilet hedefi: S2 dönem ZIP'i; `include_reports` yalnız raporlu istekte yazılır. */
export function periodZipTarget(request: PeriodZipRequest): DownloadTarget {
  const query = request.includeReports ? '?include_reports=true' : ''
  return {
    method: 'GET',
    path: `/v1/program/archive/download-zip${query}`,
    headers: programHeaders({ programId: request.programId }),
    fallbackName: request.fallbackName,
  }
}

/** Bileti tüketir ve kaydeder; kesme başlığı varsa sonuca yazar. */
async function redeemZip(
  ticketUrl: string,
  fallbackName: string,
  signal?: AbortSignal,
): Promise<ArchiveDownloadResult> {
  const ticket = ticketOf(ticketUrl)
  if (ticket === null) {
    return {
      kind: 'failed',
      error: new ApiError({ code: 'client.invalid_response' }),
      retryAfter: null,
    }
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
    const truncated = result.response.headers.get('X-Result-Truncated') === 'true'
    return { kind: 'saved', fileName, ...(truncated ? { truncated } : {}) }
  } catch (cause) {
    if (signal?.aborted) return { kind: 'disposed' }
    const error = toApiError(cause)
    return { kind: 'failed', error, retryAfter: error.retryAfter }
  }
}

export function usePeriodZipDownload() {
  let external: AbortSignal | undefined
  const ticket = useProtectedMutation<PeriodZipRequest, DownloadTicket>({
    operation: 'issueDownloadTicket',
    gcTime: 0,
    send: (vars, ctx) => {
      const target = periodZipTarget(vars)
      return api.POST('/v1/download-tickets', {
        params: { header: target.headers },
        body: ticketBody(target),
        signal: linkSignals(ctx.signal, external),
      })
    },
  })
  const owner = ownerLife()

  async function start(
    request: PeriodZipRequest,
    signal?: AbortSignal,
  ): Promise<ArchiveDownloadResult> {
    if (signal?.aborted) return { kind: 'disposed' }
    external = signal
    const outcome = await ticket.submit(request)
    try {
      if (signal?.aborted && outcome.kind !== 'success') return { kind: 'disposed' }
      if (outcome.kind !== 'success') return { kind: 'ticket_failed', outcome }
      // Sahip söküldü ya da eylem iptal: bilet tüketilmez, indirme açılmaz.
      if (!owner.alive() || signal?.aborted) return { kind: 'disposed' }
      return await redeemZip(outcome.data.url, request.fallbackName, signal)
    } finally {
      // Bilet bellekte kalmaz (hata yolunda ve söküm sonrasında da).
      ticket.reset()
      external = undefined
    }
  }
  return { start, isPending: ticket.isPending }
}
