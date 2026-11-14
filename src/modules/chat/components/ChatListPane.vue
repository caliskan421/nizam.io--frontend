<script setup lang="ts">
/**
 * Konuşma listesi İSKELETİ (W154 sözleşmesi; gövde O2b). Veri: `useChats(q)` (imleçli, sunucu
 * sırası; istemci yeniden sıralamaz). `select`: satır tıklaması → `/mesajlar/:chatId`; `create`:
 * "Yeni konuşma" → Yeni grup penceresi (`group`) ya da birebir (`direct`).
 */
import { chatText } from '../messages'

defineProps<{
  /** Seçili sohbet (`aria-current` yalnız onda). */
  selectedId?: string
}>()

defineEmits<{
  select: [chatId: string]
  create: [mode: 'group' | 'direct']
}>()
</script>

<template>
  <section
    class="chat-list-pane"
    :aria-label="chatText('chat.list.title')"
    data-testid="chat-list-pane"
  />
</template>
