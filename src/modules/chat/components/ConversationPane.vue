<script setup lang="ts">
import './thread/thread.css'

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { UiButton } from '@/shared/ui'

import { ApiError } from '@/shared/errors/api-error'

import { chatText } from '../messages'
import { CHATS_ROUTE } from '../routes'
import Composer from './Composer.vue'
import { chatDrafts } from './composer/drafts'
import MessageList from './thread/MessageList.vue'
import { useMessagesState } from './thread/messages-state'
import PinBar from './thread/PinBar.vue'
import ThreadHeader from './thread/ThreadHeader.vue'
import { provideActions } from './thread/use-actions'
import { provideThread } from './thread/use-thread'

/**
 * Konuşma bölmesi (10 sağ sütun): başlık, sabit şeridi, mesaj akışı, yazma çubuğu. Pencere ve
 * SSE akışı `ChatPage` sahibindedir (`useChatPage`); burada iki ikinci okuyucu/akış açılmaz.
 * Bağlam (`createThread`) bir kez kurulur ve alt bileşenlere verilir. Durumlar: sohbet
 * okunuyor, 404 `chat_not_found` ("Bu konuşma bulunamadı" + listeye dön).
 */
const props = defineProps<{
  chatId: string
}>()
const router = useRouter()
const thread = provideThread(() => props.chatId)
provideActions(thread)
const state = useMessagesState()

const notFound = computed(() => {
  const error = thread.chatError.value
  return error instanceof ApiError && error.code === 'messaging.chat_not_found'
})
const replyTo = computed(() => chatDrafts.get(thread.draftKey.value)?.replyTo ?? undefined)
</script>

<template>
  <section
    class="chat-thread conversation-pane"
    :data-chat-id="chatId"
    data-testid="conversation-pane"
    :aria-label="thread.chat.value?.name ?? thread.chat.value?.counterpart_name ?? undefined"
  >
    <div v-if="notFound" class="chat-list__state" role="alert" data-testid="chat-not-found">
      <span>{{ chatText('chat.states.notFound') }}</span>
      <UiButton @click="void router.push({ name: CHATS_ROUTE.name })">
        {{ chatText('chat.thread.backToList') }}
      </UiButton>
    </div>
    <template v-else>
      <ThreadHeader />
      <PinBar />
      <MessageList
        :loading="state.loading.value || thread.chatPending.value"
        :failed="state.failed.value"
        @retry="state.retry"
      />
      <Composer :chat-id="chatId" :reply-to="replyTo" />
    </template>
  </section>
</template>
