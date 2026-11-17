// W160 · O3: durumlu sahte sohbet sunucusu — veri modeli ve ortak yardımcılar. W82a harness'inin
// (`createBackend`) üstüne `server.use` ile eklenir (`chatHandlers`, `fake-chat-read/write/stream`).
// Sunucu sözleşme sadakati: üyelik sunucuda uygulanır (üye olmayan 404 `messaging.chat_not_found`),
// mesajlar `seq` sıralı, tepki/oy hesap başına, okundu imleci hesap başına, `client_message_id`
// çift gönderimi tek sayar. Olaylar İÇERİKSİZDİR (`fake-chat-stream.ts`).
import type { ChatMessage } from '@/modules/chat/public'

import { envelope, fakeOrg, type Account, type OrgDb } from './fake-org'

export type ChatRoleName = 'admin' | 'founder' | 'member'

export interface FakeMember {
  account_id: string
  role: ChatRoleName
  from_source: boolean
}

/** Mesajın sunucudaki hâli: görünüm (`ChatMessage`) hesap başına türetilir. */
export interface FakeMessage {
  base: Omit<ChatMessage, 'reactions'>
  reactions: Map<string, 'like' | 'heart' | 'check' | 'star'>
  votes: Map<string, number[]>
}

export interface FakeChat {
  chat_id: string
  program_id: string
  kind: 'direct' | 'group'
  name: string | null
  auto_kind: 'department' | 'general' | 'coordinators' | null
  source: 'none' | 'department' | 'program' | 'coordinators'
  source_department_id: string | null
  created_by: string
  created_at: string
  members: FakeMember[]
  messages: FakeMessage[]
  /** Hesap → okunan son `seq`. */
  reads: Record<string, number>
  /** Son atanan `seq` (silinse de azalmaz). */
  last_seq: number
  /** Hesap → bildirim seviyesi (liste satırı `notify_level`; yoksa `all`). */
  notify_levels?: Record<string, 'all' | 'mentions' | 'none'>
}

export type SendFault = 'ok' | 'unavailable' | 'lost-response'
/** Sonraki grup kurma / görev oluşturma: işlenir ama yanıt yolda kaybolur (aynı anahtarla tekrar). */
export type KeyedFault = 'ok' | 'lost-response'

export interface ChatState {
  chats: FakeChat[]
  seq: number
  /** `createGroupChat` / `createTaskFromChatMessage` Idempotency-Key → sonuç. */
  keys: Map<string, unknown>
  /** Sonraki mesaj gönderimi (bir kez): 503 ya da işlenip yanıtı kaybolur. */
  sendFault: SendFault
  keyedFault: KeyedFault
  /**
   * Sonraki ek yüklemenin sunucuda görünen dosya bilgisi: jsdom `FormData` gövdesi `msw`'de
   * okunmaz (work `files.test.ts` kalıbı); gövde yerine bu bilgi kullanılır.
   */
  upload: { file_name: string; content_type: string }
  /** `GET /v1/chats/stream` yanıtı: `null` = akış açılır; sayı = o durum kodu. */
  streamReject: number | null
  /** Sıradaki bu kadar akış isteği 401 alır (belirteç yenileme senaryosu). */
  stream401: number
  /** Açık ve kapanmış akış istemcileri (`fake-chat-stream.ts`). */
  streams: StreamClient[]
  opened: number
  /** Akışı kapatan istemci tarafı iptali (reader.cancel) sayısı. */
  cancelled: number
  /** Alınan okundu istekleri (sırayla `chat_id:message_id`). */
  reads: string[]
  typing: string[]
  /** Yanıtı bekletilen istekler (geç sonuç senaryoları; gerçek süre yok). */
  holds: Array<{ method: string; test: RegExp; gate: Promise<void>; arrived: () => void }>
}

export interface StreamClient {
  account: string
  program: string
  push: (frame: string) => void
  end: () => void
  open: boolean
}

