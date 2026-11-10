<script setup lang="ts">
import './frame.css'

import { computed } from 'vue'

import { UiButton, UiSegmented, type UiChoiceOption } from '@/shared/ui'

import type { TimelineHeadEmits, TimelineHeadProps } from '../index'
import { frameText } from './messages'

/**
 * Sayfa başlığı (E-03C-02…04): "Görevler" + "N görev · N bitti · N gecikmede" (yüklü Gantt
 * yanıtından; sunucu kesilme başlığı (`X-Result-Truncated`, BE-019) bildirdiyse "N+" ve "yüklenen kayıtlar içinde"), görünüm segmenti ("Liste" ↔
 * "Zaman çizelgesi", iki rota arası geçiş — kapsam korunur, süzgeç taşınmaz) ve "Yeni görev"
 * (yalnız `canCreateTask`; üye yüzünde yok). `pending` (sözleşme dışı, isteğe bağlı): veri
 * yokken (yükleniyor / hata) sayaç satırı çizilmez — "0 görev" yanıltıcıdır (O5 dersi).
 */
const props = withDefaults(defineProps<TimelineHeadProps & { pending?: boolean }>(), {
  pending: false,
})
const emit = defineEmits<TimelineHeadEmits>()

type View = 'list' | 'timeline'
const view = computed<UiChoiceOption<View>[]>(() => [
  { value: 'list', label: frameText('timeline.frame.head.view.list'), icon: 'list' },
  { value: 'timeline', label: frameText('timeline.frame.head.view.timeline'), icon: 'gantt' },
])

function pick(next: View | null): void {
  if (next === 'list') emit('showList')
}

const parts = computed(() => {
  const partial = props.approximate
  return {
    tasks: frameText(partial ? 'timeline.frame.head.tasksPartial' : 'timeline.frame.head.tasks', {
      n: props.taskCount,
    }),
    done: frameText(partial ? 'timeline.frame.head.donePartial' : 'timeline.frame.head.done', {
      n: props.doneCount,
    }),
    overdue: frameText(
      partial ? 'timeline.frame.head.overduePartial' : 'timeline.frame.head.overdue',
      { n: props.overdueCount },
    ),
  }
})
</script>

<template>
  <div class="tl-head" data-testid="timeline-head">
    <div class="tl-head__text">
      <h1 class="tl-head__title">{{ frameText('timeline.frame.head.title') }}</h1>
      <p v-if="!pending" class="tl-head__sub" data-testid="timeline-summary">
        <span data-part="tasks">{{ parts.tasks }}</span> ·
        <span data-part="done">{{ parts.done }}</span> ·
        <span class="tl-head__danger" data-part="overdue">{{ parts.overdue }}</span>
        <span v-if="approximate" class="tl-head__partial" data-part="partial">
          · {{ frameText('timeline.frame.head.partial') }}
        </span>
      </p>
    </div>
    <div class="tl-head__actions">
      <UiSegmented
        :model-value="'timeline'"
        :options="view"
        :label="frameText('timeline.frame.head.view.label')"
        @update:model-value="pick"
      />
      <UiButton v-if="canCreateTask" variant="primary" icon="plus" @click="emit('newTask')">
        {{ frameText('timeline.frame.head.create') }}
      </UiButton>
    </div>
  </div>
</template>
