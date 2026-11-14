<script setup lang="ts">
/**
 * Web Push önerme kutusu İSKELETİ (P58; gövde ve izin akışı W159). `pushPublicKey.enabled`
 * false/bilinmiyorsa kutu hiç çizilmez (E-14-60). `enabled`: abonelik kaydedildi (adım 3
 * kartı); `dismissed`: "Şimdi değil" (bellekte `snoozed`, kalıcı anahtar yok).
 */
import { notificationText } from '../messages'

defineEmits<{
  enabled: []
  dismissed: []
}>()
</script>

<template>
  <section
    class="push-opt-in"
    :aria-label="notificationText('notifications.push.title')"
    data-testid="push-opt-in"
  />
</template>