export function createChatState(): ChatState {
  return {
    chats: [],
    seq: 0,
    keys: new Map(),
    sendFault: 'ok',
    keyedFault: 'ok',
    upload: { file_name: 'rapor.pdf', content_type: 'application/pdf' },
    streamReject: null,
    stream401: 0,
    streams: [],
    opened: 0,
    cancelled: 0,
    reads: [],
    typing: [],
    holds: [],
  }
}

const BASE_TIME = Date.parse('2026-11-14T08:00:00Z')
/** Deterministik zaman damgası: her `n` bir dakika ilerler. */
export const stamp = (n: number): string => new Date(BASE_TIME + n * 60_000).toISOString()

export function nextId(state: ChatState, prefix: string): string {
  state.seq += 1
  return `${prefix}${state.seq}`
}

export function member(account_id: string, role: ChatRoleName = 'member'): FakeMember {
  return { account_id, role, from_source: false }
}

/** Sohbet kur (test düzeneği): `messages` boş, okundu imleçleri 0. */
export function makeChat(
  id: string,
  kind: 'direct' | 'group',
  members: FakeMember[],
  patch: Partial<FakeChat> = {},
): FakeChat {
  return {
    chat_id: id,
    program_id: 'p1',
    kind,
    name: kind === 'group' ? `Sohbet ${id}` : null,
    auto_kind: null,
    source: 'none',
    source_department_id: null,
    created_by: members[0]!.account_id,
    created_at: stamp(0),
    members,
    messages: [],
    reads: Object.fromEntries(members.map((m) => [m.account_id, 0])),
    last_seq: 0,
    ...patch,
  }
}

/** Sohbete mesaj ekler (düzenek; olay YAYILMAZ). Gönderen kendi mesajını okumuş sayılır. */
export function addMessage(
  chat: FakeChat,
  sender: Account,
  body: string,
  patch: Partial<ChatMessage> = {},
): FakeMessage {
  chat.last_seq += 1
  const seq = chat.last_seq
  const message: FakeMessage = {
    base: {
      attachments: [],
      body,
      chat_id: chat.chat_id,
      client_message_id: `cm-${chat.chat_id}-${seq}`,
      created_at: stamp(seq),
      edit_revision: 1,
      edited: false,
      edited_at: null,
      forwarded_from: null,
      mentions: [],
      message_id: `${chat.chat_id}-m${seq}`,
      pinned_at: null,
      poll: null,
      refs: [],
      reply_to_message_id: null,
      sender_account_id: sender.account_id,
      sender_name: sender.full_name,
      seq,
      task_ids: [],
      ...patch,
    },
    reactions: new Map(),
    votes: new Map(),
  }
  chat.messages.push(message)
  chat.reads[sender.account_id] = Math.max(chat.reads[sender.account_id] ?? 0, seq)
  return message
}

// --- Görünümler ---------------------------------------------------------------------------

export function viewOf(message: FakeMessage, viewer: string): ChatMessage {
  const counts = new Map<string, number>()
  for (const kind of message.reactions.values()) counts.set(kind, (counts.get(kind) ?? 0) + 1)
  const reactions = [...counts].map(([kind, count]) => ({
    kind: kind as ChatMessage['reactions'][number]['kind'],
    count,
    mine: message.reactions.get(viewer) === kind,
  }))
  const poll = message.base.poll
  const results = poll?.results.map((row) => {
    const voters = [...message.votes]
      .filter(([, picks]) => picks.includes(row.option_index))
      .map(([account_id]) => ({ account_id, full_name: null }))
    return {
      ...row,
      count: voters.length,
      voters,
      mine: voters.some((v) => v.account_id === viewer),
    }
  })
  return structuredClone({
    ...message.base,
    reactions,
    ...(poll && results ? { poll: { ...poll, results } } : {}),
  })
}

export function isMember(chat: FakeChat, account: string): boolean {
  return chat.members.some((m) => m.account_id === account)
}

