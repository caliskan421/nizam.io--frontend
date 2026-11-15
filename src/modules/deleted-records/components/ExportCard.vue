<script setup lang="ts">
import { computed } from 'vue'

import { i18n } from '@/shared/i18n'
import { UiIcon } from '@/shared/ui'
import type { ReportFailure } from '@/modules/reports/public'

import { deletedText } from '../model/messages'

/**
 * "CSV indir" durum kartı (E-12-05; ReportStateCard kalıbı, ortak kart başka modülün içidir):
 * hazırlanıyor (`role="status"`, İptal) ya da hata (`role="alert"`; Yeniden dene / Kapat). Metin
 * yalnız i18n'den (sunucu `message` gösterilmez): 422 `reporting.export_too_large` "süzgeci
 * daraltın"; akış ortasında kesilen bağlantı "dosya tamamlanamadı"; 429 `Retry-After` varsa süre.
 */
const props = defineProps<{ running: boolean; failure: ReportFailure | null }>()
const emit = defineEmits<{ cancel: []; retry: []; dismiss: [] }>()

const message = computed(() => {
  const failure = props.failure
  if (!failure) return ''
  if (failure.code === 'reporting.export_too_large') return deletedText('export.tooLarge')
  if (failure.kind === 'network') return deletedText('export.truncated')
  if (failure.kind === 'report_failed') return deletedText('export.failed')
  const text = i18n.global.t(failure.messageKey)
  return failure.retryAfter === null
    ? text
    : `${text} ${deletedText('export.retryIn', { n: failure.retryAfter })}`
})
</script>

<template>
  <div
    v-if="running"
    class="dr-notice"
    role="status"
    aria-busy="true"
    data-testid="dr-export-card"
    data-state="running"
  >
    <UiIcon name="clock" size="sm" />
    <p class="dr-notice__text">{{ deletedText('export.preparing') }}</p>
    <button
      type="button"
      class="t-btn t-btn--ghost t-btn--sm"
      data-testid="dr-export-cancel"
      @click="emit('cancel')"
    >
      {{ deletedText('export.cancel') }}
    </button>
  </div>
  <div
    v-else-if="failure"
    class="dr-notice"
    role="alert"
    data-testid="dr-export-card"
    data-state="failed"
    :data-code="failure.code"
  >
    <UiIcon name="alert" size="sm" />
    <p class="dr-notice__text">{{ message }}</p>
    <button
      type="button"
      class="t-btn t-btn--secondary t-btn--sm"
      data-testid="dr-export-retry"
      @click="emit('retry')"
    >
      {{ deletedText('export.retry') }}
    </button>
    <button
      type="button"
      class="t-btn t-btn--ghost t-btn--sm"
      data-testid="dr-export-dismiss"
      @click="emit('dismiss')"
    >
      {{ deletedText('batch.dismiss') }}
    </button>
  </div>
</template>
