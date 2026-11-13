<script setup lang="ts">
import './preview.css'

export interface PaperKpi {
  label: string
  value: string
  sub?: string
  tone?: 'ok' | 'danger' | 'gold'
}

/** KPI kartları (sol ton çubuğu). Değeri olmayan öğe çağıranda süzülür (sahte değer yok, §4). */
defineProps<{ items: readonly PaperKpi[]; label: string; five?: boolean }>()
</script>

<template>
  <div class="report-kpis" :class="{ 'report-kpis--5': five }" role="group" :aria-label="label">
    <div
      v-for="item in items"
      :key="item.label"
      class="report-kpi"
      :class="item.tone ? `report-tone-${item.tone}` : undefined"
    >
      <span class="report-kpi__label">{{ item.label }}</span>
      <span class="report-kpi__value">{{ item.value }}</span>
      <span v-if="item.sub" class="report-kpi__sub">{{ item.sub }}</span>
    </div>
  </div>
</template>
