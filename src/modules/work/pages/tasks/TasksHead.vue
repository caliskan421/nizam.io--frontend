<script setup lang="ts">
import './tasks.css'

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { TIMELINE_ROUTE } from '@/modules/timeline/public'
import { UiButton, UiIcon } from '@/shared/ui'

import { tasksText } from './messages'

/**
 * Sayfa başlığı (`rp-head`, E-03-03…06). Alt satır: görev sayısı sunucu sayacından (kesin,
 * BE-003); sayaç yokken yüklenen kümeden — imleç bitmediyse "‹n›+" ve "yüklenen kayıtlar
 * içinde" etiketi (E-03-04, P4, §10). Kişi sayısı yüklenen satırların tekil atananıdır (küme
 * tam değilse "‹n›+"). Görünüm seçicide
 * "Zaman çizelgesi" canlı (F3, E-03-05 / E-03C-03): `/zaman-cizelgesi`ye geçer; kapsam (program /
 * mercek / birim) korunur, liste süzgeçleri taşınmaz. "Yeni görev" yalnız
 * capability s.139 olgusuyla (yetkisizde gizli, P1). Veri yokken (yükleniyor / hata) `summary`
 * `null`: sayı yazılmaz ("0+ görev · 0 kişi" yanıltıcıydı — O5 görsel kusur, W63).
 */
const props = defineProps<{
  summary: {
    tasks: number
    tasksExact: boolean
    departments: number
    people: number
    peopleExact: boolean
  } | null
  canCreate: boolean
}>()
const emit = defineEmits<{ create: [] }>()
const router = useRouter()

const summaryText = computed(() => {
  const summary = props.summary
  if (summary === null) return null
  return [
    tasksText(summary.tasksExact ? 'tasksPage.summary.tasks' : 'tasksPage.summary.tasksPartial', {
      n: summary.tasks,
    }),
    tasksText('tasksPage.summary.departments', { n: summary.departments }),
    tasksText(
      summary.peopleExact ? 'tasksPage.summary.people' : 'tasksPage.summary.peoplePartial',
      {
        n: summary.people,
      },
    ),
  ].join(' · ')
})
/** Etiket yalnız görev sayısı kısmi kümedense (sayaç ucu yok/hatalı) gerekir. */
const partial = computed(() => props.summary !== null && !props.summary.tasksExact)
</script>

<template>
  <div class="rp-head">
    <div>
      <h1 class="rp-h1">{{ tasksText('tasksPage.title') }}</h1>
      <p v-if="summaryText !== null" class="rp-sub" data-testid="tasks-summary">
        {{ summaryText }}
        <span v-if="partial" class="tasks-partial">· {{ tasksText('tasksPage.partial') }}</span>
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
          data-testid="tasks-view-timeline"
          @click="router.push({ name: TIMELINE_ROUTE.name })"
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
