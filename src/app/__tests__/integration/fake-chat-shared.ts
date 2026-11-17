// W184: durumlu sahte sohbet B uçları (pin v0.25.0-api): paylaşılan sayılar, cihaz ekleri, mesajdan
// açılan görev bağları ve kartları, mesaj okundu bilgisi, bildirim seviyesi ve görevin kaynak mesajı.
// Hepsi sohbet/görev durumundan TÜRETİLİR (sabit cevap yok): sayaç = liste toplamı, görev kartı
// görüntüleyenin görünürlüğüyle (`available`/`forbidden`/`deleted`), okundu bilgisi yalnız gönderene.
import { http, HttpResponse } from 'msw'

import { envelope, fakeOrg, json, ORIGIN, type Item, type OrgDb } from './fake-org'
import { visible } from './fake-org-work'
import {
  isMember,
  isResponse,
  noMessage,
  notAuthorized,
  resolveChat,
  type ChatState,
  type FakeChat,
  type FakeMessage,
} from './fake-chat'

const LIMIT_MAX = 200
const LEVELS = ['all', 'mentions', 'none']

/** Sayfa: imleç = ofset (`seq DESC` sırasında); `limit` 0/yok → 50. */
function page<T>(rows: T[], query: URLSearchParams) {
  const limit = Math.min(Number(query.get('limit')) || 50, LIMIT_MAX)
  const from = Number(query.get('cursor') || 0)
  const next = from + limit < rows.length ? String(from + limit) : null
  return { items: rows.slice(from, from + limit), next_cursor: next }
}

const newestFirst = (chat: FakeChat): FakeMessage[] =>
  [...chat.messages].sort((a, b) => b.base.seq - a.base.seq)

/** Sohbetin canlı mesajlarındaki paylaşılan bağ sayıları (MESSAGING-K51; tekil görev birleşimi). */
export function sharedCountsOf(chat: FakeChat) {
  const refs = chat.messages.flatMap((m) => m.base.refs)
  const tasks = new Set([
    ...refs.filter((r) => r.kind === 'task').map((r) => r.target_id),
    ...chat.messages.flatMap((m) => m.base.task_ids),
  ])
  return {
    files: refs.filter((r) => r.kind === 'file').length,
    departments: refs.filter((r) => r.kind === 'department').length,
    attachments: chat.messages.reduce((n, m) => n + m.base.attachments.length, 0),
    polls: chat.messages.filter((m) => m.base.poll !== null).length,
    tasks: tasks.size,
  }
}

function taskCard(db: OrgDb, me: string, workItemId: string) {
  const found = db.items.find((i) => i.work_item_id === workItemId)
  const account = db.accounts.find((a) => a.account_id === me)
  if (!found) return { state: 'deleted', work_item_id: workItemId, task: null }
  if (!account || !visible(db, account, found)) {
    return { state: 'forbidden', work_item_id: workItemId, task: null }
  }
  const siblings = db.items.filter(
    (i) => i.program_id === found.program_id && i.department_id === found.department_id,
  )
  const sequence = siblings.indexOf(found) + 1
  const prefix = db.catalog.find((c) => c.department_id === found.department_id)?.code
  return {
    state: 'available',
    work_item_id: workItemId,
    task: {
      title: found.title,
      status: found.status,
      code: prefix ? `${prefix}-${sequence}` : null,
      sequence_no: sequence,
      department_id: found.department_id,
    },
  }
}

type Params = Record<string, unknown>

function listHandlers(db: OrgDb, state: ChatState) {
  const base = `${ORIGIN}/v1/chats/:chatId`
  const guard = (request: Request, params: Params) =>
    resolveChat(db, state, request, String(params.chatId))
  return [
    http.get(`${base}/shared-counts`, ({ request, params }) => {
      const found = guard(request, params)
      return isResponse(found) ? found : json(sharedCountsOf(found.chat))
    }),
    http.get(`${base}/attachments`, ({ request, params }) => {
      const found = guard(request, params)
      if (isResponse(found)) return found
      const rows = newestFirst(found.chat).flatMap((m) =>
        m.base.attachments.map((a) => ({
          attachment_id: a.attachment_id,
          content_type: a.content_type,
          created_at: m.base.created_at,
          file_name: a.file_name,
          message_id: m.base.message_id,
          sender_account_id: m.base.sender_account_id,
          seq: m.base.seq,
          size_bytes: a.size_bytes,
        })),
      )
      return json(page(rows, new URL(request.url).searchParams))
    }),
    http.get(`${base}/task-links`, ({ request, params }) => {
      const found = guard(request, params)
      if (isResponse(found)) return found
      const rows = newestFirst(found.chat).flatMap((m) =>
        m.base.task_ids.map((id) => ({
          created_at: m.base.created_at,
          message_id: m.base.message_id,
          seq: m.base.seq,
          work_item_id: id,
        })),
      )
      return json(page(rows, new URL(request.url).searchParams))
    }),
  ]
}

