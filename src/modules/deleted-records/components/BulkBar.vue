<script setup lang="ts">
import { UiIcon } from '@/shared/ui'

import { deletedText } from '../model/messages'

/**
 * Toplu işlem çubuğu (E-12-21; 12 tasarımı `rp-bulk`): "‹n› kayıt seçildi" + Geri yükle · Kalıcı
 * sil · Seçimi kaldır. Yalnız seçim varken çizilir (çağıran). Uçuşta eylem düğmeleri
 * `aria-disabled` olur (odak kaybolmaz; çift tık kilidi). Yetkisiz eylem gizlenir (güvenlik
 * değildir; sunucu 403 gerçek sonuçtur).
 */
defineProps<{ count: number; busy: boolean; canRestore: boolean; canPurge: boolean }>()
const emit = defineEmits<{ restore: []; purge: []; clear: [] }>()
</script>

<template>
  <div class="dr-bulk" role="toolbar" :aria-label="deletedText('bulk.label')" data-testid="dr-bulk">
    <span class="dr-bulk__count" role="status">{{
      deletedText('bulk.selected', { n: count })
    }}</span>
    <button
      v-if="canRestore"
      type="button"
      class="t-btn t-btn--primary t-btn--sm"
      :aria-disabled="busy ? 'true' : undefined"
      data-action="bulk-restore"
      @click="!busy && emit('restore')"
    >
      <UiIcon name="undo" size="sm" />{{ deletedText('bulk.restore') }}
    </button>
    <button
      v-if="canPurge"
      type="button"
      class="t-btn t-btn--ghost t-btn--sm dr-danger"
      :aria-disabled="busy ? 'true' : undefined"
      data-action="bulk-purge"
      @click="!busy && emit('purge')"
    >
      <UiIcon name="trash" size="sm" />{{ deletedText('bulk.purge') }}
    </button>
    <button
      type="button"
      class="t-btn t-btn--ghost t-btn--sm"
      data-action="bulk-clear"
      @click="emit('clear')"
    >
      {{ deletedText('bulk.clear') }}
    </button>
  </div>
</template>
