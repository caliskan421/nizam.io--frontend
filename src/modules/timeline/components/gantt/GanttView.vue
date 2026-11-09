<script setup lang="ts">
import './gantt.css'

import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'

import type { DateKeyRequest } from '../../composables/useGanttKeyboard'
import { addDays } from '../../model/timeline'
import { buildLayout, revealScrollTop, rowWindow } from '../../model/rows'
import {
  DAY_WIDTH,
  GEOMETRY,
  ganttRange,
  rangeWidth,
  scrollLeftFor,
  visibleRange,
} from '../../model/timeline'
import type { GanttDayRange, GanttViewEmits, GanttViewProps } from '../index'
import GanttAxis from './GanttAxis.vue'
import GanttBars from './GanttBars.vue'
import GanttGrid from './GanttGrid.vue'
import GanttLinks from './GanttLinks.vue'
import GanttRows from './GanttRows.vue'
import { GANTT_HOVER } from './gantt-context'
import { ganttText } from './messages'

/**
 * Gantt kabı (E-03C-21…43): yapışkan başlık + yapışkan sol sütun, tek kaydırma alanı. Satırlar
 * (HTML `treegrid`) ve zaman katmanı (kendi SVG) aynı satır düzleminden (`rows.ts`) beslenir;
 * 250 görevde yalnız görünür dilim çizilir. Grup açık/kapalı durumu burada tutulur (bellek;
 * kapsam değişince üst sayfa bileşeni yeniden kurar). Politika yoktur: seçim, uç sürükleme ve
 * görünen aralık olay olarak yukarı çıkar; tarih kısayolu için `dateKeyHandler` (W95).
 */
const props = defineProps<
  GanttViewProps & {
    /** Departman kimliği → kod öneki (yalnız Admin yüzünde verilir; E-03C-30). */
    departmentCodes?: ReadonlyMap<string, string>
    /** W95 uzantı noktası: klavyeyle tarih değiştirme (Shift / Alt+Shift + ←/→). */
    dateKeyHandler?: (request: DateKeyRequest) => boolean | void
  }
>()
const emit = defineEmits<GanttViewEmits>()

/** Ölçülemeyen ortamda (test) varsayılan görünür alan. */
const FALLBACK = { width: 1200, height: 800 }

const scroller = ref<HTMLElement | null>(null)
const collapsed = ref<ReadonlySet<string>>(new Set())
const viewport = reactive({
  left: 0,
  top: 0,
  width: FALLBACK.width,
  height: FALLBACK.height,
  /** Ölçülen sol sütun genişliği (dar ekranda token değerinden küçük olabilir). */
  label: GEOMETRY.labelW,
})
const announcement = ref('')
const hover = ref<string | null>(null)
provide(GANTT_HOVER, hover)

const dayW = computed(() => DAY_WIDTH[props.scale])
const plotViewW = computed(() => Math.max(viewport.width - viewport.label, dayW.value))
const layout = computed(() =>
  buildLayout({
    tasks: props.tasks,
    links: props.links,
    departmentNames: props.departmentNames,
    collapsed: collapsed.value,
  }),
)
const range = computed<GanttDayRange>(() =>
  ganttRange(props.tasks, props.today, { minDays: Math.ceil(plotViewW.value / dayW.value) }),
)
const plotW = computed(() => rangeWidth(range.value, props.scale))
const rowsViewH = computed(() => Math.max(viewport.height - GEOMETRY.headH, GEOMETRY.rowH))
const win = computed(() => rowWindow(layout.value.rows, viewport.top, rowsViewH.value))
const pageSize = computed(() => Math.max(1, Math.floor(rowsViewH.value / GEOMETRY.rowH) - 1))

// --- Kaydırma ve ölçüm -----------------------------------------------------------------

let lastView = ''
function emitView(): void {
  const view = visibleRange(range.value, props.scale, viewport.left, plotViewW.value)
  const key = `${view.start}|${view.end}`
  if (key === lastView) return
  lastView = key
  emit('scroll', view)
}

function onScroll(): void {
  const el = scroller.value
  if (!el) return
  viewport.left = el.scrollLeft
  viewport.top = el.scrollTop
  emitView()
}

function measure(): void {
  const el = scroller.value
  if (!el) return
  viewport.width = el.clientWidth || FALLBACK.width
  viewport.height = el.clientHeight || FALLBACK.height
  viewport.label = el.querySelector<HTMLElement>('.gantt__corner')?.offsetWidth || GEOMETRY.labelW
  emitView()
}

