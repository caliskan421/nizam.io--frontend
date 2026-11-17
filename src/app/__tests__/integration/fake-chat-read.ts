// W160 · O3: sahte sohbet okuma uçları (liste, ayrıntı, mesaj penceresi, üyeler, sabitler, adaylar,
// ref'ler, okunmamış özeti). Üyelik sunucuda uygulanır; mesaj penceresi `listChatMessages`
// anlamını (son sayfa, before, after, around, limit) birebir taklit eder.
import { http } from 'msw'

import type { ChatMessage } from '@/modules/chat/public'
import { makeChatMember } from '@/shared/api/__tests__/defaults'

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

/** İlk okunmamış (başkasının) mesajın `seq`'i; yoksa `null` (`unreadOf` ile aynı kural). */
function firstUnreadSeq(chat: FakeChat, me: string): number | null {
  const read = chat.reads[me] ?? 0
  return (
    chat.messages.find((m) => m.base.seq > read && m.base.sender_account_id !== me)?.base.seq ??
    null
  )
}

function summary(db: OrgDb, chat: FakeChat, me: string) {
  const last = chat.messages.at(-1)
  return {
    ...chatView(db, chat, me),
    last_message: last
      ? {
          body: last.base.body,
          attachment_count: last.base.attachments.length,
          created_at: last.base.created_at,
          deleted: false,
          kind: last.base.poll ? 'poll' : last.base.attachments.length > 0 ? 'attachment' : 'text',
          message_id: last.base.message_id,
          sender_account_id: last.base.sender_account_id,
          sender_name: last.base.sender_name ?? '',
          seq: last.base.seq,
        }
      : null,
    first_unread_seq: firstUnreadSeq(chat, me),
    mentioned: mentionedIn(chat, me),
    notify_level: 'all' as const,
    peer_read_seq: peerRead(chat, me),
    read_seq: chat.reads[me] ?? 0,
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
    const kind = query.get('kind')
    const unread = query.get('unread')
    const badKind = kind !== null && kind !== 'direct' && kind !== 'group'
    const badUnread = unread !== null && unread !== 'true' && unread !== 'false'
    if (badKind || badUnread) return envelope('messaging.input_invalid', 422)
    const rows = state.chats
      .filter((c) => c.program_id === program && isMember(c, me.account_id))
      .map((c) => summary(db, c, me.account_id))
      .filter((c) => kind === null || c.kind === kind)
      .filter((c) => unread !== 'true' || c.unread_count > 0)
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
    return json({ items, next_cursor: next, total: rows.length })
  })
}

function historyHandler(db: OrgDb, state: ChatState) {
  return http.get(`${ORIGIN}/v1/chats/:chatId/messages`, ({ request, params }) => {
    const found = resolveChat(db, state, request, String(params.chatId))
    if (isResponse(found)) return found
    const me = found.account.account_id
    const all = found.chat.messages.map((m) => viewOf(m, me))
    return json({
      first_unread_seq: firstUnreadSeq(found.chat, me),
      items: pageOf(all, new URL(request.url).searchParams),
      peer_read_seq: peerRead(found.chat, me),
      read_seq: found.chat.reads[me] ?? 0,
    })
  })
}

function detailHandlers(db: OrgDb, state: ChatState) {
  return [
    http.get(`${ORIGIN}/v1/chats/:chatId`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      return json(chatView(db, found.chat, found.account.account_id))
    }),
    historyHandler(db, state),
    http.get(`${ORIGIN}/v1/chats/:chatId/members`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const items = found.chat.members.map((m) =>
        makeChatMember({
          account_id: m.account_id,
          founder: isFounder(m),
          from_source: m.from_source,
          full_name: fakeOrg.accountName(db, m.account_id),
          role: m.role,
        }),
      )
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

/** Referans özeti (`getChatRefSummary`): çağıran referansın sohbetinin üyesidir; görev yoksa `available:false`. */
function refSummary(db: OrgDb, state: ChatState, request: Request, refId: string) {
  const me = fakeOrg.actorOf(db, request)
  if (!me) return envelope('platform.unauthenticated', 401)
  for (const chat of state.chats) {
    if (!isMember(chat, me.account_id)) continue
    for (const message of chat.messages) {
      const ref = message.base.refs.find((r) => r.ref_id === refId)
      if (!ref) continue
      const base = {
        chat_id: chat.chat_id,
        kind: ref.kind,
        message_id: message.base.message_id,
        ref_id: refId,
        target_id: ref.target_id,
      }
      const task = db.items.find((i) => i.work_item_id === ref.target_id)
      if (ref.kind !== 'task' || !task) return json({ ...base, available: false })
      return json({
        ...base,
        available: true,
        task: {
          assignees: [],
          department_id: task.department_id,
          department_name: null,
          description: '',
          end_on: String(task.end_on),
          start_on: String(task.start_on),
          status: task.status,
          title: task.title,
        },
      })
    }
  }
  return envelope('messaging.ref_not_found', 404)
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
    http.get(`${ORIGIN}/v1/chat-refs/:refId`, ({ request, params }) =>
      refSummary(db, state, request, String(params.refId)),
    ),
  ]
}

export function readHandlers(db: OrgDb, state: ChatState) {
  // `candidates` ve `stream` özgül yollardır: `:chatId` yolundan ÖNCE eşleşmeli.
  return [...auxHandlers(db, state), listHandler(db, state), ...detailHandlers(db, state)]
}
