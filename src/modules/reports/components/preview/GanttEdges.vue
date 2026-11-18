<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import { edgeRoute, type GanttEdgeLayout } from '../../model/gantt-edges'

/**
 * Gantt bağımlılık okları (E-13-28; REPORTING-K22): `gantt_edges`'ten ÖN GÖREV → BAĞIMLI. Çizim
 * salt görseldir (`aria-hidden`); erişilebilir karşılığı görev adı çiftlerinin metin listesidir
 * (`SeasonGantt`). Konum eksen yüzdesi ve sabit satır yüksekliğinin katıdır (`--rp-gantt-row`);
 * ölçüm ya da gözlemci gerekmez. Geometri `model/gantt-edges.ts` içinde açıklanmıştır.
 */
const props = defineProps<{ layout: GanttEdgeLayout }>()
const routes = computed(() =>
  props.layout.edges.map((edge) => ({ key: edge.key, ...edgeRoute(edge) })),
)
</script>

<template>
  <div
    v-if="routes.length > 0"
    class="report-gantt__edges"
    aria-hidden="true"
    data-testid="gantt-edges"
    :style="{ '--rows': layout.rowCount }"
  >
    <span
      v-for="route in routes"
      :key="route.key"
      class="report-gantt__edge"
      data-testid="gantt-edge"
    >
      <i
        class="report-gantt__origin"
        data-testid="gantt-edge-origin"
        :style="{ '--x': route.origin.x, '--row': route.origin.row }"
      />
      <i
        class="report-gantt__seg report-gantt__seg--h"
        :style="{
          '--x': route.horizontal.x,
          '--w': route.horizontal.w,
          '--row': route.horizontal.row,
        }"
      />
      <i
        class="report-gantt__seg report-gantt__seg--v"
        :style="{
          '--x': route.vertical.x,
          '--row': route.vertical.row,
          '--span': route.vertical.rows,
        }"
      />
      <i
        class="report-gantt__tip"
        :class="`report-gantt__tip--${route.tip.dir}`"
        :style="{ '--x': route.tip.x, '--row': route.tip.row }"
      />
    </span>
  </div>
</template>
