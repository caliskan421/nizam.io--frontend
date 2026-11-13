<script setup lang="ts">
import './reports.css'

import { computed, ref, watch } from 'vue'

import { UiButton } from '@/shared/ui'

import { useReportDownloads } from '../api/downloads'
import {
  canStart,
  reportActionState,
  showsRetry,
  type ReportActionPhase,
} from '../model/action-state'
import type { ReportFailure, ReportKind } from '../model/types'
import ReportStateCard from './ReportStateCard.vue'
import { t } from './text'

/**
 * Rapor düğmesi (13 `mekanizma.md` §3.1; dört yerde aynı bileşen): `kind` PDF türü
 * (`season | workload | meeting | task`), `targetId` toplantı/görev kimliği, `memberIds` iş yükü
 * seçimi (boş = bütün üyeler), `disabledReason` BE kaynaklı eksikte devre dışı gerekçesi (metin).
 * Durum makinesi `model/action-state.ts`; bu sekmedeki bütün rapor düğmeleri tek `reportGate`
 * altındadır (biri hazırlanırken diğerleri kilitli). Olaylar: `done(dosyaAdı)` indirme
 * kaydedildi, `failed(kod)` sınıflandırılmış hata (iptal/kilit olay üretmez). Etiket varsayılandır;
 * ekran kendi etiketini yuvayla verebilir. Yetki kararı çağıranındır (`model/capabilities.ts`).
 * Durum kartları ortak `ReportStateCard`'dır (01h; W138). `trailing` yuvası düğmeye bitişik ek
 * denetimdir ("Bölüm seç…"); `start()` dışarıya açılır (bölüm penceresinin "Seçilenleri indir"i
 * AYNI düğme durumunda çalışsın diye; ek yüzey, prop/emit sözleşmesi değişmez).
 */
const props = defineProps<{
  kind: ReportKind
  targetId?: string
  memberIds?: readonly string[]
  disabledReason?: string
  /** Görünüm (W138 eki): önizleme araç çubukları birincil + küçük düğme ister. */
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
}>()
const emit = defineEmits<{
  done: [fileName: string]
  failed: [code: string]
}>()

const downloads = useReportDownloads()
const phase = ref<ReportActionPhase>('idle')
const failure = ref<ReportFailure | null>(null)
const fileName = ref('')

const state = computed(() =>
  reportActionState({
    disabled: props.disabledReason !== undefined,
    pending: downloads.isPending.value,
    gateBusy: downloads.busy.value,
    cooldown: downloads.cooldown.value,
    phase: phase.value,
  }),
)

const reportLabel = computed(() => t(`reports.action.label.${props.kind}`))
const label = computed(() => {
  switch (state.value) {
    case 'preparing':
      return t('reports.action.preparing')
    case 'cooldown':
      return t('reports.action.cooldown', { seconds: downloads.cooldown.value })
    case 'failed':
      return showsRetry(failure.value) ? t('reports.action.retry') : reportLabel.value
    default:
      return props.kind === 'workload' && (props.memberIds?.length ?? 0) > 0
        ? t('reports.action.workloadSelected', { n: props.memberIds?.length ?? 0 })
        : reportLabel.value
  }
})
const failureText = computed(() => (failure.value ? t(failure.value.messageKey) : ''))
// 429/503 kartı başlığı ve kod satırı (01h); diğer hatalar yalnız metin gösterir.
const FAILURE_STATUS: Partial<Record<ReportFailure['kind'], number>> = {
  export_in_progress: 429,
  capacity_full: 503,
}
const failureTitle = computed(() => {
  const kind = failure.value?.kind
  return kind === 'export_in_progress' || kind === 'capacity_full'
    ? t(`reports.status.${kind}.title`)
    : undefined
})
const failureStatus = computed(() =>
  failure.value ? FAILURE_STATUS[failure.value.kind] : undefined,
)

// Başka kayda/seçime geçilince önceki sonuç gösterilmez.
watch(
  () => [props.kind, props.targetId, props.memberIds],
  () => {
    if (!downloads.isPending.value) {
      phase.value = 'idle'
      failure.value = null
    }
  },
)

async function start(): Promise<void> {
  if (!canStart(state.value)) return
  phase.value = 'idle'
  failure.value = null
  const result = await downloads.run({
    kind: props.kind,
    targetId: props.targetId,
    memberIds: props.memberIds,
  })
  if (result.kind === 'saved') {
    phase.value = 'downloaded'
    fileName.value = result.fileName
    emit('done', result.fileName)
  } else if (result.kind === 'failed') {
    phase.value = 'failed'
    failure.value = result.failure
    emit('failed', result.failure.code)
  }
}
defineExpose({ start })
</script>

<template>
  <div class="report-action" :data-state="state">
    <div class="report-action__row">
      <UiButton
        icon="download"
        :variant="props.variant"
        :size="props.size"
        :disabled="!canStart(state)"
        :title="props.disabledReason"
        :aria-busy="state === 'preparing' ? 'true' : undefined"
        @click="start"
      >
        <slot v-if="state === 'ready' || state === 'downloaded'">{{ label }}</slot>
        <template v-else>{{ label }}</template>
      </UiButton>
      <UiButton v-if="state === 'preparing'" variant="ghost" size="sm" @click="downloads.cancel()">
        {{ t('reports.action.cancel') }}
      </UiButton>
      <slot name="trailing" />
    </div>
    <ReportStateCard
      v-if="state === 'preparing'"
      tone="progress"
      :title="t('reports.status.preparing.title')"
      :body="t('reports.status.preparing.body', { report: reportLabel })"
    />
    <p v-else-if="state === 'locked'" class="report-action__note" role="status">
      {{ t('reports.action.locked') }}
    </p>
    <ReportStateCard
      v-else-if="state === 'downloaded'"
      tone="success"
      :body="t('reports.action.downloaded', { name: fileName })"
      :note="t('reports.states.auditNote')"
    />
    <ReportStateCard
      v-else-if="state === 'failed' || (state === 'cooldown' && failure)"
      :tone="failureStatus === undefined ? 'error' : 'warn'"
      :title="failureTitle"
      :body="failureText"
      :status="failureStatus"
      :code="failure?.code"
    />
  </div>
</template>
