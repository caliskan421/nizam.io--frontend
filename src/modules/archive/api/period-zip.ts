/**
 * Dönem arşivi ZIP'i (BE-120/BE-124): `issueDownloadTicket` (S1; hedef `programArchiveZip`, S2 —
 * yalnız program başlığı) → hemen `redeemDownloadTicket` (S0). Akış ortak `shared/download`
 * akışıdır (kapalı bilet listesi, bilet önbelleğe girmez, `Retry-After` korunur, otomatik tekrar
 * yok); `X-Result-Truncated: true` (raporlu ZIP'te gömülü rapor kesildi, RECORDS-K43) ortak
 * tüketimde `truncated` olur. Sahip bilet beklerken söküldüyse ya da `signal` iptal edildiyse bilet
 * TÜKETİLMEZ (`disposed`).
 */
import { programHeaders } from '@/modules/work/public'
import { useDownloadFlow, type DownloadStartOptions, type DownloadTarget } from '@/shared/download'

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

export function usePeriodZipDownload() {
  const flow = useDownloadFlow<PeriodZipRequest>(periodZipTarget)
  const start = (
    request: PeriodZipRequest,
    options?: DownloadStartOptions,
  ): Promise<ArchiveDownloadResult> => flow.start(request, options)
  return { start, isPending: flow.isPending }
}
