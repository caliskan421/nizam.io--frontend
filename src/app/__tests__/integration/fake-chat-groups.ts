// W160 · O3: sahte sohbet yapı uçları (birebir aç, grup kur/güncelle/sil, üyeler, yöneticiler, ek
// yükleme, mesajdan görev). `createGroupChat` ve `createTaskFromChatMessage` `Idempotency-Key`
// ister (aynı anahtar = aynı sonuç, 200); üye çıkarma kaynak kaynaklı üyede 409
// `messaging.member_source_managed`.
import { http, HttpResponse } from 'msw'

import { envelope, fakeOrg, item, json, ORIGIN, type Account, type OrgDb } from './fake-org'
import {
  addMessage,
  chatView,
  inProgram,
  isManager,
  isResponse,
  makeChat,
  member,
  nextId,
  noMessage,
  notAuthorized,
  resolveChat,
  roleOf,
  viewOf,
  type ChatState,
  type FakeChat,
} from './fake-chat'
import { emit } from './fake-chat-stream'

const noContent = () => new HttpResponse(null, { status: 204 })
const invalid = () => envelope('messaging.input_invalid', 422)

async function bodyOf<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return {}
  }
}

/** Program rolü (ŞY ya da bir birimin koordinatörü): kaynak seçimi ve mesajdan görev. */
function coordinates(db: OrgDb, account: Account, programId: string): string[] {
  if (account.admin)
    return db.links.filter((l) => l.program_id === programId).map((l) => l.department_id)
  return fakeOrg
    .rowsOf(db, account.account_id, programId)
    .filter((r) => r.team === 'coordinator')
    .map((r) => r.department_id)
}

function directHandler(db: OrgDb, state: ChatState) {
  return http.post(`${ORIGIN}/v1/chats/direct`, async ({ request }) => {
    const me = fakeOrg.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    const program = fakeOrg.programOf(request)
    if (!inProgram(db, me, program)) return notAuthorized()
    const body = await bodyOf<{ account_id: string }>(request)
    const peer = db.accounts.find((a) => a.account_id === body.account_id && !a.deleted)
    if (!peer || peer.account_id === me.account_id) return invalid()
    const existing = state.chats.find(
      (c) =>
        c.kind === 'direct' &&
        c.program_id === program &&
        c.members.some((m) => m.account_id === me.account_id) &&
        c.members.some((m) => m.account_id === peer.account_id),
    )
    if (existing) return json(chatView(db, existing, me.account_id), 200)
    const chat = makeChat(
      nextId(state, 'dc'),
      'direct',
      [member(me.account_id), member(peer.account_id)],
      {
        program_id: program,
      },
    )
    state.chats.push(chat)
    emit(state, chat, 'chat.changed', { actor: me.account_id, affected: [peer.account_id] })
    return json(chatView(db, chat, me.account_id), 201)
  })
}

interface GroupBody {
  name: string
  member_account_ids: string[]
  source: 'none' | 'department' | 'program'
  source_department_id: string
}

function sourceMembers(db: OrgDb, program: string, body: Partial<GroupBody>) {
  if (body.source === 'program') {
    return db.accounts.filter((a) => inProgram(db, a, program)).map((a) => a.account_id)
  }
  return db.memberships
    .filter((m) => m.program_id === program && m.department_id === body.source_department_id)
    .map((m) => m.account_id)
}

function buildGroup(
  db: OrgDb,
  state: ChatState,
  me: Account,
  program: string,
  body: Partial<GroupBody>,
) {
  const source = body.source ?? 'none'
  const fromSource = source === 'none' ? [] : sourceMembers(db, program, body)
  const chosen = new Set([...(body.member_account_ids ?? []), ...fromSource])
  chosen.delete(me.account_id)
  const members = [
    member(me.account_id, 'founder'),
    ...[...chosen].map((id) => ({ ...member(id), from_source: source !== 'none' })),
  ]
  const chat = makeChat(nextId(state, 'gc'), 'group', members, {
    program_id: program,
    name: (body.name ?? '').trim(),
    source,
    source_department_id: body.source_department_id ?? null,
  })
  state.chats.push(chat)
  emit(state, chat, 'chat.changed', { actor: me.account_id, affected: [...chosen] })
  return chat
}

