// W160 · O3: sahte sohbet yazma uçları. Sözleşme sadakati: `client_message_id` çift gönderimi tek
// sayar (200 mevcut / 201 yeni), düzenleme `expected_revision` ister (409 `messaging.edit_conflict`),
// mesaj silme kayıt kaldırır, tepki/oy/sabit 204, okundu imleci geri gitmez. Her yazma ilgili
// İÇERİKSİZ olayı akışa yayar (`fake-chat-stream.ts`; olay yazanı da bulur).
import { http, HttpResponse } from 'msw'

import type { ChatMessage } from '@/modules/chat/public'

import { envelope, fakeOrg, json, ORIGIN, type Account, type OrgDb } from './fake-org'
import {
  addMessage,
  isManager,
  isResponse,
  noMessage,
  notAuthorized,
  resolveChat,
  roleOf,
  viewOf,
  type ChatState,
  type FakeChat,
  type FakeMessage,
} from './fake-chat'
import { emit } from './fake-chat-stream'

const noContent = () => new HttpResponse(null, { status: 204 })
const invalid = () => envelope('messaging.input_invalid', 422)

/** Gövde `unknown` okunur; ayrıştırılamayan gövde boş nesnedir. */
async function bodyOf<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return {}
  }
}

function pollOf(
  options: string[],
  closesAt?: string,
  multi = false,
  anonymous = false,
): NonNullable<ChatMessage['poll']> {
  return {
    anonymous,
    closed_at: null,
    closes_at: closesAt ?? null,
    multi,
    results: options.map((label, option_index) => ({
      count: 0,
      label,
      mine: false,
      option_index,
      voters: [],
    })),
  }
}

interface SendBody {
  body: string
  client_message_id: string
  mentions: ChatMessage['mentions']
  poll: { options: string[]; closes_at?: string; multi?: boolean; anonymous?: boolean }
  reply_to_message_id: string
  refs: Array<{ kind: 'task' | 'department' | 'file'; target_id: string }>
}

function create(state: ChatState, chat: FakeChat, account: Account, body: Partial<SendBody>) {
  const refs = (body.refs ?? []).map((r, i) => ({ ...r, ref_id: `ref-${chat.last_seq + 1}-${i}` }))
  const message = addMessage(chat, account, body.body ?? '', {
    client_message_id: body.client_message_id,
    mentions: body.mentions ?? [],
    reply_to_message_id: body.reply_to_message_id ?? null,
    poll: body.poll
      ? pollOf(body.poll.options, body.poll.closes_at, body.poll.multi, body.poll.anonymous)
      : null,
    refs,
  })
  const reply = chat.messages.find((m) => m.base.message_id === message.base.reply_to_message_id)
  if (reply) {
    message.base.reply_to = {
      body: reply.base.body,
      deleted: false,
      message_id: reply.base.message_id,
      sender_account_id: reply.base.sender_account_id,
      sender_name: reply.base.sender_name ?? null,
      seq: reply.base.seq,
    }
  }
  emit(state, chat, 'message.created', {
    messageId: message.base.message_id,
    actor: account.account_id,
  })
  return message
}

/** Gönderim doğrulaması: 422 alan hatası ya da 403 (`@herkes` yalnız yöneticide). */
function refuseSend(chat: FakeChat, account: string, body: Partial<SendBody>, text: string) {
  if (!body.client_message_id || (text === '' && !body.poll)) return invalid()
  if (body.poll && chat.kind === 'direct') return invalid()
  const everyone = body.mentions?.some((m) => m.kind === 'all') === true
  return everyone && !isManager(chat, account) ? notAuthorized() : null
}

/** Pin §10.2 / SendFingerprint: bahsetme ve ref sırası önemsiz, anket sırası anlamlıdır. */
function sendShape(body: Partial<SendBody>): string {
  return JSON.stringify([
    (body.body ?? '').trim(),
    body.reply_to_message_id ?? '',
    (body.mentions ?? []).map((m) => `${m.kind}:${m.target_id ?? ''}`).sort(),
    (body.refs ?? []).map((r) => `${r.kind}:${r.target_id}`).sort(),
    body.poll ? [body.poll.options, body.poll.multi ?? false, body.poll.closes_at ?? ''] : null,
  ])
}

