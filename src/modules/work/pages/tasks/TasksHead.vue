<script setup lang="ts">
import './tasks.css'

import { computed } from 'vue'

import { UiButton, UiIcon } from '@/shared/ui'

import { tasksText } from './messages'

/**
 * Sayfa başlığı (`rp-head`, E-03-03…06). Alt satır yüklenen kümeden; imleç bitmediyse görev
 * sayısı "‹n›+" ve "yüklenen kayıtlar içinde" etiketi (E-03-04, P4, §10). Görünüm seçicide
 * "Zaman çizelgesi" F3'e kadar devre dışı + faz notu (§5; stub yok). "Yeni görev" yalnız
 * capability s.139 olgusuyla (yetkisizde gizli, P1). Veri yokken (yükleniyor / hata) `summary`
 * `null`: sayı yazılmaz ("0+ görev · 0 kişi" yanıltıcıydı — O5 görsel kusur, W63).
 */
const props = defineProps<{
  summary: { tasks: number; departments: number; people: number } | null
  complete: boolean
  canCreate: boolean
}>()
const emit = defineEmits<{ create: [] }>()

const summaryText = computed(() => {
  const summary = props.summary
  if (summary === null) return null
  return [
    tasksText(props.complete ? 'tasksPage.summary.tasks' : 'tasksPage.summary.tasksPartial', {
      n: summary.tasks,
    }),
    tasksText('tasksPage.summary.departments', { n: summary.departments }),
    tasksText('tasksPage.summary.people', { n: summary.people }),
  ].join(' · ')
})
</script>

<template>
  <div class="rp-head">
    <div>
      <h1 class="rp-h1">{{ tasksText('tasksPage.title') }}</h1>
      <p v-if="summaryText !== null" class="rp-sub" data-testid="tasks-summary">
        {{ summaryText }}
        <span v-if="!complete" class="tasks-partial">· {{ tasksText('tasksPage.partial') }}</span>
      </p>
    </div>
    <div class="rp-actions">
      <div class="rp-seg" role="group" :aria-label="tasksText('tasksPage.view.label')">
        <button type="button" aria-pressed="true">
          <UiIcon name="list" size="sm" />{{ tasksText('tasksPage.view.list') }}
        </button>
        <button
          type="button"
          aria-pressed="false"
          disabled
          data-phase="F3"
          :title="tasksText('tasksPage.view.timelineSoon')"
        >
          <UiIcon name="gantt" size="sm" />{{ tasksText('tasksPage.view.timeline') }}
        </button>
      </div>
      <UiButton v-if="canCreate" variant="primary" icon="plus" @click="emit('create')">
        {{ tasksText('tasksPage.create') }}
      </UiButton>
    </div>
  </div>
</template>
