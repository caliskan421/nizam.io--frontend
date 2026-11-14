<script setup lang="ts">
import './thread/thread.css'

import { computed } from 'vue'

import Composer from './Composer.vue'
import { chatDrafts } from './composer/drafts'
import MessageList from './thread/MessageList.vue'
import { useConnectionNotice } from './thread/use-connection-notice'
import { useMessagesState } from './thread/messages-state'
import PinBar from './thread/PinBar.vue'
import ThreadHeader from './thread/ThreadHeader.vue'
import { provideActions } from './thread/use-actions'
import { provideThread } from './thread/use-thread'
import { chatText } from '../messages'
import { useChatPage } from '../model/context'

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
const page = useChatPage()
const reconnecting = useConnectionNotice(() => page.connection()).visible

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
    <p v-if="reconnecting" class="chat-thread__conn" role="status" data-testid="chat-reconnecting">
      {{ chatText('chat.states.reconnecting') }}
    </p>
    <PinBar />
    <MessageList
      :loading="state.loading.value || thread.chatPending.value"
      :failed="state.failed.value"
      @retry="state.retry"
    />
    <Composer :chat-id="chatId" :reply-to="replyTo" />
  </section>
</template>
