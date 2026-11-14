/**
 * Sayfa sahibinin (`ChatPage`) alt bileşenlere verdiği bağlam: açık sohbet, mesaj penceresi
 * eylemleri ve akış. Böylece `ConversationPane`/`Composer` aynı pencereyi ve aynı tek akışı
 * kullanır (iki ayrı akış/okuyucu açılmaz; KESİN 34). `provide` yalnız `ChatPage`'dedir.
 */
import { inject, type InjectionKey } from 'vue'

import type { ChatStreamMessages } from './types'

export interface ChatPageContext {
  chatId: () => string | null
  messages: ChatStreamMessages & {
    loadOlder: () => Promise<void>
    jumpTo: (seq: number) => Promise<void>
  }
  /** Yazanların hesap kimlikleri (açık sohbet; ~5 sn). */
  typingAccountIds: () => string[]
}

export const CHAT_PAGE_KEY: InjectionKey<ChatPageContext> = Symbol('chat-page')

export function useChatPage(): ChatPageContext {
  const context = inject(CHAT_PAGE_KEY, null)
  if (context === null) throw new Error('useChatPage yalnız ChatPage altında kullanılır')
  return context
}
