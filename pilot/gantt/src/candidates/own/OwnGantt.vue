<script setup lang="ts">
/**
 * Kendi SVG Gantt adayı. HTML treegrid (sol sütun, erişilebilirlik) + tek SVG zaman katmanı
 * (ızgara, çubuk, taşma, ok, bugün). Konum yalnız SVG özniteliği / CSSOM ile — satır içi
 * `style` özniteliği ve `<style>` enjeksiyonu yok (CSP nonce gerektirmez).
 */
import { computed, nextTick, onMounted, ref, toRef } from 'vue'
import {
  DAY,
  departmentName,
  isoDay,
  parseDay,
  plannedEnd,
  type Gantt,
  type GanttTask,
} from '../../common/mock'
import { canDrag, onEdgeDrop, pilot, type Edge, type Scale } from '../../common/state'
import { LABEL_W, useTimeline, type Row } from './useTimeline'

const props = defineProps<{ gantt: Gantt; scale: Scale }>()
const tl = useTimeline(toRef(props, 'gantt'), toRef(props, 'scale'))
const scroller = ref<HTMLElement>()
const scrollTop = ref(0)
const viewH = ref(800)
const focusIdx = ref(0)
const selected = ref<string>()
const said = ref('')
const override = ref(new Map<string, { start_on: string; end_on: string }>())
const STATUS: Record<string, string> = {
  baslanmadi: 'Başlamadı',
  devam_ediyor: 'Devam ediyor',
  onaya_sunuldu: 'Onay bekliyor',
  iade_edildi: 'Geri gönderildi',
  tamamlandi: 'Tamamlandı',
}
const GP: Record<string, string> = {
  baslanmadi: 'todo',
  devam_ediyor: 'doing',
  onaya_sunuldu: 'review',
  iade_edildi: 'back',
  tamamlandi: 'done',
}

const win = computed(() => tl.windowOf(scrollTop.value, viewH.value))
const visible = computed(() =>
  tl.rows.value
    .slice(win.value.first, win.value.last + 1)
    .map((r, i) => ({ r, i: win.value.first + i })),
)
// Sanallaştırmada odak satırı pencereden çıkarsa ilk görünür satır sekme durağı olur.
const tabStop = computed(() => {
  const { first, last } = win.value
  return focusIdx.value >= first && focusIdx.value <= last
    ? focusIdx.value
    : Math.min(first + 6, last)
})
const arrows = computed(() => tl.arrows(win.value))
const weeks = computed(() => {
  const out: { x: number; label: string; month: string | null }[] = []
  const start = tl.range.value.start
  for (let d = 0; d < tl.range.value.days; d++) {
    const day = new Date(start + d * DAY)
    const ticks = props.scale === 'gun' ? [1, 4] : [1]
    if (!ticks.includes(day.getUTCDay())) continue
    const month =
      day.getUTCDate() <= 7 && day.getUTCDay() === 1
        ? day.toLocaleDateString('tr-TR', { month: 'long', timeZone: 'UTC' })
        : null
    out.push({ x: d * tl.dayW.value, label: String(day.getUTCDate()), month })
  }
  return out
})

const firstMon = computed(
  () => ((8 - new Date(tl.range.value.start).getUTCDay()) % 7) * tl.dayW.value,
)

