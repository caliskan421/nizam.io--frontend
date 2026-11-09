<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import { axisModel, GEOMETRY, TEXT_CHAR_PX, type AxisCell } from '../../model/timeline'
import type { GanttAxisProps } from '../index'
import { ganttText, monthName } from './messages'

/**
 * Zaman ekseni başlığı (E-03C-23…25, 27): ay satırı + hafta/gün satırı; ay ölçeğinde yıl + ay.
 * Hafta ölçeğinde Pazartesi gün numarası (bugünün haftası vurgulu), gün ölçeğinde haftalık
 * `<gün> <Aaa>` etiketi. "bugün" hapı üst satırda bugünün sütunundadır. Tamamı süstür
 * (`aria-hidden`): görev tarihleri satırların erişilebilir özetinde.
 */
const props = defineProps<GanttAxisProps>()

const axis = computed(() => axisModel(props.scale, props.range, props.today))

/** En az üç karakterin sığdığı hücre etiketlenir; aralık kenarındaki kırpık parça boş kalır. */
const MIN_LABEL_W = 3 * TEXT_CHAR_PX + GEOMETRY.barPad

const topLabel = (cell: AxisCell, index: number): string => {
  if (cell.width < MIN_LABEL_W) return ''
  if (cell.kind === 'year') return String(cell.year)
  const name = monthName(cell.month)
  return cell.month === 0 && index > 0 ? `${name} ${cell.year}` : name
}

const bottomLabel = (cell: AxisCell): string => {
  if (cell.width < MIN_LABEL_W) return ''
  if (cell.kind === 'week') return String(cell.day)
  if (cell.kind === 'day') return `${cell.day} ${monthName(cell.month, 'short')}`
  return monthName(cell.month, cell.width >= 100 ? 'long' : 'short')
}

const pill = computed(() => {
  const x = axis.value.todayX
  return x === null ? null : { x: x - GEOMETRY.pillW / 2 }
})
</script>

<template>
  <svg
    class="gantt-axis"
    :width="axis.width"
    :height="GEOMETRY.headH"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Üst satır: ay (yıl). İç içe svg hücreyi kırpar (uzun ad taşmaz). -->
    <svg
      v-for="(cell, index) in axis.top"
      :key="cell.key"
      :x="cell.x"
      :y="0"
      :width="cell.width"
      :height="GEOMETRY.axisMonthH"
    >
      <line class="gantt-axis__sep" x1="0" x2="0" y1="0" :y2="GEOMETRY.axisMonthH" />
      <text
        v-if="topLabel(cell, index)"
        class="gantt-axis__month"
        :x="GEOMETRY.barPad + 2"
        :y="GEOMETRY.axisMonthH / 2"
      >
        {{ topLabel(cell, index) }}
      </text>
    </svg>
    <line
      class="gantt-axis__sep"
      x1="0"
      :x2="axis.width"
      :y1="GEOMETRY.axisMonthH"
      :y2="GEOMETRY.axisMonthH"
    />
    <!-- Alt satır: hafta / gün / ay. -->
    <svg
      v-for="cell in axis.bottom"
      :key="cell.key"
      :x="cell.x"
      :y="GEOMETRY.axisMonthH"
      :width="cell.width"
      :height="GEOMETRY.axisDayH"
    >
      <line
        v-if="scale !== 'hafta'"
        class="gantt-axis__sep"
        x1="0"
        x2="0"
        y1="0"
        :y2="GEOMETRY.axisDayH"
      />
      <text
        v-if="bottomLabel(cell)"
        class="gantt-axis__tick"
        :class="{ 'is-current': cell.current }"
        :x="scale === 'hafta' ? cell.width / 2 : GEOMETRY.barPad"
        :y="GEOMETRY.axisDayH / 2"
        :text-anchor="scale === 'hafta' ? 'middle' : 'start'"
      >
        {{ bottomLabel(cell) }}
      </text>
    </svg>
    <g v-if="pill" data-gantt="today-pill">
      <rect
        class="gantt-axis__pill"
        :x="pill.x"
        :y="(GEOMETRY.axisMonthH - GEOMETRY.pillH) / 2"
        :width="GEOMETRY.pillW"
        :height="GEOMETRY.pillH"
        :rx="GEOMETRY.pillR"
      />
      <text
        class="gantt-axis__pill-text"
        :x="pill.x + GEOMETRY.pillW / 2"
        :y="GEOMETRY.axisMonthH / 2"
      >
        {{ ganttText('timeline.gantt.today') }}
      </text>
    </g>
  </svg>
</template>
