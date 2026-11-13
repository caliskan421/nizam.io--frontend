<script setup lang="ts">
import { injectWorkloadSelection, workloadText } from './use-workload-selection'

/**
 * Seçim çubuğu (E-13-61): "‹N› üye seçili · Seçimi temizle". Seçim yokken çizilmez. "Seçimi
 * temizle" düğmesi kalkacağından `cleared` yayılır; üst bileşen odağı "Tümünü seç" kutusuna
 * taşır (KESİN 27: odak gövdeye düşmez).
 */
const emit = defineEmits<{ cleared: [] }>()
const selection = injectWorkloadSelection()

function clear(): void {
  selection?.clear()
  emit('cleared')
}
</script>

<template>
  <div
    v-if="selection?.enabled.value && selection.count.value > 0"
    class="users-selbar"
    data-testid="users-selbar"
  >
    <span class="rp-cap" role="status" data-testid="users-selcount">
      {{ workloadText('selected', { n: selection.count.value }) }}
    </span>
    <button type="button" class="users-linkbtn" data-testid="users-selclear" @click="clear">
      {{ workloadText('clear') }}
    </button>
  </div>
</template>
