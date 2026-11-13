/**
 * İndirme sonucunun rapor sonucuna çevrilmesi (saf; yan etkiler çağıranın kancalarıyla). Sayaç
 * yalnız `Retry-After` taşıyan 429'larda başlar (`export_in_progress`, `rate_limited`).
 */
import type { ApiError } from '@/shared/errors/api-error'
import type { DownloadResult } from '@/shared/download'

import { classifyFailure, classifyTicketOutcome } from './failure'
import type { ReportFailure, ReportRequest, ReportRunResult } from './types'

const COOLDOWN_KINDS: ReadonlySet<ReportFailure['kind']> = new Set([
  'export_in_progress',
  'rate_limited',
])

export interface SettleHooks {
  /** Kaydedildi (bildirim). */
  saved: (fileName: string) => void
  /** Tüketimde hedefin hatası (ortak yetki kaybı kanalı). */
  consumeError: (error: ApiError) => void
  /** `Retry-After` geri sayımı. */
  cooldown: (seconds: number) => void
}

export function settleDownload(
  result: DownloadResult<ReportRequest>,
  hooks: SettleHooks,
): ReportRunResult {
  const fail = (failure: ReportFailure): ReportRunResult => {
    if (COOLDOWN_KINDS.has(failure.kind) && failure.retryAfter !== null) {
      hooks.cooldown(failure.retryAfter)
    }
    return { kind: 'failed', failure }
  }
  switch (result.kind) {
    case 'saved':
      hooks.saved(result.fileName)
      return { kind: 'saved', fileName: result.fileName }
    case 'failed':
      hooks.consumeError(result.error)
      return fail(classifyFailure(result.error, result.retryAfter))
    case 'ticket_failed': {
      const failure = classifyTicketOutcome(result.outcome)
      return failure === null ? { kind: 'cancelled' } : fail(failure)
    }
    case 'disposed':
      return { kind: 'cancelled' }
  }
}