function eff(t: GanttTask): GanttTask {
  const o = override.value.get(t.work_item_id)
  return o ? { ...t, ...o } : t
}
function label(t: GanttTask): string {
  const l = t.lateness
  const late = l.is_overdue
    ? `, ${l.days_overdue} gün gecikmede`
    : l.is_completed_late
      ? `, ${l.days_late} gün geç bitti`
      : ''
  return `${t.title}, ${STATUS[t.status] ?? t.status}, ${t.start_on} – ${plannedEnd(t)}${late}${tl.linked.value.has(t.work_item_id) ? ', bağımlılığı var' : ''}`
}
function onScroll() {
  scrollTop.value = scroller.value!.scrollTop
}
function shift(t: GanttTask, edge: Edge, days: number) {
  const cur = eff(t)
  const from = edge === 'start' ? cur.start_on : cur.end_on
  const to = isoDay(new Date(parseDay(from).getTime() + days * DAY))
  if (days === 0 || !onEdgeDrop({ task: t, edge, from, to })) return
  override.value.set(t.work_item_id, { ...cur, [edge === 'start' ? 'start_on' : 'end_on']: to })
  override.value = new Map(override.value)
  said.value = `${t.title}: ${edge === 'start' ? 'başlangıç' : 'bitiş'} ${to}`
}
function startDrag(e: PointerEvent, t: GanttTask, edge: Edge) {
  if (!canDrag(pilot.face)) return
  const el = e.currentTarget as SVGElement
  el.setPointerCapture(e.pointerId)
  const x0 = e.clientX
  const up = (u: PointerEvent) => {
    el.removeEventListener('pointerup', up)
    shift(t, edge, Math.round((u.clientX - x0) / tl.dayW.value))
  }
  el.addEventListener('pointerup', up)
}
async function focusRow(i: number) {
  focusIdx.value = Math.max(0, Math.min(tl.rows.value.length - 1, i))
  const y = tl.offsets.value[focusIdx.value]!
  const s = scroller.value!
  if (y < s.scrollTop + 60 || y > s.scrollTop + s.clientHeight - 60)
    s.scrollTop = y - s.clientHeight / 2
  onScroll()
  await nextTick()
  s.querySelector<HTMLElement>(`[data-i="${focusIdx.value}"]`)?.focus()
}
function onKey(e: KeyboardEvent, r: Row, i: number) {
  const task = r.kind === 'task' ? r.task : undefined
  if (task && e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    shift(task, e.altKey ? 'start' : 'end', e.key === 'ArrowRight' ? 1 : -1)
  } else if (e.key === 'ArrowDown') void focusRow(i + 1)
  else if (e.key === 'ArrowUp') void focusRow(i - 1)
  else if (e.key === 'PageDown') void focusRow(i + 10)
  else if (e.key === 'PageUp') void focusRow(i - 10)
  else if (e.key === 'Home') void focusRow(0)
  else if (e.key === 'End') void focusRow(tl.rows.value.length - 1)
  else if (
    (e.key === 'ArrowRight' && r.kind !== 'sub' && !r.open) ||
    (e.key === 'ArrowLeft' && r.kind !== 'sub' && r.open)
  )
    tl.toggle(r)
  else if ((e.key === 'Enter' || e.key === ' ') && task) selected.value = task.work_item_id
  else return
  e.preventDefault()
}
function scrollToToday() {
  scroller.value!.scrollLeft = tl.todayX.value - scroller.value!.clientWidth / 2 + LABEL_W
}
onMounted(() => {
  viewH.value = scroller.value!.clientHeight
  scrollToToday()
})
defineExpose({ expandAll: tl.expandAll, scrollToToday })
</script>

