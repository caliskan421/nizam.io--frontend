/**
 * İndirme sonucunun rapor sonucuna çevrilmesi (saf; yan etkiler çağıranın kancalarıyla). Sayaç
 * yalnız `Retry-After` taşıyan yanıtlarda başlar: 429 (`export_in_progress`, `rate_limited`) ve —
 * pin v0.23.0-api, BE-135 — 503 `reporting.capacity_full`. Başlık yoksa sayaç yoktur.
 */
import type { ApiError } from '@/shared/errors/api-error'
import type { DownloadResult } from '@/shared/download'

import { classifyFailure, classifyTicketOutcome } from './failure'
import type { ReportFailure, ReportRequest, ReportRunResult } from './types'

const COOLDOWN_KINDS: ReadonlySet<ReportFailure['kind']> = new Set([
  'export_in_progress',
  'rate_limited',
  'capacity_full',
])

export interface SettleHooks {
  /** Kaydedildi (bildirim). */
  saved: (fileName: string) => void
  /** Tüketimde hedefin hatası (ortak yetki kaybı kanalı). */
  consumeError: (error: ApiError) => void
  /** `Retry-After` geri sayımı. */
  cooldown: (seconds: number) => void
}

/** Ortak bekleme politikası: yalnız `Retry-After` taşıyan 429/503'ler sayaç başlatır (indirme + JSON okuma). */
export function applyCooldown(failure: ReportFailure, start: (seconds: number) => void): void {
  if (COOLDOWN_KINDS.has(failure.kind) && failure.retryAfter !== null) start(failure.retryAfter)
}

export function settleDownload(
  result: DownloadResult<ReportRequest>,
  hooks: SettleHooks,
): ReportRunResult {
  const fail = (failure: ReportFailure): ReportRunResult => {
    applyCooldown(failure, hooks.cooldown)
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
