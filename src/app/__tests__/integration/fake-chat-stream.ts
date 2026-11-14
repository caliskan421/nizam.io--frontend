// W160 · O3: sahte `GET /v1/chats/stream` (SSE). Gerçek `ReadableStream` gövdesi; her açılış bir
// `StreamClient`'tır. Olaylar İÇERİKSİZDİR (`chat_id`, `message_id`, `actor_account_id`,
// `affected_account_ids`): test `emit` ile ya da sunucu yazmaları (`fake-chat-write.ts`) yayar.
// Alıcılar: sohbet üyeleri + olaydan etkilenen hesaplar (çıkarılan üye de olayı alır).
import { http } from 'msw'

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
  /** Olayı bu hesaba GÖNDERME (okundu işareti kendi okuyanı uyarmaz). */
  exclude?: string
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
    if (client.account === options.exclude) continue
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

function openClient(
  state: ChatState,
  account: string,
  program: string,
  signal: AbortSignal,
): ReadableStream {
  let client!: StreamClient
  const release = () => {
    if (!client.open) return
    client.open = false
    state.cancelled += 1
  }
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
      // `msw` gövde iptalini güvenilir iletmez: istemcinin kesmesi isteğin `signal`'inden izlenir.
      signal.addEventListener('abort', () => release(), { once: true })
    },
    cancel: () => release(),
  })
}

/**
 * Akış isteğine sahte sunucu yanıtı: kimlik (belirteç → hesap), isteğe bağlı reddetme
 * (`streamReject`, sıradaki `stream401` kadar 401), program üyeliği, sonra gerçek `ReadableStream`.
 * `msw` + `undici` soket katmanı, zamanlayıcı kaynaklı iptalde (ölü bağlantı, gizli sekme) yanıt
 * gövdesini yanlış sonlandırıp test sürecini düşürür; bu yüzden entegrasyon testleri akış isteğini
 * `fetch` çevresinden doğrudan bu işlevle karşılar (`watchStreams`, `chat-support.ts`).
 */
export function serveStream(db: OrgDb, state: ChatState, request: Request): Response {
  const account = fakeOrg.actorOf(db, request)
  const program = fakeOrg.programOf(request)
  state.opened += 1
  if (!account || state.stream401 > 0) {
    state.stream401 = Math.max(0, state.stream401 - 1)
    return envelope('platform.unauthenticated', 401)
  }
  if (state.streamReject !== null) return envelope('messaging.scope_invalid', state.streamReject)
  if (!inProgram(db, account, program)) return envelope('messaging.not_authorized', 403)
  return new Response(openClient(state, account.account_id, program, request.signal), {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

export function streamHandlers(db: OrgDb, state: ChatState) {
  return [http.get(`${ORIGIN}/v1/chats/stream`, ({ request }) => serveStream(db, state, request))]
}
