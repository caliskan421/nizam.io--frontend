<script setup lang="ts">
/**
 * 10c yedi pencerenin sahibi İSKELET (gövde O2b): `request` hangi pencerenin hangi olguyla
 * açıldığını söyler (`model/dialogs.ts`); kapanış (Esc, ✕, Vazgeç, dış tık, eylem sonrası söküm)
 * `close` yayar ve odak tetikleyiciye döner (KESİN 27).
 */
import type { DialogRequest } from '../model/dialogs'

defineProps<{
  /** Açık pencere isteği; `null` hepsi kapalı. */
  request: DialogRequest | null
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="request !== null"
    class="chat-dialogs"
    :data-dialog="request.dialog"
    data-testid="chat-dialogs"
  />
</template>