/** Bir kez: işlem yapıldı ama yanıt kayboldu (ağ hatası). */
function lost(state: ChatState): Response | null {
  if (state.keyedFault !== 'lost-response') return null
  state.keyedFault = 'ok'
  return HttpResponse.error()
}

function groupHandler(db: OrgDb, state: ChatState) {
  return http.post(`${ORIGIN}/v1/chats/groups`, async ({ request }) => {
    const me = fakeOrg.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    const program = fakeOrg.programOf(request)
    if (!inProgram(db, me, program)) return notAuthorized()
    const key = request.headers.get('Idempotency-Key')
    if (!key) return envelope('messaging.request_key_required', 422)
    const prior = state.keys.get(`group:${key}`) as FakeChat | undefined
    if (prior) return json(chatView(db, prior, me.account_id), 200)
    const body = await bodyOf<GroupBody>(request)
    if (!body.name?.trim() || (body.member_account_ids ?? []).length === 0) return invalid()
    if (body.source && body.source !== 'none' && coordinates(db, me, program).length === 0) {
      return notAuthorized()
    }
    const chat = buildGroup(db, state, me, program, body)
    state.keys.set(`group:${key}`, chat)
    return lost(state) ?? json(chatView(db, chat, me.account_id), 201)
  })
}

function chatHandlersOf(db: OrgDb, state: ChatState) {
  const base = `${ORIGIN}/v1/chats/:chatId`
  return [
    http.patch(base, async ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      if (!isManager(found.chat, found.account.account_id)) return notAuthorized()
      const body = await bodyOf<{ name: string }>(request)
      if (body.name !== undefined) found.chat.name = body.name.trim()
      emit(state, found.chat, 'chat.changed', { actor: found.account.account_id })
      return json(chatView(db, found.chat, found.account.account_id))
    }),
    http.delete(base, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      if (!isManager(found.chat, found.account.account_id)) return notAuthorized()
      emit(state, found.chat, 'chat.changed', {
        actor: found.account.account_id,
        affected: found.chat.members.map((m) => m.account_id),
      })
      state.chats = state.chats.filter((c) => c !== found.chat)
      return noContent()
    }),
  ]
}

function memberHandlers(db: OrgDb, state: ChatState) {
  const base = `${ORIGIN}/v1/chats/:chatId`
  return [
    http.post(`${base}/members`, async ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      if (!isManager(found.chat, found.account.account_id)) return notAuthorized()
      const body = await bodyOf<{ account_ids: string[] }>(request)
      const fresh = (body.account_ids ?? []).filter((id) => roleOf(found.chat, id) === null)
      for (const id of fresh) {
        found.chat.members.push(member(id))
        found.chat.reads[id] = found.chat.last_seq
      }
      emit(state, found.chat, 'member.changed', {
        actor: found.account.account_id,
        affected: fresh,
      })
      return noContent()
    }),
    http.delete(`${base}/members/:accountId`, ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const target = String(params.accountId)
      const row = found.chat.members.find((m) => m.account_id === target)
      if (!row) return envelope('messaging.member_not_found', 404)
      const self = target === found.account.account_id
      if (!self && !isManager(found.chat, found.account.account_id)) return notAuthorized()
      if (row.from_source) return envelope('messaging.member_source_managed', 409)
      found.chat.members = found.chat.members.filter((m) => m !== row)
      emit(state, found.chat, 'member.changed', {
        actor: found.account.account_id,
        affected: [target],
      })
      return noContent()
    }),
    ...adminHandlers(db, state),
  ]
}