/** Verilen günü görünür alanın ortasına kaydırır (şerit tıklaması, bugüne dön). */
function scrollToDay(day: string): void {
  const el = scroller.value
  if (!el) return
  el.scrollLeft = scrollLeftFor(range.value, props.scale, day, plotViewW.value)
  onScroll()
}

let observer: ResizeObserver | null = null
onMounted(() => {
  measure()
  scrollToDay(props.today)
  if (typeof ResizeObserver !== 'undefined' && scroller.value) {
    observer = new ResizeObserver(measure)
    observer.observe(scroller.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())

// Ölçek değişince görünür alanın ortasındaki gün yerinde kalır.
watch(
  () => props.scale,
  (_next, previous) => {
    const oldW = DAY_WIDTH[previous]
    const center = addDays(
      range.value.start,
      Math.floor((viewport.left + plotViewW.value / 2) / oldW),
    )
    if (center === null) return
    void nextTick(() => {
      const el = scroller.value
      if (!el) return
      el.scrollLeft = scrollLeftFor(range.value, props.scale, center, plotViewW.value)
      onScroll()
    })
  },
)

// --- Grup aç/kapa, seçim, odak ------------------------------------------------------------

function setGroupOpen(groupKey: string, open: boolean): void {
  const next = new Set(collapsed.value)
  if (open) next.delete(groupKey)
  else next.add(groupKey)
  collapsed.value = next
  const row = layout.value.rows.find((r) => r.key === groupKey)
  if (row?.kind === 'group') {
    announcement.value = ganttText(
      open ? 'timeline.gantt.groupOpened' : 'timeline.gantt.groupClosed',
      { name: row.name ?? ganttText('timeline.gantt.unknownGroup') },
    )
  }
}

function onSelect(workItemId: string): void {
  const row = props.tasks.find((t) => t.work_item_id === workItemId)
  if (row) announcement.value = ganttText('timeline.gantt.selected', { title: row.title })
  emit('select', workItemId)
}

/** Odak satırı görünür alanda değilse kaydırır (eşzamanlı: odak bundan sonra verilir). */
function reveal(index: number): void {
  const row = layout.value.rows[index]
  const el = scroller.value
  if (!row || !el) return
  const top = revealScrollTop(row, viewport.top, rowsViewH.value)
  if (top === viewport.top) return
  el.scrollTop = top
  viewport.top = top
}

defineExpose({ scrollToDay })
</script>

<template>
  <div class="gantt" :data-scale="scale">
    <div ref="scroller" class="gantt__scroller" @scroll.passive="onScroll">
      <div class="gantt__canvas" :style="{ width: `calc(var(--gantt-label) + ${plotW}px)` }">
        <div class="gantt__head">
          <div class="gantt__corner">
            <span class="gantt-kicker">{{ ganttText('timeline.gantt.corner') }}</span>
          </div>
          <GanttAxis :scale="scale" :range="range" :today="today" />
        </div>
        <div class="gantt__body" :style="{ height: `${layout.height}px` }">
          <div class="gantt__plot" :style="{ width: `${plotW}px`, height: `${layout.height}px` }">
            <GanttGrid
              layer="grid"
              :scale="scale"
              :range="range"
              :today="today"
              :layout="layout"
              :window="win"
            />
            <GanttBars
              :tasks="tasks"
              :scale="scale"
              :range="range"
              :today="today"
              :selected-id="selectedId"
              :draggable-ids="draggableIds"
              :layout="layout"
              :window="win"
              @select="onSelect"
              @edge-drag="emit('edge-drag', $event)"
            />
            <GanttLinks
              :links="links"
              :tasks="tasks"
              :scale="scale"
              :range="range"
              :layout="layout"
              :window="win"
            />
            <GanttGrid
              layer="today"
              :scale="scale"
              :range="range"
              :today="today"
              :layout="layout"
              :window="win"
            />
          </div>
          <GanttRows
            :tasks="tasks"
            :department-names="departmentNames"
            :selected-id="selectedId"
            :layout="layout"
            :window="win"
            :page-size="pageSize"
            :department-codes="departmentCodes"
            :date-key-handler="dateKeyHandler"
            @select="onSelect"
            @toggle="setGroupOpen"
            @reveal="reveal"
          />
        </div>
      </div>
    </div>
    <p class="gantt-sr" role="status" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
