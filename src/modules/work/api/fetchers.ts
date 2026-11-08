/**
 * Görev okuma uçları (03 `backend.md` §1). Her çağrı tek uç, tek istek; departmanlar arası
 * fan-out yoktur (K3, ortak-kurallar §9). Kapsam başlıkları isteğe özeldir (`./http`).
 */
import { api, unwrap } from '@/shared/http'

import type { ProgramTarget, WorkTarget } from '../model/types'
import { programHeaders, scopeHeaders, WORK_ITEM_PAGE_LIMIT } from './http'

/**
 * `listProgramWorkItems` (S2) bir sayfa: `limit` 200 (sayfa boyu), isteğe bağlı TEK
 * `department_id`, imleç. Sunucu sırası `(created_at, id)`; toplam/sayaç yok (BE-003).
 */
export function fetchWorkItemPage(
  target: ProgramTarget,
  departmentId: string | null,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/program/work-items', {
      params: {
        header: programHeaders(target),
        query: {
          limit: WORK_ITEM_PAGE_LIMIT,
          ...(departmentId ? { department_id: departmentId } : {}),
          ...(cursor ? { cursor } : {}),
        },
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
 * seçenekleri. Sayfasız; > 200 bağda ilk 200 + `X-Result-Truncated: true`.
 */
export function fetchProgramDepartments(target: ProgramTarget, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/program/departments', { params: { header: programHeaders(target) }, signal }),
  )
}
