/**
 * Rapor PDF'lerinin bilet hedefleri (kapalı liste: dört PDF; `backend.md` §1.1–§1.5). Yol
 * çağırandadır: kimlik kodlanır, ham sorgu dizesi yoktur. İş yükü tek POST hedefidir: gövde
 * `{member_ids: [...]}` — seçim yokken AÇIK boş dizi (bilet POST hedefi boş olmayan JSON nesnesi
 * ister; `dogrulama.md` #9).
 */
import type { DownloadTarget } from '@/shared/download'

import type { ReportKind, ReportRequest, WorkloadPdfRequest } from './types'

/** Sunucu `Content-Disposition` vermezse kaydedilecek yedek adlar (yalnız ASCII). */
export const REPORT_FALLBACK_NAMES: Readonly<Record<ReportKind, string>> = {
  season: 'donem-raporu.pdf',
  meeting: 'toplanti-raporu.pdf',
  task: 'gorev-raporu.pdf',
  workload: 'is-yuku-raporu.pdf',
}

export const SEASON_PDF_PATH = '/v1/reports/season/pdf'
export const WORKLOAD_PDF_PATH = '/v1/reports/workload'

/** Kayıt kimlikli türlerde kimlik zorunludur (programlama hatası: açık hata). */
function requireId(request: ReportRequest): string {
  if (request.targetId === undefined || request.targetId === '') {
    throw new Error(`rapor hedefi: ${request.kind} için kayıt kimliği gerekli`)
  }
  return encodeURIComponent(request.targetId)
}

export function reportPath(request: ReportRequest): string {
  switch (request.kind) {
    case 'season':
      return SEASON_PDF_PATH
    case 'workload':
      return WORKLOAD_PDF_PATH
    case 'meeting':
      return `/v1/reports/meetings/${requireId(request)}/pdf`
    case 'task':
      return `/v1/reports/tasks/${requireId(request)}/pdf`
  }
}

/** İş yükü PDF'i gövdesi: tekrarlanan kimlikler tekilleşir; sıra korunur. */
export function workloadBody(memberIds: readonly string[] | undefined): WorkloadPdfRequest {
  return { member_ids: [...new Set(memberIds ?? [])] }
}

/** Bilet hedefi: S2 (program başlığı bilete yazılır). */
export function reportTarget(request: ReportRequest): DownloadTarget {
  const base = {
    path: reportPath(request),
    headers: { 'X-Nizamio-Program': request.programId },
    fallbackName: REPORT_FALLBACK_NAMES[request.kind],
  }
  if (request.kind === 'workload') {
    return { ...base, method: 'POST', body: workloadBody(request.memberIds) }
  }
  return { ...base, method: 'GET' }
}
