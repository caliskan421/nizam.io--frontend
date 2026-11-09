/**
 * Organizasyon uçlarının ortak HTTP yardımcıları.
 *
 *  - Kapsam: kullanıcı/hesap/katalog uçları S1 (başlıksız); üyelik, ekip, program bağı ve rapor
 *    uçları S2 — YALNIZ `X-Nizamio-Program`; departman YOL parametresidir, `X-Nizamio-Department`
 *    gönderilmez (05 backend §6). Program başlığı açıkça eylemin/sorgunun anlık görüntüsünden
 *    yazılır (HTTP ara katmanı açık başlığı depo kapsamının önüne koyar; W16 devri).
 *  - Tavan: `listMembers`, `listAssignable`, `listProgramDepartments`, `listDepartments`
 *    sayfasız ≤200 + `X-Result-Truncated` (GAP-027); `listUsers` imleçli (200/sayfa) ve aynı
 *    başlığı taşır. Kesme bayrağı yanıt nesnesine bağlanır (`unwrapMarked` / `isTruncated`):
 *    sorgu önbelleğindeki veri şekli ham sözleşme şeklidir (ortak anahtarları paylaşan work ve
 *    kabuk okuyucularıyla uyumlu).
 *  - Okumalarda yalnız geçici hatalar tekrarlanır (`retryTransient`, work ile aynı kural).
 */
import { toRaw } from 'vue'

import { api, unwrap } from '@/shared/http'

import type { FetchResultLike } from '../model/types'

export { retryTransient } from '@/modules/work/public'

/** `listUsers` sayfa boyu (P4, §10: sayfa tavanı ≠ toplam tavanı). */
export const USER_PAGE_LIMIT = 200
/** `listDeletedDepartments` sayfa boyu. */
export const DELETED_DEPARTMENT_PAGE_LIMIT = 200
export const TRUNCATED_HEADER = 'X-Result-Truncated'
export const ORGANIZATION_STALE_MS = 30_000

/** S2: yalnız program başlığı. */
export function programHeader(programId: string) {
  return { 'X-Nizamio-Program': programId }
}

const truncatedResults = new WeakSet<object>()

/** Yanıtı veriye çevirir; `X-Result-Truncated: true` ise veri nesnesini işaretler. */
export async function unwrapMarked<D extends object>(call: Promise<FetchResultLike<D>>) {
  let truncated = false
  const data = await unwrap(
    call.then((result) => {
      truncated = result.response.headers.get(TRUNCATED_HEADER) === 'true'
      return result
    }),
  )
  if (truncated) truncatedResults.add(data)
  return data
}

/**
 * Sunucu listeyi kesti mi. Bayrak yalnız bu modülün okuyucusunun doldurduğu önbellek girdisinde
 * bilinir; aynı anahtarı başka okuyucu (work / kabuk) doldurduysa `false` döner (bkz. W71 raporu).
 */
export function isTruncated(data: unknown): boolean {
  // vue-query sonucu reaktif vekil olarak verir; işaret ham nesnededir.
  return typeof data === 'object' && data !== null && truncatedResults.has(toRaw(data))
}

/** Program başlığı açıkça verilen tek S2 okuması (kapsamsız istek atılmaz: `enabled`). */
export function readProgramDepartments(programId: string, signal?: AbortSignal) {
  return unwrapMarked(
    api.GET('/v1/program/departments', { params: { header: programHeader(programId) }, signal }),
  )
}
