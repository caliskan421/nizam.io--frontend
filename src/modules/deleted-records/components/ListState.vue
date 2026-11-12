<script setup lang="ts">
import type { ApiError } from '@/shared/errors/api-error'
import { UiEmptyState, UiErrorState } from '@/shared/ui'

import type { DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'

/**
 * Liste durumları (E-12-60/61/62; tasarımda çizilmemiş, ortak K7 metinleri, P44): ilk yükleme,
 * okuma hatası (yeniden dene), hiç silinmiş kayıt yok, süzgeç sonucu boş (+ "Filtreleri
 * temizle"; imleç bitmediyse "Yüklenen kayıtlarda yok, daha fazla yükle").
 */
defineProps<{
  state: 'loading' | 'error' | 'empty' | 'filtered'
  kind: DeletedKind
  error: ApiError | null
  retrying: boolean
  hasMore: boolean
}>()
const emit = defineEmits<{ retry: []; clear: [] }>()
</script>

<template>
  <div class="rp-dtable" data-testid="dr-state" :data-state="state">
    <p v-if="state === 'loading'" class="dr-loading" role="status">
      {{ deletedText('states.loading') }}
    </p>
    <UiErrorState
      v-else-if="state === 'error' && error"
      :error="error"
      :title="deletedText('states.loadFailed')"
      retryable
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <UiEmptyState
      v-else-if="state === 'empty'"
      icon="trash"
      :title="deletedText('states.empty', { kind: deletedText(`kindNames.${kind}`) })"
    />
    <UiEmptyState
      v-else
      icon="search"
      :title="deletedText('states.filteredEmpty')"
      :text="hasMore ? deletedText('states.filteredEmptyMore') : undefined"
    >
      <template #action>
        <button
          type="button"
          class="t-btn t-btn--ghost t-btn--sm"
          data-testid="dr-clear"
          @click="emit('clear')"
        >
          {{ deletedText('filters.clear') }}
        </button>
      </template>
    </UiEmptyState>
  </div>
</template>