<template>
  <div ref="scroller" class="og" tabindex="-1" @scroll.passive="onScroll">
    <div
      class="og-canvas"
      :style="{ width: `${LABEL_W + tl.width.value}px`, height: `${tl.height.value + 48}px` }"
    >
      <div class="og-head" aria-hidden="true">
        <div class="og-corner">görev</div>
        <svg class="og-axis" :width="tl.width.value" height="48">
          <g v-for="w in weeks" :key="w.x">
            <text v-if="w.month" :x="w.x + 4" y="18" class="og-month">{{ w.month }}</text>
            <text :x="w.x + 4" y="40" class="og-day">{{ w.label }}</text>
          </g>
          <rect
            :x="tl.todayX.value - 24"
            y="24"
            width="48"
            height="20"
            rx="6"
            class="og-today-pill"
          />
          <text :x="tl.todayX.value" y="38" text-anchor="middle" class="og-today-text">bugün</text>
        </svg>
      </div>
      <svg class="og-svg" :width="tl.width.value" :height="tl.height.value" aria-hidden="true">
        <defs>
          <pattern
            id="og-week"
            patternUnits="userSpaceOnUse"
            :x="firstMon"
            :width="tl.dayW.value * 7"
            :height="tl.height.value"
          >
            <line x1="0.5" x2="0.5" y1="0" :y2="tl.height.value" class="og-grid" />
          </pattern>
          <marker
            id="og-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" class="og-arrowhead" />
          </marker>
        </defs>
        <rect x="0" y="0" :width="tl.width.value" :height="tl.height.value" fill="url(#og-week)" />
        <template v-for="{ r, i } in visible" :key="r.key">
          <g
            v-if="r.kind === 'task'"
            :transform="`translate(0 ${tl.offsets.value[i]! + 10})`"
            :class="{ sel: selected === r.key }"
            @click="selected = r.key"
          >
            <rect
              :x="tl.bar(eff(r.task)).x0"
              :width="tl.bar(eff(r.task)).x1 - tl.bar(eff(r.task)).x0"
              height="24"
              rx="8"
              class="og-bar-late"
            />
            <rect
              :x="tl.bar(eff(r.task)).x0"
              :width="tl.bar(eff(r.task)).xp - tl.bar(eff(r.task)).x0"
              height="24"
              rx="8"
              :class="`og-bar gp-${GP[r.task.status] ?? 'todo'}`"
            />
            <text :x="tl.bar(eff(r.task)).x0 + 8" y="16" class="og-bar-text">
              {{ r.task.title }}
            </text>
            <template v-if="selected === r.key && canDrag(pilot.face)">
              <rect
                :x="tl.bar(eff(r.task)).x0 - 3"
                y="4"
                width="6"
                height="16"
                rx="3"
                class="og-handle"
                @pointerdown="startDrag($event, r.task, 'start')"
              />
              <rect
                :x="tl.bar(eff(r.task)).xp - 3"
                y="4"
                width="6"
                height="16"
                rx="3"
                class="og-handle"
                @pointerdown="startDrag($event, r.task, 'end')"
              />
            </template>
          </g>
          <rect
            v-else-if="r.kind === 'sub'"
            :x="tl.bar(eff(tl.taskById.value.get(r.parent)!)).x0"
            :y="tl.offsets.value[i]! + 11"
            width="40"
            height="8"
            rx="4"
            class="og-subbar"
          />
        </template>
        <path
          v-for="a in arrows"
          :key="a.key"
          :d="a.d"
          :class="['og-link', { cross: a.cross, stub: a.stub }]"
          marker-end="url(#og-arrow)"
        />
        <line
          :x1="tl.todayX.value"
          :x2="tl.todayX.value"
          y1="0"
          :y2="tl.height.value"
          class="og-today"
        />
      </svg>
      <div
        role="treegrid"
        aria-label="Zaman çizelgesi"
        :aria-rowcount="tl.rows.value.length"
        class="og-rows"
      >
        <div
          v-for="{ r, i } in visible"
          :key="r.key"
          role="row"
          :data-i="i"
          :aria-rowindex="i + 1"
          :aria-level="r.level"
          :aria-expanded="r.kind === 'sub' ? undefined : r.open"
          :aria-selected="r.kind === 'task' ? selected === r.key : undefined"
          :tabindex="i === tabStop ? 0 : -1"
          :class="['og-row', `og-${r.kind}`]"
          :style="{ transform: `translateY(${tl.offsets.value[i]}px)` }"
          @keydown="onKey($event, r, i)"
          @focus="focusIdx = i"
          @click="r.kind === 'sub' ? null : r.kind === 'group' ? tl.toggle(r) : (selected = r.key)"
        >
          <div role="rowheader" class="og-label">
            <template v-if="r.kind === 'group'"
              >{{ r.open ? '⌄' : '›' }} {{ r.name }}
              <span class="og-count">{{ r.done }} / {{ r.count }}</span></template
            >
            <template v-else-if="r.kind === 'task'">
              <button
                type="button"
                tabindex="-1"
                class="og-tog"
                :aria-label="r.open ? 'Alt görevleri gizle' : 'Alt görevleri göster'"
                @click.stop="tl.toggle(r)"
              >
                {{ r.open ? '⌄' : '›' }}
              </button>
              <span class="og-title">{{ r.task.title }}</span>
            </template>
            <template v-else>alt görev satırı · statik (BE-020)</template>
          </div>
          <div role="gridcell" class="og-cell">
            {{
              r.kind === 'task'
                ? label(eff(r.task))
                : r.kind === 'group'
                  ? departmentName(r.key)
                  : ''
            }}
          </div>
        </div>
      </div>
    </div>
    <p class="og-live" aria-live="polite">{{ said }}</p>
  </div>
