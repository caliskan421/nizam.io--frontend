<script setup lang="ts">
import './reports.css'

import { computed } from 'vue'

import { DesignStub, UiIcon, type IconName } from '@/shared/ui'
import { t } from './text'

/**
 * Ortak dışa aktarım durum kartı (01h; E-13-68…72): dört rapor düğmesinde (06 PDF, 09b/K7, 03/K3,
 * 05) AYNI bileşen. Ton: `progress` (hazırlanıyor; `role="status"`, `aria-busy`), `warn` (429/503:
 * `role="alert"`), `error` (diğer hatalar), `success` (indirildi). Metin yalnız i18n'den (sunucu
 * `message` gösterilmez); `status`+`code` yalnız 429/503 kartında kod satırı olarak çizilir.
 * Belirsiz ilerleme şeridi ve "ilerleme yakında" rozeti statiktir (`designStub('BE-131')`, E-13-68).
 */
const props = defineProps<{
  tone: 'progress' | 'warn' | 'error' | 'success'
  title?: string
  body?: string
  /** `429`/`503`; `code` ile birlikte kod satırı üretir. */
  status?: number
  code?: string
  note?: string
}>()

const ICONS: Record<typeof props.tone, IconName> = {
  progress: 'clock',
  warn: 'alert',
  error: 'alert',
  success: 'check',
}
const role = computed(() => (props.tone === 'warn' || props.tone === 'error' ? 'alert' : 'status'))
const codeLine = computed(() =>
  props.status !== undefined && props.code
    ? t('reports.states.codeLine', { status: props.status, code: props.code })
    : '',
)
</script>

<template>
  <div
    class="report-card"
    :class="`report-card--${tone}`"
    :role="role"
    :aria-label="title"
    :aria-busy="tone === 'progress' ? 'true' : undefined"
    data-testid="report-card"
  >
    <span class="report-card__icon" aria-hidden="true"
      ><UiIcon :name="ICONS[tone]" size="sm"
    /></span>
    <div class="report-card__text">
      <h3 v-if="title" class="report-card__title">{{ title }}</h3>
      <p v-if="body" class="report-card__body">{{ body }}</p>
      <p v-if="codeLine" class="report-card__code">{{ codeLine }}</p>
      <p v-if="note" class="report-card__note">{{ note }}</p>
    </div>
    <div v-if="tone === 'progress'" class="report-card__progress">
      <span
        class="report-card__bar"
        role="progressbar"
        :aria-label="t('reports.status.preparing.progressLabel')"
      />
      <DesignStub id="BE-131">
        <span class="report-soon">{{ t('reports.states.progressStub') }}</span>
      </DesignStub>
    </div>
  </div>
</template>
