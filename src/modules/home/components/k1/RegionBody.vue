<script setup lang="ts">
import type { ApiError } from '@/shared/errors/api-error'
import { UiErrorState } from '@/shared/ui'

import { homeText } from '../../model/messages'

/**
 * Bölge gövdesi (mekanizma §9.4): her bölge bağımsız yüklenir — yükleniyor → iskelet; hata →
 * bölge içi hata + "Yeniden dene" (sayfa düşmez); boş → nötr metin (sahte satır yok, §4).
 */
withDefaults(
  defineProps<{
    loading?: boolean
    error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
    retrying?: boolean
    /** Dolu değilse bölge boştur: nötr metin. */
    empty?: string | null
    rows?: number
  }>(),
  { loading: false, error: null, retrying: false, empty: null, rows: 3 },
)
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <UiErrorState
    v-if="error"
    :error="error"
    :title="homeText('home.k1.common.loadFailed')"
    retryable
    :retrying="retrying"
    @retry="emit('retry')"
  />
  <div v-else-if="loading" aria-busy="true" data-skeleton>
    <span v-for="n in rows" :key="n" class="rh-skel" />
  </div>
  <p v-else-if="empty !== null" class="rh-region-empty" data-empty>{{ empty }}</p>
  <slot v-else />
</template>
