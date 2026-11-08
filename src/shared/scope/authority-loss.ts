/**
 * Yetki kaybı sinyalleri (K6 + sentez Y1). Bu kodlardan biri gelince `me`, `me/departments`
 * ve program listesi geçersizlenir, kapsam yeniden doğrulanır. Gizleme güvenlik değildir;
 * 403/404 gerçek sonuçtur — burada yalnız istemcinin görünümü tazelenir.
 *
 * Her 403/404 kapsam kaybı değildir (Y1 notu): `organization.not_authorized` yöneticilik/
 * koordinatörlük kaybıdır (27 org ucu), `reporting.not_authorized` yöneticiliğin düştüğünü,
 * `work.not_authorized` (Gantt yüzleri) koordinatörlüğün düştüğünü gösterebilir. Hepsinde
 * doğru tepki aynıdır: standing'i sunucudan yeniden oku.
 */
import type { ServerErrorCode } from '@/shared/api/error-codes.gen'
import { ApiError } from '@/shared/errors/api-error'

export const AUTHORITY_LOSS_CODES = [
  'organization.not_authorized',
  'organization.membership_required',
  'work.program_scope_invalid',
  'program.not_found',
  'reporting.not_authorized',
  'work.not_authorized',
] as const satisfies readonly ServerErrorCode[]

const LOSS: ReadonlySet<string> = new Set(AUTHORITY_LOSS_CODES)

export function isAuthorityLoss(error: unknown): boolean {
  return error instanceof ApiError && LOSS.has(error.code)
}

export function hasErrorCode(error: unknown, code: ServerErrorCode): boolean {
  return error instanceof ApiError && error.code === code
}
