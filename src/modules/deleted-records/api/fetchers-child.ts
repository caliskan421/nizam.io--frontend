/**
 * Yeni çocuk türlerin silinen kayıt okuyucuları (v0.26; dosya, alt görev, görev notu, toplantı
 * notu, gündem): S2, yalnız şirket yöneticisi, program başlığı zorunlu. Mevcut listelerle aynı
 * sunucu süzgeç/sıra parametrelerini ve sayfa boyunu (`DELETED_PAGE_LIMIT`) kullanır; imleç
 * süzgeç/sıraya bağlıdır (değişince ilk sayfa). Zarf `{items, next_cursor, total}`.
 */
import { programHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'

import type { ListQuery } from '../model/filters'
import { page } from './fetchers'

export function fetchDeletedFiles(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/files', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}

export function fetchDeletedSubtasks(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/subtasks', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}

export function fetchDeletedTaskNotes(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/task-notes', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}

export function fetchDeletedMeetingNotes(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/meeting-notes', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}

export function fetchDeletedAgendaItems(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/agenda-items', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}
