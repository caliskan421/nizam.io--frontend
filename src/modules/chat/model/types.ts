import type { QueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'

import type { components, operations } from '@/shared/api/schema'
import type { ScopeSnapshot } from '@/shared/scope/scope'

import type { MessageWindow } from './window'

type S = components['schemas']

export type Chat = S['Chat']
export type ChatSummary = S['ChatSummary']
export type ChatList = S['ChatList']
export type ChatMessage = S['ChatMessage']
export type ChatHistory = S['ChatHistory']
export type ChatMember = S['ChatMember']
export type ChatMemberList = S['ChatMemberList']
export type ChatCandidate = S['ChatCandidate']
export type ChatCandidateList = S['ChatCandidateList']
export type ChatPins = S['ChatPins']
export type ChatMention = S['ChatMention']
export type ChatMessageRef = S['ChatMessageRef']
export type ChatMessageQuote = S['ChatMessageQuote']
export type ChatRefSummary = S['ChatRefSummary']
export type ChatRefList = S['ChatRefList']
export type ChatSharedRef = S['ChatSharedRef']
export type ChatUnreadOverview = S['ChatUnreadOverview']
export type ChatUnreadProgram = S['ChatUnreadProgram']
export type ChatEvent = S['ChatEvent']
export type ChatMessageTaskCreated = S['ChatMessageTaskCreated']
export type SendChatMessageRequest = S['SendChatMessageRequest']
export type EditChatMessageRequest = S['EditChatMessageRequest']
export type CreateGroupChatRequest = S['CreateGroupChatRequest']
export type UpdateChatRequest = S['UpdateChatRequest']
export type CreateTaskFromChatMessageRequest = S['CreateTaskFromChatMessageRequest']
export type MarkedCount = S['MarkedCount']

export type ChatKind = Chat['kind']
export type ChatRole = NonNullable<Chat['role']>
export type ChatAutoKind = Chat['auto_kind']
export type ChatSource = Chat['source']
export type ReactionKind = S['SetChatReactionRequest']['kind']
export type RefKind = ChatMessageRef['kind']
export type CandidatePurpose = NonNullable<
  operations['listChatCandidates']['parameters']['query']
>['purpose']
export type Poll = NonNullable<ChatMessage['poll']>
export type AttachmentForm =
  operations['sendChatAttachment']['requestBody']['content']['multipart/form-data']
export type MessageQuery = NonNullable<operations['listChatMessages']['parameters']['query']>

/** Program kapsamı (S2 başlığı); yazmalar eylemin yakaladığı programı taşır (K2). */
export interface ProgramTarget {
  programId: string
}
export interface ChatTarget extends ProgramTarget {
  chatId: string
}
export interface MessageTarget extends ChatTarget {
  messageId: string
  /** Mesajın `seq` değeri: tepki/oy/sabit sonrası `around` okumasının imleci. */
  seq: number
}

export interface SendMessageInput extends ChatTarget {
  body: SendChatMessageRequest
}
export interface SendAttachmentInput extends ChatTarget {
  clientMessageId: string
  file: File
  /** İsteğe bağlı açıklama (dosyadan ÖNCE gönderilen parça). */
  caption?: string
  replyToMessageId?: string
}
export interface EditMessageInput extends MessageTarget {
  body: string
  /** Son okunan `edit_revision`. */
  expectedRevision: number
}
export interface MarkReadInput extends ChatTarget {
  messageId: string
}
export interface OpenDirectInput extends ProgramTarget {
  accountId: string
}
export interface CreateGroupInput extends ProgramTarget {
  body: CreateGroupChatRequest
}
export interface UpdateChatInput extends ChatTarget {
  body: UpdateChatRequest
}
export interface MembersInput extends ChatTarget {
  accountIds: string[]
}
export interface MemberTarget extends ChatTarget {
  accountId: string
}
export interface ReactInput extends MessageTarget {
  kind: ReactionKind
}
export interface VoteInput extends MessageTarget {
  optionIndexes: number[]
}
export interface TaskFromMessageInput extends MessageTarget {
  body: CreateTaskFromChatMessageRequest
}

/** `listChats` sorgusu (`limit` istemci sabitidir). */
export interface ChatListQuery {
  q: string
  cursor?: string
}

/** Mesaj okuma bağlamı (oturum kapısı `sessionBound` bu iptal sinyaline bağlanır). */
export interface MessageReadContext {
  signal: AbortSignal
  query: MessageQuery
}

/** İndirme isteği: ek (`chat-attachments`) ya da paylaşılan dosya (`chat-file-refs`). */
export interface ChatDownloadRequest extends ProgramTarget {
  kind: 'attachment' | 'shared-file'
  /** `attachment_id` ya da `ref_id`. */
  id: string
  /** Sunucu `Content-Disposition` vermezse kaydedilecek ad. */
  fallbackName: string
}
export type TypingInput = ChatTarget

/** `useChatMessages` sonucundan akışın ihtiyaç duyduğu yüz (pencere okumaları). */
export interface ChatStreamMessages {
  window: { value: MessageWindow }
  loadNewer: () => Promise<void>
  refreshMessage: (seq: number) => Promise<void>
  refreshPeerRead: () => Promise<void>
  reconcile: () => Promise<void>
}

/** `applyPlan` bağımlılıkları (SSE olayının uygulanması). */
export interface ApplyDeps {
  client: QueryClient
  /** Akışın açıldığı kapsam (olay bu kapsamın önbelleğine uygulanır). */
  scope: ScopeSnapshot
  openChatId: string | null
  messages: ChatStreamMessages | null
  alive: () => boolean
  onChatLost: (chatId: string) => void
}

/** `useChatStream` girdisi. */
export interface ChatStreamOptions {
  /** Açık sohbet (`/mesajlar/:chatId`) ya da `null`. */
  chatId: MaybeRefOrGetter<string | null>
  /** Açık sohbetin pencere okumaları (`useChatMessages`); sohbet yoksa `null`. */
  messages: ChatStreamMessages | null
  enabled?: MaybeRefOrGetter<boolean>
  /** Açık sohbetten düşüldü (404 `messaging.chat_not_found`): sayfa listeye döner. */
  onChatLost?: (chatId: string) => void
}

/** `dispatchEvent` bağımlılıkları (olay → plan → uygulama). */
export interface DispatchDeps {
  client: QueryClient
  scope: ScopeSnapshot
  options: ChatStreamOptions
  meAccountId: string | null
  alive: () => boolean
}
