<script setup lang="ts">
/**
 * `/mesajlar[/:chatId]` sayfa SAHİBİ (K8, P65): `shared/sse` akışı yalnız bu sayfa açıkken açılır
 * (`useChatStream`), mesaj penceresi okuyucusu (`useChatMessages`) burada kurulur ve alt
 * bileşenlere `CHAT_PAGE_KEY` ile verilir. Dar ekranda (P62) liste ↔ konuşma ROTA durumudur:
 * `/mesajlar` yalnız liste, `/mesajlar/:chatId` yalnız konuşma (`data-pane`). Gövde (liste,
 * konuşma, yazma, pencereler) O2b işçilerinindir; bu dosya yalnız kabuk + bağlama noktalarıdır.
 */
import { computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { usePageCrumb } from '@/shared/navigation/page-crumb'

import { useChat } from '../api/queries'
import { useChatMessages } from '../api/message-window'
import { useChatStream } from '../api/stream'
import ChatDialogs from '../components/ChatDialogs.vue'
import ChatListPane from '../components/ChatListPane.vue'
import ConversationPane from '../components/ConversationPane.vue'
import { CHAT_PAGE_KEY } from '../model/context'
import { chatText } from '../messages'

const route = useRoute()
const router = useRouter()
const chatId = computed(() => {
  const raw = route.params.chatId
  return typeof raw === 'string' && raw !== '' ? raw : null
})

const chat = useChat(chatId)
const messages = useChatMessages(chatId)
const stream = useChatStream({
  chatId,
  messages,
  // Açık sohbetten düşüldü (404): listeye dön.
  onChatLost: () => void router.replace({ name: 'collaboration.chats' }),
})

provide(CHAT_PAGE_KEY, {
  chatId: () => chatId.value,
  messages,
  typingAccountIds: () => stream.typingAccountIds.value,
})

// Konum izinin son parçası sohbet adıdır (E-10-02); veri gelmeden sahte ad yok.
usePageCrumb(() => {
  const data = chat.data.value
  return data ? (data.name ?? data.counterpart_name) : null
})

function select(id: string): void {
  void router.push({ name: 'collaboration.chat', params: { chatId: id } })
}
</script>

<template>
  <section
    class="chat-page"
    :data-pane="chatId === null ? 'list' : 'conversation'"
    data-testid="chat-page"
  >
    <ChatListPane :selected-id="chatId ?? undefined" @select="select" />
    <ConversationPane v-if="chatId !== null" :chat-id="chatId" />
    <p v-else class="chat-page__empty">{{ chatText('chat.thread.select') }}</p>
    <ChatDialogs :request="null" />
  </section>
</template>
