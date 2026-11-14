// Sohbet test fikstürleri: sürümlü, `seq` sıralı sahte mesaj ve sunucu belleği.
import type { ChatMessage, ChatHistory, MessageQuery } from '../model/types'

/** `on()` yardımcısının kaydettiği istek (yazma testleri). */
export interface RecordedCall {
  method: string
  path: string
  headers: Headers
  query: URLSearchParams
  body: unknown
}
export type WriteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
export type FakeChatServer = ReturnType<typeof fakeChatServer>
/** SSE testi: yalnız ihtiyaç duyulan istek biçimi. */
export interface OpenRequestLike {
  programId: string
}
export type FrameExtra = Record<string, unknown>

export function msg(seq: number, over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    attachments: [],
    body: `mesaj ${seq}`,
    chat_id: 'c1',
    client_message_id: `cm-${seq}`,
    created_at: '2026-11-14T08:00:00Z',
    edit_revision: 1,
    edited: false,
    edited_at: null,
    mentions: [],
    message_id: `m${seq}`,
    pinned_at: null,
    poll: null,
    reactions: [],
    refs: [],
    reply_to_message_id: null,
    sender_account_id: 'u2',
    sender_name: 'Başka Kişi',
    seq,
    task_ids: [],
    ...over,
  }
}

export function seqs(items: readonly ChatMessage[]): number[] {
  return items.map((m) => m.seq)
}

/**
 * Bellek içi sunucu: `listChatMessages` anlamını (son sayfa, before, after, around, limit)
 * birebir taklit eder; mesaj eklenir/silinir/düzenlenir. Okuma sayısı `reads` ile izlenir.
 */
export function fakeChatServer(initial: ChatMessage[], peerReadSeq: number | null = null) {
  const all = new Map(initial.map((m) => [m.seq, m]))
  const reads: MessageQuery[] = []
  const sorted = () => [...all.values()].sort((a, b) => a.seq - b.seq)
  function read(query: MessageQuery): ChatHistory {
    reads.push(query)
    const limit = query.limit ?? 50
    const list = sorted()
    let items: ChatMessage[]
    if (query.around !== undefined) {
      const half = Math.floor(limit / 2)
      const below = list.filter((m) => m.seq < query.around!).slice(-half)
      const rest = list.filter((m) => m.seq >= query.around!).slice(0, limit - below.length)
      items = [...below, ...rest]
    } else if (query.before !== undefined) {
      items = list.filter((m) => m.seq < query.before!).slice(-limit)
    } else if (query.after !== undefined) {
      items = list.filter((m) => m.seq > query.after!).slice(0, limit)
    } else {
      items = list.slice(-limit)
    }
    return { items: structuredClone(items), peer_read_seq: peerReadSeq }
  }
  return {
    read: (q: MessageQuery) => Promise.resolve(read(q)),
    readSync: read,
    reads,
    add: (m: ChatMessage) => void all.set(m.seq, m),
    remove: (seq: number) => void all.delete(seq),
    edit: (seq: number, over: Partial<ChatMessage>) =>
      void all.set(seq, { ...all.get(seq)!, ...over }),
  }
}

export function range(from: number, to: number): ChatMessage[] {
  return Array.from({ length: to - from + 1 }, (_, i) => msg(from + i))
}

/** İstek gövdesinden `client_message_id` (gövde `unknown` kaydedilir). */
export function clientMessageIdOf(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('client_message_id' in body)) return null
  return String(body.client_message_id)
}
