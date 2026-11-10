<script setup lang="ts">
import './subtasks.css'

import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import type { SubtaskToggleEmits, SubtaskToggleProps } from './types'
import { subtaskText } from './messages'
import { useSubtaskSummary } from './use-subtask-summary'

/**
 * Satır başı alt görev aç/kapa düğmesi (E-03C-33; `aria-expanded`, `aria-label="<KOD> alt
 * görevlerini göster/gizle"`). Kapalıyken sayaç satırın `subtask_counts` alanındandır (BE-051;
 * alt görevi yoksa yalnız ok, görev başına okuma yok). Açılınca aynı okumadan "b/t" sayacı gelir
 * (okuma `SubtaskRows` ile ortak; ek istek yok). Düğme yalnız `toggle` yayar; açık küme üst bileşende.
 */
const props = defineProps<SubtaskToggleProps>()
const emit = defineEmits<SubtaskToggleEmits>()

const { counts: listed } = useSubtaskSummary(() => props)
/** Açıkken liste sayacı (canlı); kapalıyken satırın `subtask_counts`'ı, alt görevi yoksa yok. */
const counts = computed(() => {
  if (listed.value) return listed.value
  const row = props.rowCounts
  return row && row.total > 0 ? row : null
})
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
