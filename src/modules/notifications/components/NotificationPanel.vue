<script setup lang="ts">
/**
 * Bildirim paneli İSKELETİ (W154 sözleşmesi; gövde W158'in). Zile hizalı açılır panel
 * (`role="dialog"`, modal değil; 390 px'te tam ekran: P62, KESİN 30). Kapanış olayları (Esc,
 * dış tık, zil, gezinme, kapsam/oturum değişimi) ve odak dönüşü (zile) W158'de; bu iskelet
 * yalnız props/emits sözleşmesini ve kabuk yuvasını sabitler. Veri: `useNotifications(open)`.
 */
import { notificationText } from '../messages'
import type { NotificationTarget } from '../model/target'

defineProps<{
  /** Panel açık mı; kapalıyken liste okunmaz (E-14-18). */
  open: boolean
}>()

defineEmits<{
  /** Esc, dış tık, ✕ ya da gezinme sonrası kapanış isteği. */
  close: []
  /** Satır tıklaması: hedef rota (membership/bilinmeyen için gönderilmez). */
  navigate: [target: NotificationTarget]
}>()
</script>

<template>
  <section
    v-if="open"
    class="notification-panel"
    role="dialog"
    :aria-label="notificationText('notifications.panel.title')"
    data-testid="notification-panel"
  />
</template>
