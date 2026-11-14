<script setup lang="ts">
/**
 * Yazma çubuğu İSKELETİ (gövde O2b). Gönderim kimliği taslakla birlikte korunur
 * (`model/draft.ts`); iyimser balon yok. `sent`: sunucu mesajı kabul etti (201/200).
 */
import type { ChatMessage } from '../model/types'

defineProps<{
  chatId: string
  /** Yanıtlanan mesaj kimliği (`reply_to_message_id`). */
  replyTo?: string
}>()

defineEmits<{
  sent: [message: ChatMessage]
}>()
</script>

<template>
  <form class="chat-composer" :data-chat-id="chatId" data-testid="chat-composer" @submit.prevent />
</template>
