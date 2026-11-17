import { api, unwrap } from '@/shared/http'

import type { CandidatePurpose, ChatListQuery, MessageQuery, RefKind } from '../model/types'
import { programHeaders } from './http'

export const CHAT_LIST_LIMIT = 50
export const REF_PAGE_LIMIT = 50

export function fetchChats(programId: string, query: ChatListQuery, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/chats', {
      params: {
        header: programHeaders({ programId }),
        query: {
          limit: CHAT_LIST_LIMIT,
          ...(query.q ? { q: query.q } : {}),
          ...(query.kind ? { kind: query.kind } : {}),
          ...(query.unread ? { unread: true } : {}),
          ...(query.cursor ? { cursor: query.cursor } : {}),
        },
      },
      signal,
    }),
  )
}

export function fetchChat(programId: string, chatId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/chats/{chatId}', {
      params: { header: programHeaders({ programId }), path: { chatId } },
      signal,
    }),
  )
}

export function fetchMessages(
  programId: string,
  chatId: string,
  query: MessageQuery,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/messages', {
      params: { header: programHeaders({ programId }), path: { chatId }, query },
      signal,
    }),
  )
}

export function fetchPins(programId: string, chatId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/pins', {
      params: { header: programHeaders({ programId }), path: { chatId } },
      signal,
    }),
  )
}

export function fetchMembers(programId: string, chatId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/members', {
      params: { header: programHeaders({ programId }), path: { chatId } },
      signal,
    }),
  )
}

export function fetchCandidates(
  programId: string,
  purpose: CandidatePurpose,
  chatId: string | null,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/candidates', {
      params: {
        header: programHeaders({ programId }),
        query: { purpose, ...(chatId ? { chat_id: chatId } : {}) },
      },
      signal,
    }),
  )
}

export function fetchRefSummary(programId: string, refId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/chat-refs/{refId}', {
      params: { header: programHeaders({ programId }), path: { refId } },
      signal,
    }),
  )
}

export function fetchRefs(
  programId: string,
  chatId: string,
  kind: RefKind,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/chats/{chatId}/refs', {
      params: {
        header: programHeaders({ programId }),
        path: { chatId },
        query: { kind, limit: REF_PAGE_LIMIT, ...(cursor ? { cursor } : {}) },
      },
      signal,
    }),
  )
}

/** Programlar arası okunmamış özeti (S1; program başlığı YOK). */
export function fetchUnreadOverview(signal?: AbortSignal) {
  return unwrap(api.GET('/v1/me/chat-unread', { signal }))
}
