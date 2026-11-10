<script setup lang="ts">
import { computed } from 'vue'

import type { WorkItem } from '@/modules/work/public'
import { UiButton } from '@/shared/ui'

import type { GanttTask } from '../../model/types'
import { formatInputDay } from './date-input'
import { panelText, statusText } from './messages'

/**
 * E-03C-42, 60…62 — durum, gecikme (gecikmiyorsa satır çizilmez), kanıt dosyası sayısı (403/okunamadı
 * → "—") ve YALNIZ seçili görevde bekleyen tarih talebi uzantısı (kesik çerçeve; Admin için
 * "Onayla"/"Reddet").
 */
const props = defineProps<{
  task: GanttTask
  item: WorkItem | null
  files: number | null
  seePending: boolean
  canReview: boolean
  busy: boolean
}>()
const emit = defineEmits<{ decide: [decision: 'approved' | 'rejected'] }>()

const status = computed(() => props.item?.status ?? props.task.status)
const dot = computed(() => (statusText(status.value) ? status.value : 'baslanmadi'))
const overdueDays = computed(() =>
  props.task.lateness.is_overdue ? props.task.lateness.days_overdue : 0,
)
const pending = computed(() =>
  props.seePending ? (props.item?.pending_date_request ?? null) : null,
)
const range = computed(() =>
  pending.value
    ? panelText('pending.range', {
        start: formatInputDay(pending.value.new_start_on),
        end: formatInputDay(pending.value.new_end_on),
      })
    : '',
)
</script>

<template>
  <dl class="tp-dl">
    <dt>{{ panelText('status') }}</dt>
    <dd>
      <span v-if="statusText(status)" class="tp-status" data-testid="tp-status">
        <span class="tp-dot" :class="`tp-dot--${dot}`" aria-hidden="true" />
        {{ statusText(status) }}
      </span>
      <span v-else>—</span>
    </dd>
    <template v-if="overdueDays > 0">
      <dt>{{ panelText('overdue') }}</dt>
      <dd class="tp-danger" data-testid="tp-overdue">
        {{ panelText('overdueDays', { n: overdueDays }) }}
      </dd>
    </template>
    <dt>{{ panelText('evidence') }}</dt>
    <dd data-testid="tp-files">
      {{ files === null ? panelText('evidenceUnknown') : panelText('evidenceCount', { n: files }) }}
    </dd>
  </dl>
  <div v-if="pending" class="tp-pending" data-testid="tp-pending">
    <p class="tp-kicker">{{ panelText('pending.title') }}</p>
    <p class="tp-pending__range">{{ range }}</p>
    <div v-if="canReview" class="tp-pending__actions">
      <UiButton
        size="sm"
        variant="primary"
        :disabled="busy"
        data-testid="tp-approve"
        @click="emit('decide', 'approved')"
      >
        {{ panelText('actions.approve') }}
      </UiButton>
      <UiButton
        size="sm"
        :disabled="busy"
        data-testid="tp-reject"
        @click="emit('decide', 'rejected')"
      >
        {{ panelText('actions.reject') }}
      </UiButton>
    </div>
  </div>
</template>
