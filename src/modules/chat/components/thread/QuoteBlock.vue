<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import type { ChatMessageQuote } from '../../model/types'
import { chatText } from '../../messages'
import { useThread } from './use-thread'

/**
 * Alıntı (E-10-29): yazar adı + tek satır gövde (`deleted` → "silinmiş mesaj"). Tık: yanıtlanan
 * mesaj yüklü pencerede varsa kaydırır + vurgular; yoksa pencere `listChatMessages?around=<reply_to.seq>`
 * ile kurulur (BE-162; `before` araması yok). Silinmiş alıntıda (`seq` null) düğme devre dışıdır.
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
    :disabled="quote.deleted || quote.seq === null"
    @click="quote.seq !== null && void thread.goTo(quote.seq)"
  >
    <strong>{{ author }}</strong>
    <span class="chat-quote__text" :class="{ 'chat-bub__gone': quote.deleted }">{{ text }}</span>
  </button>
</template>
