<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import {
  DURATION_MIN_W,
  durationLabel,
  GEOMETRY,
  planDays,
  roundedRectPath,
  TEXT_CHAR_PX,
  truncateLabel,
  type BarGeometry,
} from '../../model/timeline'
import type { GanttTask } from '../../model/types'
import type { GanttEdge, GanttScale } from '../index'
import { ganttText } from './messages'
import { statusTone } from './task-view'

/**
 * Tek görev çubuğu (E-03C-36…41, 43, 47): plan + taşma (iki parçalı dolgu, ayırıcı), gecikmede
 * kesik `--danger` kenar, kırpılmış çubukta düz sol köşe, seçili satırda halka + iki tutamaç,
 * çubuk metni + süre + bağımlılık simgesi. Süs katmanıdır (`aria-hidden`); anlam satırın
 * erişilebilir özetindedir. Tutamaç `pointerdown`'ı üst bileşene iletilir (sürükleme çekirdeği).
 */
const props = defineProps<{
  task: GanttTask
  bar: BarGeometry
  scale: GanttScale
  selected: boolean
  draggable: boolean
  dependent: boolean
}>()
const emit = defineEmits<{
  select: []
  handle: [event: PointerEvent, edge: GanttEdge, edgeX: number]
}>()

// Zincir simgesi (Gorevler-Zaman.dc.html): 24×24 kutuda çizilir, 12 px'e ölçeklenir.
const DEP_PATH =
  'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1'

const top = GEOMETRY.barTop
const lateKind = computed(() => props.bar.overflow === 'overdue')

const planPath = computed(() =>
  roundedRectPath(props.bar.x, top, props.bar.planW, GEOMETRY.barH, GEOMETRY.barR, {
    left: !props.bar.clipLeft,
    right: props.bar.overW === 0,
  }),
)
const overPath = computed(() =>
  roundedRectPath(props.bar.planRight, top, props.bar.overW, GEOMETRY.barH, GEOMETRY.barR, {
    left: false,
    right: true,
  }),
)
const outline = (grow: number) =>
  roundedRectPath(
    props.bar.x - grow,
    top - grow,
    props.bar.right - props.bar.x + grow * 2,
    GEOMETRY.barH + grow * 2,
    GEOMETRY.barR + grow,
    { left: !props.bar.clipLeft, right: true },
  )

const duration = computed(() => {
  const days = planDays(props.task)
  if (days === null || props.bar.planW < DURATION_MIN_W) return null
  const { value, unit } = durationLabel(days, props.scale)
  return `${value} ${ganttText(`timeline.gantt.unit.${unit}`)}`
})

const iconSize = GEOMETRY.depIcon
const textX = computed(
  () => props.bar.x + GEOMETRY.barPad + (props.dependent ? iconSize + GEOMETRY.barPad / 2 : 0),
)
const title = computed(() => {
  const durationW = duration.value ? duration.value.length * TEXT_CHAR_PX + GEOMETRY.barPad : 0
  const room = props.bar.x + props.bar.planW - GEOMETRY.barPad - durationW - textX.value
  return truncateLabel(props.task.title, room)
})

const handles = computed(() => [
  { edge: 'start' as const, x: props.bar.x },
  { edge: 'end' as const, x: props.bar.planRight },
])
const midY = top + GEOMETRY.barH / 2
</script>

<template>
  <g
    class="gantt-bar"
    :class="[`gantt-bar--${statusTone(task.status)}`, { 'is-selected': selected }]"
    :data-work-item="task.work_item_id"
    @click.stop="emit('select')"
  >
    <path class="gantt-bar__plan" :d="planPath" />
    <template v-if="bar.overW > 0">
      <path class="gantt-bar__over" :d="overPath" />
      <line
        class="gantt-bar__split"
        :x1="bar.planRight"
        :x2="bar.planRight"
        :y1="top - 1"
        :y2="top + GEOMETRY.barH + 1"
      />
    </template>
    <path v-if="lateKind" class="gantt-bar__late" :d="outline(0)" />
    <path v-if="selected" class="gantt-bar__ring" :d="outline(GEOMETRY.ringW / 2)" />
    <path
      v-if="dependent"
      class="gantt-bar__dep"
      :d="DEP_PATH"
      :transform="`translate(${bar.x + GEOMETRY.barPad} ${midY - iconSize / 2}) scale(${iconSize / 24})`"
    />
    <text v-if="title" class="gantt-bar__text" :x="textX" :y="midY">{{ title }}</text>
    <text v-if="duration" class="gantt-bar__dur" :x="bar.x + bar.planW - GEOMETRY.barPad" :y="midY">
      {{ duration }}
    </text>
    <template v-if="selected && draggable">
      <g v-for="h in handles" :key="h.edge" :data-handle="h.edge">
        <rect
          class="gantt-handle"
          :x="h.x - GEOMETRY.handleW / 2"
          :y="midY - GEOMETRY.handleH / 2"
          :width="GEOMETRY.handleW"
          :height="GEOMETRY.handleH"
          :rx="GEOMETRY.handleR"
        />
        <rect
          class="gantt-handle__hit"
          :x="h.x - GEOMETRY.hitW / 2"
          :y="top"
          :width="GEOMETRY.hitW"
          :height="GEOMETRY.barH"
          @pointerdown="emit('handle', $event, h.edge, h.x)"
          @click.stop
        />
      </g>
    </template>
  </g>
</template>