function sendHandler(db: OrgDb, state: ChatState) {
  const shapes = new WeakMap<FakeMessage, string>()
  return http.post(`${ORIGIN}/v1/chats/:chatId/messages`, async ({ request, params }) => {
    const found = resolveChat(db, state, request, String(params.chatId))
    if (isResponse(found)) return found
    const { account, chat } = found
    const body = await bodyOf<SendBody>(request)
    const text = (body.body ?? '').trim()
    const refused = refuseSend(chat, account.account_id, body, text)
    if (refused) return refused
    const fault = state.sendFault
    if (fault === 'unavailable') {
      state.sendFault = 'ok'
      return envelope('platform.unavailable', 503)
    }
    const existing = chat.messages.find((m) => m.base.client_message_id === body.client_message_id)
    if (existing) {
      const original = shapes.get(existing)
      if (original !== undefined && original !== sendShape(body)) {
        return envelope('messaging.idempotency_key_reused', 409)
      }
      return json(viewOf(existing, account.account_id), 200)
    }
    const message = create(state, chat, account, { ...body, body: text })
    shapes.set(message, sendShape(body))
    if (fault === 'lost-response') {
      state.sendFault = 'ok'
      return HttpResponse.error()
    }
    return json(viewOf(message, account.account_id), 201)
  })
}

function withMessage(
  db: OrgDb,
  state: ChatState,
  request: Request,
  params: Record<string, string | readonly string[] | undefined>,
) {
  const found = resolveChat(db, state, request, String(params.chatId))
  if (isResponse(found)) return found
  const message = found.chat.messages.find((m) => m.base.message_id === params.messageId)
  if (!message) return noMessage()
  return { ...found, message }
}

function editHandler(db: OrgDb, state: ChatState) {
  return http.patch(
    `${ORIGIN}/v1/chats/:chatId/messages/:messageId`,
    async ({ request, params }) => {
      const found = withMessage(db, state, request, params)
      if (isResponse(found)) return found
      const { account, chat, message } = found
      if (message.base.sender_account_id !== account.account_id) return notAuthorized()
      const body = await bodyOf<{ body: string; expected_revision: number }>(request)
      if (body.expected_revision === undefined) return envelope('messaging.revision_required', 422)
      if (body.expected_revision !== message.base.edit_revision) {
        return envelope('messaging.edit_conflict', 409)
      }
      const text = (body.body ?? '').trim()
      if (text === '') return invalid()
      if (text !== message.base.body) {
        Object.assign(message.base, {
          body: text,
          edited: true,
          edited_at: message.base.created_at,
          edit_revision: message.base.edit_revision + 1,
        })
        emit(state, chat, 'message.updated', {
          messageId: message.base.message_id,
          actor: account.account_id,
        })
      }
      return json(viewOf(message, account.account_id))
    },
  )
}

function deleteHandler(db: OrgDb, state: ChatState) {
  return http.delete(`${ORIGIN}/v1/chats/:chatId/messages/:messageId`, ({ request, params }) => {
    const found = withMessage(db, state, request, params)
    if (isResponse(found)) return found
    const { account, chat, message } = found
    const mine = message.base.sender_account_id === account.account_id
    if (!mine && roleOf(chat, account.account_id) !== 'admin') return notAuthorized()
    chat.messages = chat.messages.filter((m) => m !== message)
    emit(state, chat, 'message.deleted', {
      messageId: message.base.message_id,
      actor: account.account_id,
    })
    return noContent()
  })
}

/** Tepki / sabit / oy / anket bitirme: hepsi 204, `message.updated` yayar. */
const MESSAGE_BASE = `${ORIGIN}/v1/chats/:chatId/messages/:messageId`

