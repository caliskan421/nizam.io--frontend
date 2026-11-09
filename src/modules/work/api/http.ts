/**
 * Görev uçlarının ortak HTTP yardımcıları.
 *
 *  - Kapsam başlıkları İSTEĞE ÖZELDİR: hedef (`WorkTarget` — görevin kendi program/departmanı
 *    ya da seçilen departman) doğrudan `X-Nizamio-*` başlığına yazılır; HTTP ara katmanı
 *    (`shared/http/client.ts` `applyScopeHeaders`) açık başlığı depo kapsamının önüne koyar.
 *    Korumalı yazmada hedef eylem değişkenindedir ve eylemle dondurulur: gönderim kapısından
 *    sonra kapsam değişse de istek eylemin kapsamıyla gider (W16 devri, CX-F0-E-06).
 *  - Okumalarda yalnız geçici hatalar (ağ, 5xx) en çok iki kez tekrarlanır; 4xx bir hükümdür.
 */
import { ApiError } from '@/shared/errors/api-error'
import { SessionChangedError } from '@/shared/session/query-session'

import type { ProgramTarget, WorkTarget } from '../model/types'

/** S3: görevin (ya da seçilen departmanın) program + departman başlıkları. */
export function scopeHeaders(target: WorkTarget) {
  return {
    'X-Nizamio-Program': target.programId,
    'X-Nizamio-Department': target.departmentId,
  }
}

/** S2: yalnız program başlığı. */
export function programHeaders(target: ProgramTarget) {
  return { 'X-Nizamio-Program': target.programId }
}

/**
 * Sorgu tekrarı: yalnız geçici hatalarda (ağ, 5xx), en çok iki kez. Oturum değiştiyse
 * (`SessionChangedError`, CX-F1-Ö-08) eski sorgu yeni kimlikle sürdürülmez.
 */
export function retryTransient(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2 || error instanceof SessionChangedError) return false
  if (!(error instanceof ApiError)) return true
  return error.status === null || error.status >= 500
}

/** `listProgramWorkItems` sayfa boyu (P4, ortak-kurallar §10: sayfa tavanı ≠ toplam tavanı). */
export const WORK_ITEM_PAGE_LIMIT = 200
