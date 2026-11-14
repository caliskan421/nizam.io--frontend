// W160 · O3: sahte sohbet okuma uçları (liste, ayrıntı, mesaj penceresi, üyeler, sabitler, adaylar,
// ref'ler, okunmamış özeti). Üyelik sunucuda uygulanır; mesaj penceresi `listChatMessages`
// anlamını (son sayfa, before, after, around, limit) birebir taklit eder.
import { http, HttpResponse } from 'msw'

import type { ChatMessage } from '@/modules/chat/public'

import { envelope, fakeOrg, json, ORIGIN, type OrgDb } from './fake-org'
import {
  canDirect,
  chatView,
  inProgram,
  isFounder,
  isMember,
  isResponse,
  mentionedIn,
  resolveChat,
  unreadOf,
  viewOf,
  type ChatState,
  type FakeChat,
} from './fake-chat'

const LIMIT_MAX = 200

const num = (value: string | null): number | undefined =>
  value === null || value === '' ? undefined : Number(value)

function pageOf(messages: ChatMessage[], query: URLSearchParams): ChatMessage[] {
  const limit = Math.min(num(query.get('limit')) || 50, LIMIT_MAX)
  const before = num(query.get('before'))
  const after = num(query.get('after'))
  const around = num(query.get('around'))
  if (around !== undefined) {
    const half = Math.floor(limit / 2)
    const before = messages.filter((m) => m.seq < around)
    const below = half > 0 ? before.slice(-half) : []
    const rest = messages.filter((m) => m.seq >= around).slice(0, limit - below.length)
    return [...below, ...rest]
  }
  if (before !== undefined) return messages.filter((m) => m.seq < before).slice(-limit)
  if (after !== undefined) return messages.filter((m) => m.seq > after).slice(0, limit)
  return messages.slice(-limit)
}

/** Birebirde karşı tarafın okuduğu son `seq` (grupta `null`). */
function peerRead(chat: FakeChat, me: string): number | null {
  if (chat.kind !== 'direct') return null
  const peer = chat.members.find((m) => m.account_id !== me)
  return peer ? (chat.reads[peer.account_id] ?? 0) : null
}

function summary(db: OrgDb, chat: FakeChat, me: string) {
  const last = chat.messages.at(-1)
  return {
    ...chatView(db, chat, me),
    last_message: last
      ? {
          body: last.base.body,
          created_at: last.base.created_at,
          deleted: false,
          message_id: last.base.message_id,
          sender_account_id: last.base.sender_account_id,
          sender_name: last.base.sender_name ?? '',
          seq: last.base.seq,
        }
      : null,
    mentioned: mentionedIn(chat, me),
    unread_count: unreadOf(chat, me),
  }
}

function listHandler(db: OrgDb, state: ChatState) {
  return http.get(`${ORIGIN}/v1/chats`, ({ request }) => {
    const me = fakeOrg.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    const program = fakeOrg.programOf(request)
    if (!inProgram(db, me, program)) return envelope('messaging.not_authorized', 403)
    const query = new URL(request.url).searchParams
    const needle = (query.get('q') ?? '').toLocaleLowerCase('tr')
    const rows = state.chats
      .filter((c) => c.program_id === program && isMember(c, me.account_id))
      .map((c) => summary(db, c, me.account_id))
      .filter(
        (c) =>
          needle === '' ||
          (c.name ?? c.counterpart_name ?? '').toLocaleLowerCase('tr').includes(needle),
      )
      .sort((a, b) =>
        (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at),
      )
    const limit = Math.min(num(query.get('limit')) || 50, LIMIT_MAX)
    const from = Number(query.get('cursor') || 0)
    const items = rows.slice(from, from + limit)
    const next = from + limit < rows.length ? String(from + limit) : ''
    return json({ items, next_cursor: next })
  })
}

function detailHandlers(db: OrgDb, state: ChatState) {
  return [
    http.get(`${ORIGIN}/v1/chats/:chatId`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      return json(chatView(db, found.chat, found.account.account_id))
    }),
    http.get(`${ORIGIN}/v1/chats/:chatId/messages`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const me = found.account.account_id
      const all = found.chat.messages.map((m) => viewOf(m, me))
      return json({
        items: pageOf(all, new URL(request.url).searchParams),
        peer_read_seq: peerRead(found.chat, me),
      })
    }),
    http.get(`${ORIGIN}/v1/chats/:chatId/members`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const items = found.chat.members.map((m) => ({
        account_id: m.account_id,
        founder: isFounder(m),
        from_source: m.from_source,
        full_name: fakeOrg.accountName(db, m.account_id),
        role: m.role,
      }))
      return json({ items, truncated: false })
    }),
    http.get(`${ORIGIN}/v1/chats/:chatId/pins`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const me = found.account.account_id
      const items = found.chat.messages
        .filter((m) => m.base.pinned_at !== null)
        .map((m) => viewOf(m, me))
      return json({ items, truncated: false })
    }),
    http.get(`${ORIGIN}/v1/chats/:chatId/refs`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const kind = new URL(request.url).searchParams.get('kind')
      const items = found.chat.messages.flatMap((m) =>
        m.base.refs
          .filter((r) => r.kind === kind)
          .map((r) => ({
            created_at: m.base.created_at,
            kind: r.kind,
            message_id: m.base.message_id,
            ref_id: r.ref_id,
            sender_account_id: m.base.sender_account_id,
            target_id: r.target_id,
          })),
      )
      return json({ items, next_cursor: null })
    }),
  ]
}

function auxHandlers(db: OrgDb, state: ChatState) {
  return [
    http.get(`${ORIGIN}/v1/chats/candidates`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const program = fakeOrg.programOf(request)
      if (!inProgram(db, me, program)) return envelope('messaging.not_authorized', 403)
      const chatId = new URL(request.url).searchParams.get('chat_id')
      const already = new Set(
        state.chats.find((c) => c.chat_id === chatId)?.members.map((m) => m.account_id) ?? [],
      )
      const items = db.accounts
        .filter((a) => a.account_id !== me.account_id && !a.deleted && !already.has(a.account_id))
        .filter((a) => inProgram(db, a, program))
        .filter(
          (a) =>
            new URL(request.url).searchParams.get('purpose') !== 'direct' ||
            canDirect(db, me, a, program),
        )
        .map((a) => ({
          account_id: a.account_id,
          full_name: a.full_name,
          role: a.admin
            ? 'company_admin'
            : fakeOrg.rowsOf(db, a.account_id, program).some((r) => r.team === 'coordinator')
              ? 'coordinator'
              : 'member',
        }))
      return json({ items, truncated: false })
    }),
    http.get(`${ORIGIN}/v1/me/chat-unread`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const items = db.programs.flatMap((p) => {
        const mine = state.chats.filter(
          (c) => c.program_id === p.program_id && isMember(c, me.account_id),
        )
        const unread = mine.filter((c) => unreadOf(c, me.account_id) > 0)
        if (unread.length === 0) return []
        return [
          {
            mentioned: unread.some((c) => mentionedIn(c, me.account_id)),
            program_id: p.program_id,
            program_name: p.name,
            unread_chats: unread.length,
          },
        ]
      })
      return json({ items })
    }),
    http.get(`${ORIGIN}/v1/chat-refs/:refId`, () => HttpResponse.json({}, { status: 404 })),
  ]
}

export function readHandlers(db: OrgDb, state: ChatState) {
  // `candidates` ve `stream` özgül yollardır: `:chatId` yolundan ÖNCE eşleşmeli.
  return [...auxHandlers(db, state), listHandler(db, state), ...detailHandlers(db, state)]
}