function lightFactory(db: OrgDb, state: ChatState) {
  return (
      run: (
        ctx: { account: Account; chat: FakeChat; message: FakeMessage },
        body: Record<string, unknown>,
      ) => Response | void,
    ) =>
    async ({
      request,
      params,
    }: {
      request: Request
      params: Record<string, string | readonly string[] | undefined>
    }) => {
      const found = withMessage(db, state, request, params)
      if (isResponse(found)) return found
      const body =
        request.method === 'PUT' || request.method === 'POST'
          ? await bodyOf<Record<string, unknown>>(request)
          : {}
      const refused = run(found, body)
      if (refused) return refused
      emit(state, found.chat, 'message.updated', {
        messageId: found.message.base.message_id,
        actor: found.account.account_id,
      })
      return noContent()
    }
}

function reactionPinHandlers(light: ReturnType<typeof lightFactory>) {
  const base = MESSAGE_BASE
  return [
    http.put(
      `${base}/reaction`,
      light(({ account, message }, body) => {
        message.reactions.set(account.account_id, body.kind as 'like')
      }),
    ),
    http.delete(
      `${base}/reaction`,
      light(({ account, message }) => {
        message.reactions.delete(account.account_id)
      }),
    ),
    http.put(
      `${base}/pin`,
      light(({ account, chat, message }) => {
        if (chat.kind === 'group' && !isManager(chat, account.account_id)) return notAuthorized()
        message.base.pinned_at = message.base.created_at
      }),
    ),
    http.delete(
      `${base}/pin`,
      light(({ account, chat, message }) => {
        if (chat.kind === 'group' && !isManager(chat, account.account_id)) return notAuthorized()
        message.base.pinned_at = null
      }),
    ),
  ]
}

function pollHandlers(light: ReturnType<typeof lightFactory>) {
  const base = MESSAGE_BASE
  return [
    http.put(
      `${base}/vote`,
      light(({ account, message }, body) => {
        const poll = message.base.poll
        if (!poll) return invalid()
        if (poll.closed_at !== null) return envelope('messaging.poll_closed', 409)
        const picks = (body.option_indexes as number[] | undefined) ?? []
        if (!poll.multi && picks.length > 1) return invalid()
        message.votes.set(account.account_id, picks)
      }),
    ),
    http.post(
      `${base}/poll/close`,
      light(({ account, message }) => {
        if (message.base.sender_account_id !== account.account_id) return notAuthorized()
        if (message.base.poll) message.base.poll.closed_at = message.base.created_at
      }),
    ),
  ]
}

function lightHandlers(db: OrgDb, state: ChatState) {
  const light = lightFactory(db, state)
  return [...reactionPinHandlers(light), ...pollHandlers(light)]
}

function readHandlers(db: OrgDb, state: ChatState) {
  return [
    http.post(`${ORIGIN}/v1/chats/read-all`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const program = fakeOrg.programOf(request)
      for (const chat of state.chats) {
        if (chat.program_id !== program || !(me.account_id in chat.reads)) continue
        chat.reads[me.account_id] = chat.last_seq
        emit(state, chat, 'read.updated', { actor: me.account_id, exclude: me.account_id })
      }
      return noContent()
    }),
    http.post(`${ORIGIN}/v1/chats/:chatId/read`, async ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const { account, chat } = found
      const body = await bodyOf<{ message_id: string }>(request)
      const message = chat.messages.find((m) => m.base.message_id === body.message_id)
      if (!message) return noMessage()
      state.reads.push(`${chat.chat_id}:${message.base.message_id}`)
      chat.reads[account.account_id] = Math.max(
        chat.reads[account.account_id] ?? 0,
        message.base.seq,
      )
      emit(state, chat, 'read.updated', { actor: account.account_id, exclude: account.account_id })
      return noContent()
    }),
    http.post(`${ORIGIN}/v1/chats/:chatId/typing`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      state.typing.push(found.chat.chat_id)
      emit(state, found.chat, 'typing', { actor: found.account.account_id })
      return noContent()
    }),
  ]
}

export function writeHandlers(db: OrgDb, state: ChatState) {
  return [
    sendHandler(db, state),
    editHandler(db, state),
    deleteHandler(db, state),
    ...lightHandlers(db, state),
    ...readHandlers(db, state),
  ]
}