function adminHandlers(db: OrgDb, state: ChatState) {
  const base = `${ORIGIN}/v1/chats/:chatId`
  return [
    http.put(`${base}/admins/:accountId`, ({ request, params }) =>
      adminChange(db, state, request, params, 'admin'),
    ),
    http.delete(`${base}/admins/:accountId`, ({ request, params }) =>
      adminChange(db, state, request, params, 'member'),
    ),
  ]
}

function adminChange(
  db: OrgDb,
  state: ChatState,
  request: Request,
  params: Record<string, string | readonly string[] | undefined>,
  role: 'admin' | 'member',
) {
  const found = resolveChat(db, state, request, String(params.chatId))
  if (isResponse(found)) return found
  if (roleOf(found.chat, found.account.account_id) !== 'admin') return notAuthorized()
  const row = found.chat.members.find((m) => m.account_id === params.accountId)
  if (!row) return envelope('messaging.member_not_found', 404)
  row.role = role
  emit(state, found.chat, 'member.changed', {
    actor: found.account.account_id,
    affected: [row.account_id],
  })
  return noContent()
}

interface TaskBody {
  department_id: string
  start_date: string
  end_date: string
  title: string
  assignee_account_ids: string[]
}

function taskHandler(db: OrgDb, state: ChatState) {
  return http.post(
    `${ORIGIN}/v1/chats/:chatId/messages/:messageId/tasks`,
    async ({ request, params }) => {
      const found = resolveChat(db, state, request, String(params.chatId))
      if (isResponse(found)) return found
      const { account, chat } = found
      const message = chat.messages.find((m) => m.base.message_id === params.messageId)
      if (!message) return noMessage()
      const key = request.headers.get('Idempotency-Key')
      if (!key) return envelope('messaging.request_key_required', 422)
      const prior = state.keys.get(`task:${key}`) as string | undefined
      if (prior)
        return json({ message: viewOf(message, account.account_id), work_item_id: prior }, 200)
      const body = await bodyOf<TaskBody>(request)
      if (!coordinates(db, account, chat.program_id).includes(body.department_id ?? '')) {
        return notAuthorized()
      }
      const id = nextId(state, 'wc')
      db.items.push(
        item(id, chat.program_id, body.department_id!, null, {
          title: body.title?.trim() || message.base.body,
          start_on: body.start_date,
          end_on: body.end_date,
        }),
      )
      message.base.task_ids = [...message.base.task_ids, id]
      state.keys.set(`task:${key}`, id)
      emit(state, chat, 'message.updated', {
        messageId: message.base.message_id,
        actor: account.account_id,
      })
      return (
        lost(state) ?? json({ message: viewOf(message, account.account_id), work_item_id: id }, 201)
      )
    },
  )
}

function attachmentHandler(db: OrgDb, state: ChatState) {
  return http.post(`${ORIGIN}/v1/chats/:chatId/attachments`, async ({ request, params }) => {
    const found = resolveChat(db, state, request, String(params.chatId))
    if (isResponse(found)) return found
    const { account, chat } = found
    const query = new URL(request.url).searchParams
    const clientId = query.get('client_message_id') ?? ''
    const existing = chat.messages.find((m) => m.base.client_message_id === clientId)
    if (existing) return json(viewOf(existing, account.account_id), 200)
    const message = addMessage(chat, account, '', {
      client_message_id: clientId,
      attachments: [
        {
          attachment_id: nextId(state, 'att'),
          content_type: state.upload.content_type,
          file_name: state.upload.file_name,
          size_bytes: 8,
        },
      ],
    })
    emit(state, chat, 'message.created', {
      messageId: message.base.message_id,
      actor: account.account_id,
    })
    return json(viewOf(message, account.account_id), 201)
  })
}

export function groupHandlers(db: OrgDb, state: ChatState) {
  return [
    directHandler(db, state),
    groupHandler(db, state),
    attachmentHandler(db, state),
    taskHandler(db, state),
    ...chatHandlersOf(db, state),
    ...memberHandlers(db, state),
  ]
}
