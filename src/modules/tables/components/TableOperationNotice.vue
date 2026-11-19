<script setup lang="ts">
import { UiButton } from '@/shared/ui'

defineProps<{
  message: string
  busy: boolean
  conflict: boolean
  uncertain: boolean
  retryable: boolean
}>()
defineEmits<{ reload: []; retry: [] }>()
</script>

<template>
  <div v-if="message || busy" class="tables-notice">
    <p role="status">{{ busy ? 'İşlem sürüyor…' : message }}</p>
    <div v-if="conflict || uncertain" class="tables-actions">
      <UiButton size="sm" :disabled="busy" @click="$emit('reload')">Güncel tabloyu oku</UiButton>
      <UiButton v-if="uncertain && retryable" size="sm" :disabled="busy" @click="$emit('retry')">
        Aynı isteği gönder
      </UiButton>
    </div>
  </div>
</template>
