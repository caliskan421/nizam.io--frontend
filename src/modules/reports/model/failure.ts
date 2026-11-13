/**
 * Rapor indirme hatalarının sınıflandırması (13 `mekanizma.md` §3.1, `backend.md` §3.2). Otomatik
 * tekrar YOKTUR; sonuç kullanıcıya durum kartı olarak gider, metin yalnız i18n'den (sunucu
 * `message` gösterilmez).
 *
 *  - 429 `reporting.export_in_progress`: sayaç yalnız `Retry-After` başlığı varsa (sunucuda sabit
 *    1 sn, gerçek kalan süre değil; BE-135).
 *  - 429 `platform.rate_limited` (bilet tavanı 16 açık bilet ya da dışa aktarım kotası):
 *    `Retry-After` ile sayaç.
 *  - 503 `reporting.capacity_full`: başlık yok, sayaç yok, "Yeniden dene" (E-13-71).
 *  - 403 `reporting.not_authorized`: yetki düştü (`me` yeniden okunur — çağıran).
 *  - 404 `reporting.not_found`: kayıt silinmiş/kapsam dışı (panel/sayfa kapanır — çağıran).
 *  - 422 `reporting.input_invalid`: iş yükü `member_ids` geçersiz → seçim yenilenir.
 *  - 404 `identity.download_ticket_invalid`: bilet ömrünü doldurdu → kullanıcı yeniden tıklar.
 *  - 500 `audit.entry_rejected` / `platform.internal` / `platform.panic`: "Rapor oluşturulamadı".
 */
import type { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'

import type { ReportFailure, ReportFailureKind } from './types'

const KIND_BY_CODE: Readonly<Record<string, ReportFailureKind>> = {
  'reporting.export_in_progress': 'export_in_progress',
  'platform.rate_limited': 'rate_limited',
  'reporting.capacity_full': 'capacity_full',
  'reporting.not_authorized': 'not_authorized',
  'reporting.not_found': 'not_found',
  'reporting.input_invalid': 'input_invalid',
  'platform.body_too_large': 'too_large',
  'platform.body_invalid': 'too_large',
  'identity.download_ticket_invalid': 'ticket_invalid',
  'platform.conflict_retry': 'retry',
  'audit.entry_rejected': 'report_failed',
  'platform.internal': 'report_failed',
  'platform.panic': 'report_failed',
  'identity.unavailable': 'unavailable',
  'organization.authority_unavailable': 'unavailable',
  'client.network_error': 'network',
}

/** Kullanıcıya özgü metni olan sınıflar (`reports.failure.*`); diğerleri `errors.*` anahtarını kullanır. */
const OWN_MESSAGE: ReadonlySet<ReportFailureKind> = new Set([
  'export_in_progress',
  'capacity_full',
  'input_invalid',
  'too_large',
  'report_failed',
])

export function failureKind(code: string): ReportFailureKind {
  return KIND_BY_CODE[code] ?? 'other'
}

/** Hata + `Retry-After` → sınıflandırılmış hata. Sayaç yalnız başlık varsa (`retryAfter > 0`). */
export function classifyFailure(error: ApiError, retryAfter: number | null): ReportFailure {
  const kind = failureKind(error.code)
  return {
    kind,
    code: error.code,
    messageKey: OWN_MESSAGE.has(kind) ? `reports.failure.${kind}` : error.messageKey,
    retryAfter: retryAfter !== null && retryAfter > 0 ? retryAfter : null,
  }
}

/**
 * Bilet ÜRETİMİ sonucu başarısızsa hata; sessiz sonuçlar (kapsam/sahip) için `null` (iptal sayılır).
 * Ağ kopması/5xx (`unknown_outcome`) bilet için "yeniden dene"dir (bilet tüketilmemiştir).
 */
export function classifyTicketOutcome<V, D, S>(
  outcome: MutationOutcome<V, D, S>,
): ReportFailure | null {
  switch (outcome.kind) {
    case 'scope_changed':
    case 'owner_disposed':
      return null
    case 'rate_limited':
    case 'failed':
    case 'conflict_retry':
    case 'idempotency_key_reused':
      return classifyFailure(outcome.error, 'retryAfter' in outcome ? outcome.retryAfter : null)
    case 'unknown_outcome':
      return classifyFailure(outcome.error, null)
    default:
      return {
        kind: 'other',
        code: 'platform.internal',
        messageKey: 'errors.platform.internal',
        retryAfter: null,
      }
  }
}
