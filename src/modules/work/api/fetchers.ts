/**
 * Görev okuma uçları (03 `backend.md` §1). Her çağrı tek uç, tek istek; departmanlar arası
 * fan-out yoktur (K3, ortak-kurallar §9). Kapsam başlıkları isteğe özeldir (`./http`).
 */
import { api, unwrap } from '@/shared/http'
import { fetchProgramDepartments as fetchSharedProgramDepartments } from '@/shared/scope/standing'

import type { ProgramTarget, WorkTarget } from '../model/types'
import { programHeaders, scopeHeaders, WORK_ITEM_PAGE_LIMIT } from './http'

/** Sunucu atanan süzgecinin üst sınırı (`assignee_account_id`, en çok 50 değer; BE-038). */
export const ASSIGNEE_FILTER_MAX = 50

/** Tekrarsız, sıralı, üst sınırlı atanan kimlikleri (kararlı sorgu anahtarı ve istek). */
export function normalizeAssignees(ids: readonly string[] | undefined): string[] {
  return [...new Set((ids ?? []).filter((id) => id !== ''))].sort().slice(0, ASSIGNEE_FILTER_MAX)
}

/** Liste ve sayaç uçlarının ortak sorgu süzgeci (tek `department_id`, çoklu atanan; VEYA). */
function filterQuery(departmentId: string | null, assigneeIds: readonly string[] | undefined) {
  const assignees = normalizeAssignees(assigneeIds)
  return {
    ...(departmentId ? { department_id: departmentId } : {}),
    ...(assignees.length > 0 ? { assignee_account_id: assignees } : {}),
  }
}

/**
 * `listProgramWorkItems` (S2) bir sayfa: `limit` 200 (sayfa boyu), isteğe bağlı TEK
 * `department_id`, isteğe bağlı çoklu `assignee_account_id` (BE-038; görünürlükle kesişir),
 * imleç. Sunucu sırası `(created_at, id)`; toplam/sayaç bu uçta yok (`fetchWorkItemCounts`).
 */
export function fetchWorkItemPage(
  target: ProgramTarget,
  departmentId: string | null,
  cursor: string | undefined,
  signal?: AbortSignal,
  assigneeIds?: readonly string[],
) {
  return unwrap(
    api.GET('/v1/program/work-items', {
      params: {
        header: programHeaders(target),
        query: {
          limit: WORK_ITEM_PAGE_LIMIT,
          ...filterQuery(departmentId, assigneeIds),
          ...(cursor ? { cursor } : {}),
        },
      },
      signal,
    }),
  )
}

/**
 * `countProgramWorkItems` (S2; BE-003): görünür görev toplamı, beş durum, `overdue` ve
 * `pending_date_requests`. Görünürlük ve süzgeçler (`department_id`, `assignee_account_id`)
 * listeyle AYNIDIR; `limit`/`cursor` yok. Sayaçlar kesindir (imleç tamlığından bağımsız).
 */
export function fetchWorkItemCounts(
  target: ProgramTarget,
  departmentId: string | null,
  assigneeIds?: readonly string[],
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/program/work-items/counts', {
      params: {
        header: programHeaders(target),
        query: filterQuery(departmentId, assigneeIds),
      },
      signal,
    }),
  )
}

/** `getWorkItem` (S3, görevin kendi başlıkları). 404 `work.item_not_found` → panel kapanır. */
export function fetchWorkItem(target: WorkTarget, workItemId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/work-items/{id}', {
      params: { header: scopeHeaders(target), path: { id: workItemId } },
      signal,
    }),
  )
}

/** `listWorkItemSubtasks` (S3; sayfasız, görev başına ≤ 50). */
export function fetchSubtasks(target: WorkTarget, workItemId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/work-items/{id}/subtasks', {
      params: { header: scopeHeaders(target), path: { id: workItemId } },
      signal,
    }),
  )
}

/** `listWorkItemFiles` (S3; sayfasız). 03c ve 06 ile aynı anahtar (ortak-kurallar §6). */
export function fetchFiles(target: WorkTarget, workItemId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/work-items/{id}/files', {
      params: { header: scopeHeaders(target), path: { id: workItemId } },
      signal,
    }),
  )
}

/** `listWorkItemNotes` (S3; sayfasız). */
export function fetchNotes(target: WorkTarget, workItemId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/work-items/{id}/notes', {
      params: { header: scopeHeaders(target), path: { id: workItemId } },
      signal,
    }),
  )
}

/**
 * `listProgramDepartments` (S2): ad/kod çözümü bütün rollerde, Admin koordinatörlük süzgeci
 * seçenekleri. Sayfasız; > 200 bağda ilk 200 + `X-Result-Truncated: true` → önbellekte
 * `truncated: true` — anahtarın TEK okuyucusu `shared/scope/standing.ts` (aynı şekil).
 */
export function fetchProgramDepartments(target: ProgramTarget, signal?: AbortSignal) {
  return fetchSharedProgramDepartments(target.programId, signal)
}
