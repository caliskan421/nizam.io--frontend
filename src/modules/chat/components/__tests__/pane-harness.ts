// Konuşma gövdesi testleri: GERÇEK ConversationPane + gerçek `useChatMessages` (ChatPage'in
// kurduğu gibi) + msw sahte backend. SSE açılmaz; pencere yazma/okuma yolu gerçektir.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, provide, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import ConfirmHost from '@/shared/ui/confirm/ConfirmHost.vue'
import { useScopeStore } from '@/shared/scope/store'

import { useChatMessages } from '../../api/message-window'
import { CHAT_PAGE_KEY } from '../../model/context'
import type { Chat, ChatMessage, MessageQuery } from '../../model/types'
import { chatRoutes } from '../../routes'
import { fakeChatServer } from '../../__tests__/fixtures'
import {
  conversationHandlers,
  type ConversationHandlerOptions,
} from '../../__tests__/conversation-handlers'
import { http, HttpResponse, json, ORIGIN, server, settleQueries } from '../../__tests__/harness'
import { CHAT_DIALOG_OPENER } from '../thread/dialog-opener'
import ConversationPane from '../ConversationPane.vue'
import { resetDrafts } from '../composer/drafts'
import type { DialogRequest } from '../../model/dialogs'

export const CHAT: Chat = {
  auto_kind: null,
  chat_id: 'c1',
  counterpart_account_id: null,
  counterpart_name: null,
  created_at: '2026-11-01T08:00:00Z',
  created_by_account_id: 'acc-1',
  kind: 'group',
  last_message_at: null,
  last_seq: 0,
  name: 'Eğitim Grubu',
  role: 'member',
  source: 'none',
  source_department_id: null,
}

export interface PaneOptions extends ConversationHandlerOptions {
  chat?: Partial<Chat>
  messages?: ChatMessage[]
  peerReadSeq?: number | null
  /** Sohbet listesi özeti (okunmamış ayırıcısı: sunucu `first_unread_seq`, BE-082). */
  summary?: { unread_count: number; first_unread_seq?: number | null }
  /** Geçmiş cevabının `first_unread_seq` değeri (liste özeti yoksa çapa kaynağı). */
  historyFirstUnreadSeq?: number | null
  path?: string
}

export function servePane(options: PaneOptions = {}) {
  resetDrafts()
  const chat = { ...CHAT, ...options.chat }
  const fake = fakeChatServer(options.messages ?? [], options.peerReadSeq ?? null, {
    seq: options.historyFirstUnreadSeq ?? null,
  })
  server.use(
    http.get(`${ORIGIN}/v1/chats`, () =>
      json({
        items: options.summary
          ? [
              {
                ...chat,
                last_message: null,
                mentioned: false,
                first_unread_seq: null,
                ...options.summary,
              },
            ]
          : [],
        next_cursor: '',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })),
    http.post(`${ORIGIN}/v1/chats/:id/read`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${ORIGIN}/v1/chats/:id/typing`, () => new HttpResponse(null, { status: 204 })),
    http.get(`${ORIGIN}/v1/chats/${chat.chat_id}`, () => json(chat)),
    http.get(`${ORIGIN}/v1/chats/:id/messages`, ({ request }) => {
      const q = new URL(request.url).searchParams
      const query: MessageQuery = { limit: Number(q.get('limit') ?? 50) }
      for (const key of ['before', 'after', 'around'] as const) {
        if (q.has(key)) query[key] = Number(q.get(key))
      }
      return HttpResponse.json(fake.readSync(query))
    }),
    ...conversationHandlers({ ...options, accountId: options.accountId ?? 'acc-1' }),
  )
  return { chat, fake }
}

const mounted: VueWrapper[] = []

/** afterEach: gövdeyi silmeden önce bütün bağlı örnekleri söker (geç güncelleme DOM'u bozmasın). */
export function unmountAll(): void {
  for (const w of mounted.splice(0)) w.unmount()
  document.body.innerHTML = ''
}

export async function mountPane(
  options: PaneOptions & { chatId?: string; queryClient?: QueryClient } = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const router = createRouter({ history: createMemoryHistory(), routes: chatRoutes })
  await router.push(options.path ?? '/mesajlar/c1')
  await router.isReady()
  const client =
    options.queryClient ??
    new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const dialogs: DialogRequest[] = []
  const typing = ref<string[]>([])
  const Host = defineComponent({
    setup() {
      const messages = useChatMessages(() => options.chatId ?? 'c1')
      provide(CHAT_PAGE_KEY, {
        chatId: () => options.chatId ?? 'c1',
        messages,
        typingAccountIds: () => typing.value,
        connection: () => 'open',
      })
      provide(CHAT_DIALOG_OPENER, (request) => void dialogs.push(request))
      return () => [h(ConversationPane, { chatId: options.chatId ?? 'c1' }), h(ConfirmHost)]
    },
  })
  const wrapper: VueWrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  mounted.push(wrapper)
  await flushPromises()
  await settleQueries(client)
  await flushPromises()
  return { wrapper, client, router, dialogs, typing }
}

export async function settle(client: QueryClient): Promise<void> {
  await flushPromises()
  await settleQueries(client)
  await flushPromises()
}
