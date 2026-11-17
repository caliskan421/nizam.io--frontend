/**
 * Sayfa sahibinin (`ChatPage`) alt bileşenlere verdiği bağlam: açık sohbet, mesaj penceresi
 * eylemleri ve akış. Böylece `ConversationPane`/`Composer` aynı pencereyi ve aynı tek akışı
 * kullanır (iki ayrı akış/okuyucu açılmaz; KESİN 34). `provide` yalnız `ChatPage`'dedir.
 */
import { inject, type InjectionKey, type Ref } from 'vue'

import type { StreamState } from '@/shared/sse'

import type { ChatStreamMessages } from './types'

/** Pencere okuyucusunun yükleniyor/hata durumu (konuşma bölmesi iskeleti ve "Yeniden dene"). */
export interface MessagesQueryState {
  isPending: Readonly<Ref<boolean>>
  isError: Readonly<Ref<boolean>>
  refetch: () => Promise<unknown>
}

export interface ChatPageContext {
  chatId: () => string | null
  messages: ChatStreamMessages & {
    loadOlder: () => Promise<void>
    jumpTo: (seq: number) => Promise<void>
    /** Giriş tazeliği: geçmişin sayfadan bağımsız `first_unread_seq` değeri (okunamazsa `undefined`). */
    readFirstUnread: () => Promise<number | null | undefined>
    query: MessagesQueryState
  }
  /** Yazanların hesap kimlikleri (açık sohbet; ~5 sn). */
  typingAccountIds: () => string[]
  /** Gerçek zamanlı akışın durumu (N-10-15 "Bağlantı yeniden kuruluyor…" göstergesi). */
  connection: () => StreamState
}

export const CHAT_PAGE_KEY: InjectionKey<ChatPageContext> = Symbol('chat-page')

export function useChatPage(): ChatPageContext {
  const context = inject(CHAT_PAGE_KEY, null)
  if (context === null) throw new Error('useChatPage yalnız ChatPage altında kullanılır')
  return context
}
