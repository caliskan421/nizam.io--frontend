/**
 * Raporlar modülünün tip sözlüğü (13 Raporlar; F6, W136). Sunucu şekilleri yalnız üretilmiş
 * şemadan türetilir; burada istemci bileşimleri durur: rapor türü, indirme isteği, sınıflandırılmış
 * hata ve eylem sonucu.
 */
import type { components } from '@/shared/api/schema'
import type { DownloadTicketFailed } from '@/shared/download'

type Schemas = components['schemas']

export type SeasonReport = Schemas['SeasonReport']
export type ReportMeetingDetail = Schemas['ReportMeetingDetail']
export type ReportTaskDetail = Schemas['ReportTaskDetail']
export type WorkloadPdfRequest = Schemas['WorkloadPdfRequest']

/** Dört PDF bilet hedefi (`reportSeasonPdf`, `reportWorkloadPdf`, `reportMeetingPdf`, `reportTaskPdf`). */
export const REPORT_KINDS = ['season', 'workload', 'meeting', 'task'] as const
export type ReportKind = (typeof REPORT_KINDS)[number]

/** Bir rapor PDF'i isteği; kapsam (program) eylem başında yakalanır. */
export interface ReportRequest {
  kind: ReportKind
  /** Seçili program (S2 başlığı; eylem anında yakalanır). */
  programId: string
  /** `meeting` ve `task` için kayıt kimliği. */
  targetId?: string
  /** `workload` için seçili üyeler; boş/yok = bütün üyeler (açık boş dizi gönderilir). */
  memberIds?: readonly string[]
}

/** Hata sınıfları (13 `mekanizma.md` §3.1, `backend.md` §3.2). */
export const REPORT_FAILURE_KINDS = [
  'export_in_progress',
  'rate_limited',
  'capacity_full',
  'not_authorized',
  'not_found',
  'input_invalid',
  'too_large',
  'ticket_invalid',
  'retry',
  'report_failed',
  'unavailable',
  'network',
  'other',
] as const
export type ReportFailureKind = (typeof REPORT_FAILURE_KINDS)[number]

export interface ReportFailure {
  kind: ReportFailureKind
  /** Sunucu (ya da istemci) hata kodu; kullanıcı metni `messageKey`'den gelir. */
  code: string
  /** i18n anahtarı (`errors.*` ya da `reports.failure.*`); sunucu `message` alanı gösterilmez. */
  messageKey: string
  /**
   * `Retry-After` saniyesi; YALNIZ başlık varsa (sayaç gösterilir). Başlık yoksa `null`
   * (503 `reporting.capacity_full`: sayaç yok, "Yeniden dene"; BE-135).
   */
  retryAfter: number | null
}

/** Rapor eylemi sonucu (fırlatmaz). `cancelled`: sahip/kapsam/oturum/"İptal" — bildirim yok. */
export type ReportRunResult =
  | { kind: 'saved'; fileName: string }
  | { kind: 'failed'; failure: ReportFailure }
  | { kind: 'locked' }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' }

export type ReportTicketFailed = DownloadTicketFailed<ReportRequest>

/** Eylem girdisi: kapsam (program) eylem anında kapsam deposundan eklenir. */
export type ReportRunInput = Omit<ReportRequest, 'programId'>
