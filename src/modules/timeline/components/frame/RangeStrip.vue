<script setup lang="ts">
import './frame.css'

import { computed, ref } from 'vue'

import type { RangeStripEmits, RangeStripProps } from '../index'
import { frameText } from './messages'
import {
  addDays,
  barHeights,
  bucketDays,
  dayAt,
  dayFraction,
  rangeText,
  viewWindow,
} from './strip-model'

/**
 * Görev aralığı şeridi (E-03C-14…18): yüklü görevlerin en erken başlangıç – en geç bitişi
 * ("görev aralığı"; "sezon" denmez, `Program.year` varsa ayrıca yıl), haftalık yoğunluk
 * histogramı, Gantt'ın görünen aralık çerçevesi, bugün işareti ve "baktığın yer". Şeride tık
 * `seek` yayar (Gantt o konuma kaydırır); sürükleme yok. Klavye: ←/→ görünen aralığı bir hafta
 * kaydırır. Aralık yoksa (tarihli görev yok) şerit çizilmez.
 */
const props = defineProps<RangeStripProps>()
const emit = defineEmits<RangeStripEmits>()

const track = ref<HTMLElement | null>(null)

const label = computed(() => {
  if (props.range === null) return ''
  const range = rangeText(props.range)
  if (props.view === null) return frameText('timeline.frame.strip.label', { range })
  return frameText('timeline.frame.strip.labelView', { range, view: rangeText(props.view) })
})

const kicker = computed(() => {
  const base = frameText('timeline.frame.strip.kicker')
  return props.year === null ? base : `${base} ${props.year}`
})

const bars = computed(() => {
  const range = props.range
  if (range === null) return []
  const heights = barHeights(props.histogram)
  return props.histogram.map((count, index) => ({
    index,
    empty: count === 0,
    grow: bucketDays(range, index),
    height: `${heights[index]}%`,
  }))
})

const frame = computed(() =>
  props.range && props.view ? viewWindow(props.range, props.view) : null,
)

const here = computed(() => {
  if (!props.range || !props.view) return null
  const middle = addDays(props.view.start, Math.floor(daySpan(props.view) / 2))
  const at = middle === null ? null : dayFraction(props.range, middle)
  return at === null ? null : at * 100
})

const today = computed(() => {
  const at = props.range ? dayFraction(props.range, props.today) : null
  return at === null ? null : at * 100
})

function daySpan(view: { start: string; end: string }): number {
  const a = Date.parse(view.start)
  const b = Date.parse(view.end)
  return Number.isNaN(a) || Number.isNaN(b) ? 0 : Math.round((b - a) / 86_400_000)
}

function onClick(event: MouseEvent): void {
  const range = props.range
  const el = track.value
  if (!range || !el) return
  const rect = el.getBoundingClientRect()
  // Klavyeden (Enter/Boşluk) gelen tık konumsuzdur: görünen aralığın başına gider.
  if (event.detail === 0 || rect.width === 0) {
    if (props.view) emit('seek', props.view.start)
    return
  }
  const day = dayAt(range, (event.clientX - rect.left) / rect.width)
  if (day !== null) emit('seek', day)
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.view || !props.range) return
  const step = event.key === 'ArrowRight' ? 7 : event.key === 'ArrowLeft' ? -7 : 0
  if (step === 0) return
  event.preventDefault()
  const next = addDays(props.view.start, step)
  if (next !== null) emit('seek', next)
}
</script>

<template>
  <div v-if="range" class="tl-strip" data-testid="timeline-strip">
    <div class="tl-strip__label">
      <p class="tl-strip__kicker" data-testid="timeline-strip-kicker">{{ kicker }}</p>
      <p class="tl-strip__range">{{ rangeText(range) }}</p>
    </div>
    <button
      ref="track"
      type="button"
      class="tl-strip__track"
      :aria-label="label"
      :title="frameText('timeline.frame.strip.seek')"
      data-testid="timeline-strip-track"
      @click="onClick"
      @keydown="onKeydown"
    >
      <span
        v-for="bar in bars"
        :key="bar.index"
        class="tl-strip__bar"
        :class="{ 'tl-strip__bar--empty': bar.empty }"
        :style="{ height: bar.height, flexGrow: bar.grow }"
        aria-hidden="true"
        data-bar
      />
      <span
        v-if="frame"
        class="tl-strip__frame"
        :style="{ left: `${frame.left}%`, width: `${frame.width}%` }"
        aria-hidden="true"
        data-testid="timeline-strip-frame"
      />
      <span
        v-if="today !== null"
        class="tl-strip__today"
        :style="{ left: `${today}%` }"
        :title="frameText('timeline.frame.strip.today')"
        aria-hidden="true"
        data-testid="timeline-strip-today"
      />
      <span
        v-if="here !== null"
        class="tl-strip__here"
        :style="{ left: `${here}%` }"
        :title="frameText('timeline.frame.strip.here')"
        aria-hidden="true"
        data-testid="timeline-strip-here"
      />
    </button>
  </div>
</template>