export const roleOf = (chat: FakeChat, account: string): ChatRoleName | null =>
  chat.members.find((m) => m.account_id === account)?.role ?? null

const MANAGERS: readonly ChatRoleName[] = ['admin', 'founder']
const FOUNDER: Record<ChatRoleName, boolean> = { admin: false, founder: true, member: false }

/** Grup yöneticisi ya da kurucusu mu (üye yönetimi, sabit, `@herkes`). */
export function isManager(chat: FakeChat, account: string): boolean {
  const own = roleOf(chat, account)
  return own !== null && MANAGERS.includes(own)
}

export const isFounder = (row: FakeMember): boolean => FOUNDER[row.role]

export function unreadOf(chat: FakeChat, account: string): number {
  const read = chat.reads[account] ?? 0
  return chat.messages.filter((m) => m.base.seq > read && m.base.sender_account_id !== account)
    .length
}

export function mentionedIn(chat: FakeChat, account: string): boolean {
  const read = chat.reads[account] ?? 0
  return chat.messages.some(
    (m) =>
      m.base.seq > read &&
      m.base.sender_account_id !== account &&
      m.base.mentions.some((x) => x.kind === 'all' || x.target_id === account),
  )
}

/** Sohbet gövdesi (`Chat`); `viewer` birebirde karşı tarafın adını çözer. */
export function chatView(db: OrgDb, chat: FakeChat, viewer: string) {
  const other =
    chat.kind === 'direct' ? chat.members.find((m) => m.account_id !== viewer) : undefined
  const last = chat.messages.at(-1)
  return {
    auto_kind: chat.auto_kind,
    chat_id: chat.chat_id,
    counterpart_account_id: other?.account_id ?? null,
    counterpart_name: other ? fakeOrg.accountName(db, other.account_id) : null,
    created_at: chat.created_at,
    created_by_account_id: chat.created_by,
    kind: chat.kind,
    last_message_at: last?.base.created_at ?? null,
    last_seq: chat.last_seq,
    name: chat.name,
    role: roleOf(chat, viewer) ?? 'member',
    source: chat.source,
    source_department_id: chat.source_department_id,
  }
}

// --- Yetki ve hata yardımcıları -------------------------------------------------------------

export const notFound = () => envelope('messaging.chat_not_found', 404)
export const notAuthorized = () => envelope('messaging.not_authorized', 403)
export const noMessage = () => envelope('messaging.message_not_found', 404)

/** Hesabın bu programda üyeliği ya da yönetici olgusu var mı (sunucu erişim kapısı). */
export function inProgram(db: OrgDb, account: Account, programId: string): boolean {
  return account.admin || fakeOrg.rowsOf(db, account.account_id, programId).length > 0
}

/**
 * Birebir yalnız koordinatörlük zinciri içinde açılır (istemci-akislari §10.6): ŞY herkesle,
 * diğerleri yalnız aynı birimde üyeliği olanlarla. Aday listesi ve `openDirectChat` aynı kuralı izler.
 */
export function canDirect(db: OrgDb, a: Account, b: Account, programId: string): boolean {
  if (a.admin || b.admin) return true
  const units = (who: Account) =>
    new Set(fakeOrg.rowsOf(db, who.account_id, programId).map((r) => r.department_id))
  const mine = units(a)
  return [...units(b)].some((id) => mine.has(id))
}

/** Çağıran + program başlığı; sohbet çözümü: üye değilse 404 (varlık sızdırılmaz). */
export function resolveChat(
  db: OrgDb,
  state: ChatState,
  request: Request,
  chatId: string,
): { account: Account; chat: FakeChat } | Response {
  const account = fakeOrg.actorOf(db, request)
  if (!account) return envelope('platform.unauthenticated', 401)
  const program = fakeOrg.programOf(request)
  const chat = state.chats.find((c) => c.chat_id === chatId && c.program_id === program)
  if (!chat || !isMember(chat, account.account_id)) return notFound()
  return { account, chat }
}

export const isResponse = (value: unknown): value is Response => value instanceof Response
