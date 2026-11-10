<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import type { GanttLayout, RowWindow } from '../../model/rows'
import { axisModel } from '../../model/timeline'
import type { GanttDayRange, GanttScale } from '../index'

/**
 * Izgara katmanı (E-03C-26) ve bugün çizgisi (E-03C-27): haftalık dikey çizgiler, gün
 * ölçeğinde hafta sonu gölgesi, satır ayırıcıları, grup satırı zemini ve bugünün tüm satırları
 * kesen çizgisi. `layer`: `grid` çubukların ALTINDA, `today` ÜSTÜNDE çizilir; ikisi de
 * işaretçiyi geçirir (tıklama çubuk katmanına gider).
 */
const props = defineProps<{
  layer: 'grid' | 'today'
  scale: GanttScale
  range: GanttDayRange
  today: string
  layout: GanttLayout
  window: RowWindow
}>()

const axis = computed(() => axisModel(props.scale, props.range, props.today))
const rows = computed(() => props.layout.rows.slice(props.window.first, props.window.last + 1))
</script>

<template>
  <svg
    class="gantt__layer gantt__layer--static"
    :class="`gantt__layer--${layer}`"
    :width="axis.width"
    :height="layout.height"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="layer === 'grid'">
      <template v-for="row in rows" :key="row.key">
        <rect
          v-if="row.kind === 'group'"
          class="gantt-grid__group"
          x="0"
          :y="row.y"
          :width="axis.width"
          :height="row.height"
        />
      </template>
      <rect
        v-for="band in axis.weekends"
        :key="band.x"
        class="gantt-grid__weekend"
        :x="band.x"
        y="0"
        :width="band.width"
        :height="layout.height"
      />
      <line
        v-for="x in axis.lines"
        :key="x"
        class="gantt-grid__line"
        :x1="x"
        :x2="x"
        y1="0"
        :y2="layout.height"
      />
      <line
        v-for="row in rows"
        :key="`s:${row.key}`"
        class="gantt-grid__line"
        x1="0"
        :x2="axis.width"
        :y1="row.y + row.height"
        :y2="row.y + row.height"
      />
    </template>
    <line
      v-else-if="axis.todayX !== null"
      class="gantt-grid__today"
      data-gantt="today-line"
      :x1="axis.todayX"
      :x2="axis.todayX"
      y1="0"
      :y2="layout.height"
    />
  </svg>
</template>
