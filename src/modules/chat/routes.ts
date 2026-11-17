import type { RouteRecordRaw } from 'vue-router'

export const CHATS_ROUTE = { name: 'collaboration.chats', path: '/mesajlar' } as const
export const CHAT_ROUTE = { name: 'collaboration.chat', path: '/mesajlar/:chatId' } as const

/** Rota sorgusu: süzgeç sekmesi (`filtre`) ve hedef mesaj `seq` (`mesaj`, yalnız bağlantıyla gelişte). */
export const CHAT_QUERY_KEYS = ['filtre', 'mesaj'] as const

/**
 * Sohbetteki bir mesaja doğrudan hedef (kaynak mesaj bağlantısı, bildirim): kayıtlı rota
 * `collaboration.chat` + hedef sıra `mesaj=<seq>` (mevcut `around` okuması açar). Yeni sorgu adı yok.
 */
export function chatMessageLocation(chatId: string, seq: number) {
  return { name: CHAT_ROUTE.name, params: { chatId }, query: { mesaj: String(seq) } }
}

export const chatRoutes: RouteRecordRaw[] = [
  { ...CHATS_ROUTE, component: () => import('./pages/ChatPage.vue'), meta: { scope: 'S2' } },
  { ...CHAT_ROUTE, component: () => import('./pages/ChatPage.vue'), meta: { scope: 'S2' } },
]
