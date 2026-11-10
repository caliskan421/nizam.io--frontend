<script setup lang="ts">
import './subtasks.css'

import { UiIcon } from '@/shared/ui'

import type { SubtaskRowsProps } from '../index'
import { subtaskText } from './messages'
import { useSubtaskSummary } from './use-subtask-summary'

/**
 * Çubuğun yanındaki "b/t" sayaç çipi (E-03C-46). YALNIZ açılmış satırda; sayı satırın `subtask_counts`'ından (BE-051), liste
 * yüklenince canlı listeden; hepsi bittiyse ✓ vurgusu. Konumu üst (çubuk satırı) belirler.
 */
const props = defineProps<SubtaskRowsProps>()

const { counts } = useSubtaskSummary(() => props)
</script>

<template>
  <span
    v-if="counts && counts.total > 0"
    class="tl-subchip"
    :class="{ 'tl-subchip--all': counts.done === counts.total }"
    role="img"
    :aria-label="subtaskText('countLabel', counts)"
    data-testid="subtask-chip"
  >
    <UiIcon v-if="counts.done === counts.total" name="check" size="sm" bold />
    {{ subtaskText('count', counts) }}
  </span>
</template>
