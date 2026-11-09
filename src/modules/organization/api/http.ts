/**
 * Organizasyon uçlarının ortak HTTP yardımcıları.
 *
 *  - Kapsam: kullanıcı/hesap/katalog uçları S1 (başlıksız); üyelik, ekip, program bağı ve rapor
 *    uçları S2 — YALNIZ `X-Nizamio-Program`; departman YOL parametresidir, `X-Nizamio-Department`
 *    gönderilmez (05 backend §6). Program başlığı açıkça eylemin/sorgunun anlık görüntüsünden
 *    yazılır (HTTP ara katmanı açık başlığı depo kapsamının önüne koyar; W16 devri).
 *  - Tavan: `listMembers`, `listAssignable`, `listProgramDepartments`, `listDepartments`
 *    sayfasız ≤200 + `X-Result-Truncated` (GAP-027); `listUsers` imleçli (200/sayfa) ve aynı
 *    başlığı taşır. Kesme bayrağı ortak yardımcıyla önbellek verisinde (`truncated: true`); aynı
 *    anahtarı paylaşan work / kabuk okuyucuları da aynı yardımcıyı kullanır (hangisi önce
 *    doldurursa doldursun bayrak doğrudur).
 *  - Okumalarda yalnız geçici hatalar tekrarlanır (`retryTransient`, work ile aynı kural).
 */
import { api } from '@/shared/http'
import { unwrapList } from '@/shared/http/truncation'

export { isListTruncated as isTruncated, unwrapList } from '@/shared/http/truncation'

export { retryTransient } from '@/modules/work/public'

/** `listUsers` sayfa boyu (P4, §10: sayfa tavanı ≠ toplam tavanı). */
export const USER_PAGE_LIMIT = 200
/** `listDeletedDepartments` sayfa boyu. */
export const DELETED_DEPARTMENT_PAGE_LIMIT = 200
export const ORGANIZATION_STALE_MS = 30_000

/** S2: yalnız program başlığı. */
export function programHeader(programId: string) {
  return { 'X-Nizamio-Program': programId }
}

/** Program başlığı açıkça verilen tek S2 okuması (kapsamsız istek atılmaz: `enabled`). */
export function readProgramDepartments(programId: string, signal?: AbortSignal) {
  return unwrapList(
    api.GET('/v1/program/departments', { params: { header: programHeader(programId) }, signal }),
  )
}
