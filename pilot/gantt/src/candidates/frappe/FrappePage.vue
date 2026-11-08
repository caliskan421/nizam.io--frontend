<script setup lang="ts">
/**
 * Frappe Gantt (MIT, vanilla SVG) adayı. Ağaç/grup ve sanallaştırma yok: görevler
 * koordinatörlük sırasıyla düz listelenir. Uç sürükleme `on_date_change` ile bırakmadan
 * SONRA bildirilir (iptal için yeniden çizim gerekir).
 */
import { onMounted, ref, watch } from 'vue'
import Gantt from 'frappe-gantt'
// paket `exports` CSS'i dışa açmıyor (`style` koşulu) → doğrudan dosya yolu
import '../../../node_modules/frappe-gantt/dist/frappe-gantt.css'
import PilotShell from '../../common/PilotShell.vue'
import { DAY, isoDay, makeGantt, type GanttTask } from '../../common/mock'
import { buildTree } from '../../common/tree'
import { canDrag, onEdgeDrop, pilot } from '../../common/state'

const data = makeGantt()
const nodes = buildTree(data, false).filter((n) => n.kind === 'task')
const deps = new Map<string, string[]>()
for (const l of data.links) deps.set(l.target, [...(deps.get(l.target) ?? []), l.source])
const byId = new Map<string, GanttTask>(data.tasks.map((t) => [t.work_item_id, t]))
const host = ref<HTMLElement>()
let chart: InstanceType<typeof Gantt> | undefined

function frappeTasks() {
  return nodes.map((n) => ({
    id: n.id,
    name: n.text,
    start: isoDay(n.start),
    end: isoDay(new Date(n.end.getTime() - DAY)),
    progress: 0,
    dependencies: (deps.get(n.id) ?? []).join(','),
    custom_class: `st-${n.status}`,
  }))
}

function render() {
  host.value!.replaceChildren()
  chart = new Gantt(host.value!, frappeTasks(), {
    view_mode: pilot.scale === 'gun' ? 'Day' : 'Week',
    bar_height: 24,
    padding: 20,
    language: 'tr',
    readonly: !canDrag(pilot.face),
    readonly_progress: true,
    today_button: false,
    popup_on: 'hover',
    on_date_change: (task: { id: string; _start: Date; _end: Date }, start: Date, end: Date) => {
      const n = nodes.find((x) => x.id === task.id)!
      const ds = Math.round((start.getTime() - n.start.getTime()) / DAY)
      const de = Math.round((end.getTime() + 1 - n.end.getTime()) / DAY)
      const edge = ds !== 0 && de === 0 ? 'start' : 'end'
      const ok =
        ds !== 0 && de !== 0
          ? (pilot.log.unshift(
              'reddedildi: tüm çubuğu taşıma (kütüphane kapatamıyor, sonradan geri alınır)',
            ),
            false)
          : onEdgeDrop({
              task: byId.get(task.id)!,
              edge,
              from: isoDay(edge === 'start' ? n.start : new Date(n.end.getTime() - DAY)),
              to: isoDay(edge === 'start' ? start : end),
            })
      if (ok) {
        n.start = start
        n.end = new Date(end.getTime() + 1)
      } else {
        chart?.refresh(frappeTasks())
      }
    },
  })
}

onMounted(render)
watch(() => [pilot.scale, pilot.face], render)
</script>

<template>
  <PilotShell
    title="Frappe Gantt"
    :task-count="data.tasks.length"
    note="Grup/ağaç satırı ve satır açma yok; bugün çizgisi yerine bugünün sütunu vurgulanır."
  >
    <div class="frappe-scroll"><div ref="host" /></div>
  </PilotShell>
</template>

<style>
.frappe-scroll {
  position: absolute;
  inset: 0;
  overflow: auto;
}
.gantt-container {
  --g-arrow-color: var(--ink-muted);
  --g-bar-color: var(--gp-todo);
  --g-bar-border: transparent;
  --g-tick-color-thick: var(--border-strong);
  --g-tick-color: var(--border-subtle);
  --g-border-color: var(--border-subtle);
  --g-text-muted: var(--ink-faint);
  --g-text-dark: var(--gp-ink);
  --g-text-light: var(--gp-ink);
  --g-handle-color: var(--ink);
  --g-header-background: var(--bg-surface);
  --g-row-color: var(--bg-surface);
  --g-row-border-color: var(--border-subtle);
  --g-today-highlight: var(--accent-text);
  --g-weekend-highlight-color: var(--bg-raised);
  --g-actions-background: var(--bg-raised);
  --g-popup-actions: var(--bg-raised);
}
.gantt .bar-wrapper.st-baslanmadi .bar {
  fill: var(--gp-todo);
}
.gantt .bar-wrapper.st-devam_ediyor .bar {
  fill: var(--gp-doing);
}
.gantt .bar-wrapper.st-onaya_sunuldu .bar {
  fill: var(--gp-review);
}
.gantt .bar-wrapper.st-iade_edildi .bar {
  fill: var(--gp-back);
}
.gantt .bar-wrapper.st-tamamlandi .bar {
  fill: var(--gp-done);
}
</style>
