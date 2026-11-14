<script setup lang="ts">
/**
 * Konuşma bölmesi İSKELETİ (gövde O2b): başlık, sabit şeridi, mesaj akışı, `Composer`. Pencere ve
 * eylemler `useChatPage()` bağlamından gelir (sayfa sahibi tek okuyucu/akış açar).
 */
defineProps<{
  chatId: string
}>()
</script>

<template>
  <section class="conversation-pane" :data-chat-id="chatId" data-testid="conversation-pane" />
</template>
