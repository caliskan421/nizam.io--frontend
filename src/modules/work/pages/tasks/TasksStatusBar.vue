<script setup lang="ts">
import './tasks.css'

import { computed } from 'vue'

import { UiSegmented, type UiChoiceOption } from '@/shared/ui'

import { tasksText } from './messages'
import type { TaskTab } from './url-state'

/**
 * Durum sekmeleri satırı (E-03-07…09). Tümü + 5 durum (P5, `iade_edildi` = "Geri gönderildi")
 * + "Geciken" (`is_overdue`, durumla kesişir); sayaçlar yüklenen kümeden (BE-003), imleç
 * bitmediyse "yüklenen kayıtlar içinde" etiketi (§10). Tarih talebi süzgeci sekmeyle VE'dir;
 * talep verisi olmayanlarda (üye; WORK-K82) gizli.
 */
const props = defineProps<{
  tab: TaskTab
  counts: Readonly<Record<TaskTab, number>>
  requests: boolean
  requestCount: number
  showRequests: boolean
  complete: boolean
}>()
const emit = defineEmits<{ 'update:tab': [tab: TaskTab]; 'update:requests': [on: boolean] }>()

const ORDER: readonly TaskTab[] = [
  'tumu',
  'baslanmadi',
  'devam_ediyor',
  'geciken',
  'onaya_sunuldu',
  'iade_edildi',
  'tamamlandi',
]

const tabOptions = computed<UiChoiceOption<TaskTab>[]>(() =>
  ORDER.map((value) => ({
    value,
    label: tasksText(`tasksPage.tabs.${value}`),
    count: props.counts[value],
  })),
)
const requestOptions = computed<UiChoiceOption<'talep'>[]>(() => [
  { value: 'talep', label: tasksText('tasksPage.requests.filter'), count: props.requestCount },
])

const tabModel = computed({
  get: () => props.tab,
  set: (value: TaskTab | null) => emit('update:tab', value ?? 'tumu'),
})
const requestModel = computed({
  get: () => (props.requests ? 'talep' : null),
  set: (value: 'talep' | null) => emit('update:requests', value === 'talep'),
})
</script>

<template>
  <div class="rp-toolbar">
    <div class="rp-tgroup tasks-tabs">
      <UiSegmented
        v-model="tabModel"
        :options="tabOptions"
        :label="tasksText('tasksPage.tabs.label')"
      />
    </div>
    <div v-if="showRequests" class="rp-tgroup">
      <UiSegmented
        v-model="requestModel"
        :options="requestOptions"
        :label="tasksText('tasksPage.requests.filterLabel')"
        allow-empty
      />
    </div>
    <span v-if="!complete" class="rp-cap" data-testid="tabs-partial">
      {{ tasksText('tasksPage.partial') }}
    </span>
  </div>
</template>
