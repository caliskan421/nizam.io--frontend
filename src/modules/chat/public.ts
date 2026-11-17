// chat modülünün (10 Mesajlar; F7) dışa açık yüzü. Diğer modüller ve `app/` yalnız bu dosyayı içe
// aktarır. Gövde (liste, konuşma, yazma çubuğu, pencereler) O2b işçilerinindir; bu yüz veri
// katmanı + sözleşmelerdir. Gerçek zamanlı akış `shared/sse` üzerindendir (KESİN 34).
export { CHAT_QUERY_KEYS, CHAT_ROUTE, CHATS_ROUTE, chatMessageLocation, chatRoutes } from './routes'
export {
  useChat,
  useChatCandidates,
  useChatMembers,
  useChatPins,
  useChatRefs,
  useChatRefSummary,
  useChats,
  useChatUnreadOverview,
} from './api/queries'
export { fetchUnreadOverview } from './api/fetchers'
export { useChatMessages } from './api/message-window'
export { useChatStream } from './api/stream'
export { useSendChatAttachment, useChatDownload, chatDownloadPath } from './api/attachments'
export { useTypingSignal } from './api/typing'
export * from './api/writes'
export { default as ChatDialogs } from './components/ChatDialogs.vue'
export { default as ChatListPane } from './components/ChatListPane.vue'
export { default as Composer } from './components/Composer.vue'
export { default as ConversationPane } from './components/ConversationPane.vue'
export { CHAT_PAGE_KEY, useChatPage, type ChatPageContext } from './model/context'
export * from './model/capabilities'
export { createDraftStore, type Draft, type DraftStore, type EditDraft } from './model/draft'
export { CHAT_DIALOGS, type ChatDialogName, type DialogRequest } from './model/dialogs'
export { planFor, type EventPlan } from './model/events'
export { chatFailure, CHAT_FAILURES, type ChatFailure } from './model/failure'
export * from './model/attachments'
export * from './model/message-state'
export * from './model/typing'
export * from './model/unread'
export * from './model/window'
export type * from './model/types'
export { chatText, type ChatTextKey } from './messages'
