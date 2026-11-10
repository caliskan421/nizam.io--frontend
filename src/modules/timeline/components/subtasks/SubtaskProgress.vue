<script setup lang="ts">
import './subtasks.css'

import type { SubtaskRowsProps } from '../index'
import { subtaskText } from './messages'
import { useSubtaskSummary } from './use-subtask-summary'

/**
 * Çubuk dibi alt görev ilerleme çizgisi (E-03C-44): biten/toplam oranı. YALNIZ açılmış satırda
 * çizilir (sayı `subtask_counts`'tan, liste yüklenince canlı listeden); kapalı satırda DOM'da yoktur.
 * Genişlik `<progress>` ile (satır içi stil yok — CSP). Üst çubuk `position: relative`.
 */
const props = defineProps<SubtaskRowsProps>()

const { counts } = useSubtaskSummary(() => props)
</script>

<template>
  <progress
    v-if="counts && counts.total > 0"
    class="tl-subprog"
    :value="counts.done"
    :max="counts.total"
    :aria-label="subtaskText('progress')"
    data-testid="subtask-progress"
  />
</template>
