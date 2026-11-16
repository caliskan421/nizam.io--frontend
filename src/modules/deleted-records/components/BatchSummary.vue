<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import type { BatchSummary } from '../model/batch'
import { deletedText } from '../model/messages'

/**
 * Toplu işlem sonucu (BE-114): "‹ok› kayıt işlendi, ‹bad› kayıt işlenemedi" + başarısız her
 * kaydın adı ve gerekçesi (hata kodu → i18n; sunucu `message` gösterilmez). Kullanıcı kapatana
 * kadar kalır; kapanınca odak çağırana döner (`dismiss`).
 */
defineProps<{ summary: BatchSummary }>()
const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div
    class="dr-notice dr-notice--batch"
    role="alert"
    :data-tone="summary.tone"
    data-testid="dr-batch-summary"
  >
    <UiIcon name="alert" size="sm" />
    <p class="dr-notice__text">{{ summary.message }}</p>
    <button
      type="button"
      class="t-btn t-btn--ghost t-btn--sm"
      data-testid="dr-batch-dismiss"
      @click="emit('dismiss')"
    >
      {{ deletedText('batch.dismiss') }}
    </button>
    <ul v-if="summary.failures.length" class="dr-batch-list">
      <li v-for="line in summary.failures" :key="line.id" :data-failed-id="line.id">
        <span class="dr-batch-list__title">{{ line.title }}</span
        ><span class="dr-batch-list__reason">{{ line.reason }}</span>
      </li>
    </ul>
  </div>
</template>
