import type { RouteRecordRaw } from 'vue-router'

export const CHATS_ROUTE = { name: 'collaboration.chats', path: '/mesajlar' } as const
export const CHAT_ROUTE = { name: 'collaboration.chat', path: '/mesajlar/:chatId' } as const

/** Rota sorgusu: süzgeç sekmesi (`filtre`) ve hedef mesaj `seq` (`mesaj`, yalnız bağlantıyla gelişte). */
export const CHAT_QUERY_KEYS = ['filtre', 'mesaj'] as const

export const chatRoutes: RouteRecordRaw[] = [
  { ...CHATS_ROUTE, component: () => import('./pages/ChatPage.vue'), meta: { scope: 'S2' } },
  { ...CHAT_ROUTE, component: () => import('./pages/ChatPage.vue'), meta: { scope: 'S2' } },
]
