<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import type { GanttLayout, GanttRow, RowWindow } from '../../model/rows'
import { barGeometry, rangeWidth, type BarDates } from '../../model/timeline'
import type { GanttTask } from '../../model/types'
import type { GanttBarsEmits, GanttBarsProps, GanttEdge } from '../index'
import GanttBar from './GanttBar.vue'
import GanttGroupTrace from './GanttGroupTrace.vue'
import { useGanttHover } from './gantt-context'
import { useBarDrag } from './use-bar-drag'

/**
 * Çubuk katmanı (E-03C-29, 35, 36…41, 43, 47): görünür satır penceresindeki görev çubukları,
 * grup izleri ve satır arka planları (hover + seçili). Seçili satırda tutamaçlar çizilir ve
 * `edge-drag` yayılır; politika (talep / doğrudan yazma / gecikme) W95'tedir. Çizim kendi SVG'dir.
 * `layout` / `window` GanttView'dan gelir (grup açık/kapalı durumu ve dikey pencere orada).
 */
const props = defineProps<
  GanttBarsProps & {
    layout: GanttLayout
    window: RowWindow
    /** Alt görev satırları açık görevler (03d). */
    openSubtasks?: ReadonlySet<string>
  }
>()
const emit = defineEmits<GanttBarsEmits>()

const hover = useGanttHover()
const drag = useBarDrag({
  range: () => props.range,
  scale: () => props.scale,
  emit: (event) => emit('edge-drag', event),
})

const width = computed(() => rangeWidth(props.range, props.scale))
const rows = computed(() => props.layout.rows.slice(props.window.first, props.window.last + 1))

/** Sürükleme önizlemesi: tutulan uç anlık güne taşınır (yazma yok, yalnız çizim). */
function datesOf(task: GanttTask): BarDates {
  const preview = drag.preview.value
  if (preview?.workItemId !== task.work_item_id) return task
  return preview.edge === 'start'
    ? { ...task, start_on: preview.day }
    : {
        ...task,
        planned_end_on: preview.day,
        end_on: task.end_on < preview.day ? preview.day : task.end_on,
      }
}

function geometry(task: GanttTask) {
  return barGeometry(datesOf(task), { range: props.range, scale: props.scale, today: props.today })
}

function startDrag(event: PointerEvent, task: GanttTask, edge: GanttEdge, edgeX: number) {
  if (props.draggableIds.has(task.work_item_id)) drag.begin(event, task, edge, edgeX)
}

function onBackground(row: GanttRow): void {
  if (row.kind === 'task') emit('select', row.task.work_item_id)
}
</script>

<template>
  <svg
    class="gantt__layer gantt__layer--bars"
    :width="width"
    :height="layout.height"
    aria-hidden="true"
    focusable="false"
  >
    <g
      v-for="row in rows"
      :key="row.key"
      :transform="`translate(0 ${row.y})`"
      :data-row="row.key"
      @pointerenter="hover = row.key"
      @pointerleave="hover = null"
    >
      <rect
        class="gantt-bg"
        :class="{
          'is-hover': hover === row.key,
          'is-selected': row.kind === 'task' && row.key === selectedId,
        }"
        :width="width"
        :height="row.height"
        @click="onBackground(row)"
      />
      <GanttGroupTrace
        v-if="row.kind === 'group'"
        :row="row"
        :scale="scale"
        :range="range"
        :today="today"
      />
      <GanttBar
        v-else-if="geometry(row.task)"
        :task="row.task"
        :bar="geometry(row.task)!"
        :scale="scale"
        :selected="row.key === selectedId"
        :draggable="draggableIds.has(row.key)"
        :dependent="layout.dependentIds.has(row.key)"
        :subtasks-open="openSubtasks?.has(row.key) === true"
        @select="emit('select', row.task.work_item_id)"
        @handle="(e, edge, x) => startDrag(e, row.task, edge, x)"
      />
    </g>
  </svg>
</template>
