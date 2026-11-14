<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import type { ChatMessageQuote } from '../../model/types'
import { chatText } from '../../messages'
import { useThread } from './use-thread'

/**
 * Alıntı (E-10-29): yazar adı + tek satır gövde (`deleted` → "silinmiş mesaj"). Tık: yanıtlanan
 * mesaj yüklü pencerede varsa kaydırır + vurgular; yoksa en çok 3 `before` sayfası aranır, yine
 * bulunamazsa sessiz kalır (`ChatMessageQuote`'ta `seq` yok, `around` kurulamaz — BE-162).
 */
const props = defineProps<{ quote: ChatMessageQuote }>()
const thread = useThread()

const author = computed(() => {
  if (
    props.quote.sender_account_id !== null &&
    props.quote.sender_account_id === thread.meId.value
  ) {
    return chatText('chat.thread.me')
  }
  return props.quote.sender_name ?? chatText('chat.thread.unknownPerson')
})
const text = computed(() =>
  props.quote.deleted ? chatText('chat.thread.deleted') : (props.quote.body ?? ''),
)
</script>

<template>
  <button
    type="button"
    class="chat-quote"
    :title="chatText('chat.thread.quote')"
    :disabled="quote.deleted"
    @click="void thread.goToMessage(quote.message_id)"
  >
    <strong>{{ author }}</strong>
    <span class="chat-quote__text" :class="{ 'chat-bub__gone': quote.deleted }">{{ text }}</span>
  </button>
</template>
