<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import { dayDiff } from '../../model/dates'
import type { GroupRow } from '../../model/rows'
import { DAY_WIDTH, GEOMETRY } from '../../model/timeline'
import type { GanttDayRange, GanttScale } from '../index'

/**
 * Grup izi (E-03C-29, geçici kabul): grubun görev aralığını özet çubuk olarak çizer — bitti
 * oranı kadar dolu, gruptan gecikme varsa aralık sonundan bugüne `--gp-late` uzantı. Veri
 * yüklü görevlerden hesaplanır (yaklaşık; 200 tavanı), uydurma değer yoktur.
 */
const props = defineProps<{
  row: GroupRow
  scale: GanttScale
  range: GanttDayRange
  today: string
}>()

const trace = computed(() => {
  const span = props.row.span
  if (!span) return null
  const dayW = DAY_WIDTH[props.scale]
  const first = dayDiff(props.range.start, span.start)
  const last = dayDiff(props.range.start, span.end)
  if (first === null || last === null) return null
  const x = Math.max(first, 0) * dayW
  const right = (last + 1) * dayW
  if (right <= x) return null
  const width = right - x
  const ratio = props.row.total > 0 ? props.row.done / props.row.total : 0
  const todayRight = props.row.hasOverdue
    ? ((dayDiff(props.range.start, props.today) ?? -1) + 1) * dayW
    : 0
  return {
    x,
    width,
    doneW: width * ratio,
    lateX: right,
    lateW: todayRight > right ? todayRight - right : 0,
    y: (props.row.height - GEOMETRY.summaryH) / 2,
  }
})
</script>

<template>
  <g v-if="trace" class="gantt-trace" :data-group="row.departmentId">
    <rect
      class="gantt-trace__track"
      :x="trace.x"
      :y="trace.y"
      :width="trace.width"
      :height="GEOMETRY.summaryH"
      :rx="GEOMETRY.summaryH / 2"
    />
    <rect
      v-if="trace.doneW > 0"
      class="gantt-trace__done"
      :x="trace.x"
      :y="trace.y"
      :width="trace.doneW"
      :height="GEOMETRY.summaryH"
      :rx="GEOMETRY.summaryH / 2"
    />
    <rect
      v-if="trace.lateW > 0"
      class="gantt-trace__late"
      :x="trace.lateX"
      :y="trace.y"
      :width="trace.lateW"
      :height="GEOMETRY.summaryH"
      :rx="GEOMETRY.summaryH / 2"
    />
  </g>
</template>
