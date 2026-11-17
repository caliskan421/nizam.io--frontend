import { api, unwrap } from '@/shared/http'

import { programHeaders } from './http'

export const SHARED_LIST_LIMIT = 50

export function fetchSharedCounts(programId: string, chatId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/shared-counts', {
      params: { header: programHeaders({ programId }), path: { chatId } },
      signal,
    }),
  )
}

export function fetchAttachments(
  programId: string,
  chatId: string,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/attachments', {
      params: {
        header: programHeaders({ programId }),
        path: { chatId },
        query: { limit: SHARED_LIST_LIMIT, ...(cursor ? { cursor } : {}) },
      },
      signal,
    }),
  )
}

export function fetchTaskLinks(
  programId: string,
  chatId: string,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/task-links', {
      params: {
        header: programHeaders({ programId }),
        path: { chatId },
        query: { limit: SHARED_LIST_LIMIT, ...(cursor ? { cursor } : {}) },
      },
      signal,
    }),
  )
}

/** Mesajdan açılan görevler (tek istek; durum `available`/`forbidden`/`deleted`). */
export function fetchMessageTasks(
  programId: string,
  chatId: string,
  messageId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/messages/{messageId}/tasks', {
      params: { header: programHeaders({ programId }), path: { chatId, messageId } },
      signal,
    }),
  )
}

/** Mesaj okundu bilgisi (yalnız gönderen; başkasının mesajında 403). */
export function fetchReceipts(
  programId: string,
  chatId: string,
  messageId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/messages/{messageId}/receipts', {
      params: { header: programHeaders({ programId }), path: { chatId, messageId } },
      signal,
    }),
  )
}