</template>

<style>
.og {
  position: absolute;
  inset: 0;
  overflow: auto;
}
.og-canvas {
  position: relative;
}
.og-head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  height: var(--space-12);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}
.og-corner {
  position: sticky;
  left: 0;
  z-index: 4;
  flex: none;
  width: 300px;
  padding: var(--space-4);
  box-sizing: border-box;
  background: var(--bg-surface);
  color: var(--ink-faint);
  font-family: var(--font-mono);
}
.og-month {
  fill: var(--ink);
  font-size: 13px;
  font-weight: 600;
}
.og-day {
  fill: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: 12px;
}
.og-today-pill {
  fill: var(--accent);
}
.og-today-text {
  fill: var(--accent-ink);
  font-family: var(--font-mono);
  font-size: 12px;
}
.og-svg {
  position: absolute;
  top: var(--space-12);
  left: 300px;
}
.og-grid {
  stroke: var(--border-subtle);
}
.og-today {
  stroke: var(--accent-text);
  stroke-width: 2;
}
.og-bar {
  stroke: color-mix(in srgb, currentColor 70%, transparent);
}
.og-bar-late {
  fill: var(--gp-late);
}
.gp-todo {
  fill: var(--gp-todo);
}
.gp-doing {
  fill: var(--gp-doing);
}
.gp-review {
  fill: var(--gp-review);
}
.gp-back {
  fill: var(--gp-back);
}
.gp-done {
  fill: var(--gp-done);
}
.og-bar-text {
  fill: var(--gp-ink);
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}
.sel .og-bar {
  stroke: var(--ink);
  stroke-width: 2;
}
.og-handle {
  fill: var(--ink);
  cursor: ew-resize;
}
.og-subbar {
  fill: none;
  stroke: var(--gp-doing);
}
.og-link {
  fill: none;
  stroke: var(--ink-muted);
  stroke-width: 1.5;
}
.og-link.cross {
  stroke-dasharray: 4 3;
}
.og-link.stub {
  stroke: var(--ink-faint);
}
.og-arrowhead {
  fill: var(--ink-muted);
}
.og-rows {
  position: absolute;
  top: var(--space-12);
  left: 0;
  width: 100%;
}
.og-row {
  position: absolute;
  left: 0;
  width: 100%;
  display: grid;
  grid-template-columns: 300px 1fr;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  box-sizing: border-box;
  pointer-events: none;
}
.og-row:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: calc(-1 * var(--focus-ring-width));
}
.og-group {
  height: 40px;
}
.og-task {
  height: 44px;
}
.og-sub {
  height: 30px;
}
.og-label {
  position: sticky;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  box-sizing: border-box;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  pointer-events: auto;
  overflow: hidden;
  white-space: nowrap;
}
.og-group .og-label {
  font-weight: 600;
  background: var(--bg-base);
}
.og-sub .og-label {
  padding-left: var(--space-10);
  color: var(--ink-faint);
}
.og-title {
  overflow: hidden;
  text-overflow: ellipsis;
}
.og-count {
  color: var(--ink-faint);
  font-family: var(--font-mono);
}
.og-tog {
  background: none;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
  cursor: pointer;
}
.og-cell,
.og-live {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
