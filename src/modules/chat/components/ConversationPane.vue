<script setup lang="ts">
import './thread/thread.css'

import { computed } from 'vue'

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
 * Bağlam (`createThread`) bir kez kurulur ve alt bileşenlere verilir.  404 "Bu konuşma bulunamadı" durumu sayfa sahibindedir.
 */
const props = defineProps<{
  chatId: string
}>()
const thread = provideThread(() => props.chatId)
provideActions(thread)
const state = useMessagesState()

const replyTo = computed(() => chatDrafts.get(thread.draftKey.value)?.replyTo ?? undefined)
</script>

<template>
  <section
    class="chat-thread conversation-pane"
    :data-chat-id="chatId"
    data-testid="conversation-pane"
    :aria-label="thread.chat.value?.name ?? thread.chat.value?.counterpart_name ?? undefined"
  >
    <ThreadHeader />
    <PinBar />
    <MessageList
      :loading="state.loading.value || thread.chatPending.value"
      :failed="state.failed.value"
      @retry="state.retry"
    />
    <Composer :chat-id="chatId" :reply-to="replyTo" />
  </section>
</template>
