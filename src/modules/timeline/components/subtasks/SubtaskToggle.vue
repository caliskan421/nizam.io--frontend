<script setup lang="ts">
import './subtasks.css'

import { UiIcon } from '@/shared/ui'

import type { SubtaskToggleEmits, SubtaskToggleProps } from './types'
import { subtaskText } from './messages'
import { useSubtaskSummary } from './use-subtask-summary'

/**
 * Satır başı alt görev aç/kapa düğmesi (E-03C-33; `aria-expanded`, `aria-label="<KOD> alt
 * görevlerini göster/gizle"`). Kapalıyken yalnız ok: sayaç yoktur (Gantt satırında alt görev
 * sayacı yok — BE-020, fan-out yok). Açılınca aynı okumadan "b/t" sayacı gelir (okuma
 * `SubtaskRows` ile ortak; ek istek yok). Düğme yalnız `toggle` yayar; açık küme üst bileşende.
 */
const props = defineProps<SubtaskToggleProps>()
const emit = defineEmits<SubtaskToggleEmits>()

const { counts } = useSubtaskSummary(() => props)
</script>

<template>
  <button
    type="button"
    class="tl-subtog"
    :aria-expanded="open ? 'true' : 'false'"
    :aria-label="subtaskText(open ? 'hide' : 'show', { label })"
    data-testid="subtask-toggle"
    @click="emit('toggle')"
  >
    <UiIcon name="chevron-right" size="sm" />
    <span v-if="counts" class="tl-subtog__n" data-testid="subtask-toggle-count">
      {{ subtaskText('count', counts) }}
    </span>
  </button>
</template>