function messageHandlers(db: OrgDb, state: ChatState) {
  const base = `${ORIGIN}/v1/chats/:chatId`
  const guard = (request: Request, params: Params) =>
    resolveChat(db, state, request, String(params.chatId))
  return [
    http.get(`${base}/messages/:messageId/tasks`, ({ request, params }) => {
      const found = guard(request, params)
      if (isResponse(found)) return found
      const message = found.chat.messages.find((m) => m.base.message_id === params.messageId)
      if (!message) return noMessage()
      const me = found.account.account_id
      return json({ items: message.base.task_ids.map((id) => taskCard(db, me, id)) })
    }),
    http.get(`${base}/messages/:messageId/receipts`, ({ request, params }) => {
      const found = guard(request, params)
      if (isResponse(found)) return found
      const message = found.chat.messages.find((m) => m.base.message_id === params.messageId)
      if (!message) return noMessage()
      // Yalnız gönderen: başkasının mesajında 403 (MESSAGING-K50).
      if (message.base.sender_account_id !== found.account.account_id) return notAuthorized()
      return json(receiptsOf(db, found.chat, message))
    }),
    http.put(`${base}/notification-level`, async ({ request, params }) => {
      const found = guard(request, params)
      if (isResponse(found)) return found
      const level = ((await request.json().catch(() => ({}))) as { level?: string }).level ?? ''
      if (!LEVELS.includes(level)) return envelope('messaging.input_invalid', 422)
      const notify = { ...(found.chat.notify_levels ?? {}) }
      notify[found.account.account_id] = level as 'all' | 'mentions' | 'none'
      found.chat.notify_levels = notify
      return json({ level })
    }),
  ]
}

/** `listChatMessageReceipts` gövdesi: gönderen hariç üyeler imleçlerine göre okuyan/okumayan. */
function receiptsOf(db: OrgDb, chat: FakeChat, message: FakeMessage) {
  const others = chat.members.filter((m) => m.account_id !== message.base.sender_account_id)
  const row = (accountId: string) => ({
    account_id: accountId,
    full_name: fakeOrg.accountName(db, accountId),
  })
  const readers = others.filter((m) => (chat.reads[m.account_id] ?? 0) >= message.base.seq)
  return {
    message_id: message.base.message_id,
    seq: message.base.seq,
    truncated: false,
    read: readers.map((m) => ({ ...row(m.account_id), last_read_at: null })),
    unread: others.filter((m) => !readers.includes(m)).map((m) => row(m.account_id)),
  }
}

/** Görevin KAYNAK mesajı (MESSAGING-K59): en eski bağ; erişilemeyen sohbet/silinmiş mesaj → `null`. */
function sourceMessage(db: OrgDb, state: ChatState) {
  return http.get(`${ORIGIN}/v1/work-items/:id/source-message`, ({ request, params }) => {
    const me = fakeOrg.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    const target: Item | undefined = db.items.find((i) => i.work_item_id === params.id)
    if (!target || !visible(db, me, target)) return envelope('work.item_not_found', 404)
    const program = fakeOrg.programOf(request)
    const hits = state.chats
      .filter((c) => c.program_id === program && isMember(c, me.account_id))
      .flatMap((c) =>
        c.messages
          .filter((m) => m.base.task_ids.includes(String(params.id)))
          .map((m) => ({ chat_id: c.chat_id, message_id: m.base.message_id, seq: m.base.seq })),
      )
    return HttpResponse.json({ source_message: hits[0] ?? null })
  })
}

export function sharedHandlers(db: OrgDb, state: ChatState) {
  return [...listHandlers(db, state), ...messageHandlers(db, state), sourceMessage(db, state)]
}
