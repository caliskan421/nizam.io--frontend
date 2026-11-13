/**
 * Sorgu tekrarı: yalnız geçici hatalarda (ağ, 5xx), en çok iki kez. 4xx bir hükümdür, tekrarlanmaz.
 * Oturum değiştiyse (`SessionChangedError`, CX-F1-Ö-08) eski sorgu yeni kimlikle sürdürülmez.
 * Ortak okuyucu kuralı: work, organization, home ve reports bunu paylaşır (modüller birbirinin
 * `public.ts`'inden yalnız ihtiyaç duyduğunu alsın diye shared'da; W142 KUSUR 4).
 */
import { ApiError } from '@/shared/errors/api-error'
import { SessionChangedError } from '@/shared/session/query-session'

export function retryTransient(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2 || error instanceof SessionChangedError) return false
  if (!(error instanceof ApiError)) return true
  return error.status === null || error.status >= 500
}
