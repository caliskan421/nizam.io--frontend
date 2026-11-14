// W160 · O3: sahte `GET /v1/chats/stream` (SSE). Gerçek `ReadableStream` gövdesi; her açılış bir
// `StreamClient`'tır. Olaylar İÇERİKSİZDİR (`chat_id`, `message_id`, `actor_account_id`,
// `affected_account_ids`): test `emit` ile ya da sunucu yazmaları (`fake-chat-write.ts`) yayar.
// Alıcılar: sohbet üyeleri + olaydan etkilenen hesaplar (çıkarılan üye de olayı alır).
import { http, HttpResponse } from 'msw'

import { envelope, fakeOrg, ORIGIN, type OrgDb } from './fake-org'
import { inProgram, isMember, type ChatState, type FakeChat, type StreamClient } from './fake-chat'

const encoder = new TextEncoder()

export type ChatEventName =
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'read.updated'
  | 'member.changed'
  | 'chat.changed'
  | 'typing'

export interface EmitOptions {
  messageId?: string | null
  actor?: string
  affected?: string[]
}

function frame(name: string, payload: object): string {
  return `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`
}

/** Olayı ilgili açık akışlara yazar. Sunucu yazması için `actor` = yazan hesap. */
export function emit(
  state: ChatState,
  chat: FakeChat,
  name: ChatEventName,
  options: EmitOptions = {},
): void {
  const payload = {
    chat_id: chat.chat_id,
    message_id: options.messageId ?? null,
    actor_account_id: options.actor ?? chat.created_by,
    affected_account_ids: options.affected ?? [],
  }
  const text = frame(name, payload)
  for (const client of state.streams) {
    if (!client.open || client.program !== chat.program_id) continue
    const affected = payload.affected_account_ids.includes(client.account)
    if (isMember(chat, client.account) || affected) client.push(text)
  }
}

/** Açık akışlara ham metin (`: ping` yorumu, bozuk çerçeve). */
export function pushRaw(state: ChatState, text: string): void {
  for (const client of state.streams) if (client.open) client.push(text)
}

/** Sunucu tarafı kopuş: açık akışların gövdesi biter (istemci yeniden bağlanır). */
export function dropStreams(state: ChatState): void {
  for (const client of state.streams) if (client.open) client.end()
}

export const openStreams = (state: ChatState): StreamClient[] =>
  state.streams.filter((client) => client.open)

function openClient(state: ChatState, account: string, program: string): ReadableStream {
  let client!: StreamClient
  return new ReadableStream({
    start(controller) {
      client = {
        account,
        program,
        open: true,
        push: (text) => controller.enqueue(encoder.encode(text)),
        end: () => {
          client.open = false
          controller.close()
        },
      }
      state.streams.push(client)
      client.push(': ok\n\n')
    },
    cancel() {
      client.open = false
      state.cancelled += 1
    },
  })
}

export function streamHandlers(db: OrgDb, state: ChatState) {
  return [
    http.get(`${ORIGIN}/v1/chats/stream`, ({ request }) => {
      const account = fakeOrg.actorOf(db, request)
      const program = fakeOrg.programOf(request)
      if (!account) return envelope('platform.unauthenticated', 401)
      state.opened += 1
      if (state.streamReject !== null)
        return envelope('messaging.scope_invalid', state.streamReject)
      if (!inProgram(db, account, program)) return envelope('messaging.not_authorized', 403)
      return new HttpResponse(openClient(state, account.account_id, program), {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }),
  ]
}
