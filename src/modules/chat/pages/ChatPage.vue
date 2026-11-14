<script setup lang="ts">
/**
 * `/mesajlar[/:chatId]` sayfa SAHİBİ (K8, P65): `shared/sse` akışı yalnız bu sayfa açıkken açılır
 * (`useChatStream`), mesaj penceresi okuyucusu (`useChatMessages`) burada kurulur ve alt
 * bileşenlere `CHAT_PAGE_KEY` ile verilir. Dar ekranda (P62) liste ↔ konuşma ROTA durumudur:
 * `/mesajlar` yalnız liste, `/mesajlar/:chatId` yalnız konuşma (`data-pane`); konuşmada başlık
 * üstünde Geri düğmesi `/mesajlar`'a döner ve odak o konuşmanın satırına gider (N-10-40, KESİN 27).
 * Süzgeç sekmesi URL `?filtre=`'dedir ve sohbet seçilince/geri dönülünce korunur. Program
 * değişince açık sohbet kapanır (mekanizma §1). Konuşma gövdesi (`ConversationPane`, `Composer`)
 * ve pencereler (`ChatDialogs`) komşu işçilerindir; bu dosya kabuk + bağlama noktalarıdır.
 */
import { computed, nextTick, provide, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import { ApiError } from '@/shared/errors/api-error'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState } from '@/shared/ui'

import { useChat } from '../api/queries'
import { useChatMessages } from '../api/message-window'
import { useChatStream } from '../api/stream'
import ChatDialogs from '../components/ChatDialogs.vue'
import ChatListPane from '../components/ChatListPane.vue'
import type { ChatListHandle } from '../components/list/handle'
import ConversationPane from '../components/ConversationPane.vue'
import { CHAT_PAGE_KEY } from '../model/context'
import type { DialogRequest } from '../model/dialogs'
import { chatText } from '../messages'
import { CHATS_ROUTE, CHAT_ROUTE } from '../routes'
import { useNarrow } from './use-narrow'

import './chat.css'

const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const narrow = useNarrow()
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
  onChatLost: () => void router.replace({ name: CHATS_ROUTE.name, query: keptQuery() }),
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

/** Geçersiz/erişilemeyen kimlik (404): "Bu konuşma bulunamadı" + listeye dön (N-10-33). */
const notFound = computed(() => {
  const error = chat.error.value
  return error instanceof ApiError && error.code === 'messaging.chat_not_found'
})

/** Yalnız süzgeç taşınır; hedef mesaj (`mesaj`) bağlantıyla gelişe özeldir. */
function keptQuery(): LocationQuery {
  const filtre = route.query.filtre
  return filtre === undefined ? {} : { filtre }
}

const list = ref<ChatListHandle | null>(null)
const thread = ref<HTMLElement | null>(null)

async function select(id: string): Promise<void> {
  await router.push({ name: CHAT_ROUTE.name, params: { chatId: id }, query: keptQuery() })
  // Dar ekranda liste kaybolur: odak, konuşma bölgesi GÖRÜNÜR olduktan sonra (rota çözülünce)
  // oraya taşınır; gizliyken odaklanamaz ve odak gövdeye düşerdi.
  if (!narrow.value) return
  await nextTick()
  thread.value?.focus()
}

function back(): void {
  void router.push({ name: CHATS_ROUTE.name, query: keptQuery() })
}

// Konuşma kapanınca (Geri, tarayıcı geri, düşüş) odak o konuşmanın satırına; yoksa aramaya döner.
watch(chatId, (now, before) => {
  if (now !== null || before === null) return
  void nextTick(() => {
    if (route.name !== CHATS_ROUTE.name) return
    if (list.value?.focusRow(before) !== true) list.value?.focusSearch()
  })
})

// Sohbetler program kapsamlıdır: program değişince açık sohbet kapanır, liste yeni programdan okunur.
watch(
  () => scope.programId,
  (now, before) => {
    if (before === undefined || now === before || chatId.value === null) return
    void router.replace({ name: CHATS_ROUTE.name, query: keptQuery() })
  },
)

const dialog = ref<DialogRequest | null>(null)
function openCreate(mode: 'group' | 'direct'): void {
  dialog.value = { dialog: 'newGroup', mode }
}
function closeDialog(): void {
  dialog.value = null
  // Kapanış yolu ne olursa olsun odak tetikleyiciye (Yeni konuşma düğmesi) döner (KESİN 27).
  void nextTick(() => list.value?.focusCreate())
}
</script>

<template>
  <section
    class="chat-page"
    :data-pane="chatId === null ? 'list' : 'conversation'"
    data-testid="chat-page"
  >
    <ChatListPane
      ref="list"
      :selected-id="chatId ?? undefined"
      @select="select"
      @create="openCreate"
    />
    <div ref="thread" class="chat-page__thread" tabindex="-1" data-testid="chat-thread">
      <template v-if="chatId !== null">
        <div v-if="narrow" class="chat-page__back">
          <UiButton variant="ghost" size="sm" icon="back" data-testid="chat-back" @click="back">
            {{ chatText('chat.thread.back') }}
          </UiButton>
        </div>
        <div v-if="notFound" class="chat-page__lost" data-testid="chat-not-found">
          <UiEmptyState :title="chatText('chat.states.notFound')">
            <template #action>
              <UiButton size="sm" @click="back">{{ chatText('chat.states.backToList') }}</UiButton>
            </template>
          </UiEmptyState>
        </div>
        <ConversationPane v-else :chat-id="chatId" />
      </template>
      <p v-else class="chat-page__empty">{{ chatText('chat.thread.select') }}</p>
    </div>
    <ChatDialogs :request="dialog" @close="closeDialog" />
  </section>
</template>
