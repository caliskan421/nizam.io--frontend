<script setup lang="ts">
/**
 * DHTMLX Gantt Community (MIT, v10) adayı. Grup = `project` satırı, sanallaştırma =
 * `smart_rendering`, klavye = `keyboard_navigation` eklentisi, uç sürükleme =
 * `onBeforeTaskChanged` (false → geri alır). Bugün işareti (marker) PRO'dadır → bugünün
 * sütunu `timeline_cell_class` ile boyanır.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import PilotShell from '../../common/PilotShell.vue'
import { DAY, isoDay, makeGantt, todayUtc, type GanttTask } from '../../common/mock'
import { buildTree } from '../../common/tree'
import { canDrag, onEdgeDrop, pilot } from '../../common/state'

const data = makeGantt()
const tree = buildTree(data)
const byId = new Map<string, GanttTask>(data.tasks.map((t) => [t.work_item_id, t]))
const host = ref<HTMLElement>()
const today = isoDay(todayUtc())

function configure() {
  const c = gantt.config
  c.columns = [{ name: 'text', label: 'görev', tree: true, width: 300 }]
  c.grid_width = 300
  c.row_height = 44
  c.bar_height = 24
  c.drag_move = false
  c.drag_progress = false
  c.drag_links = false
  c.drag_resize = true
  c.smart_rendering = true
  c.show_progress = false
  c.details_on_dblclick = false
  c.readonly = !canDrag(pilot.face)
  c.min_column_width = pilot.scale === 'gun' ? 21 : 42
  c.scales =
    pilot.scale === 'gun'
      ? [
          { unit: 'month', step: 1, format: '%F' },
          { unit: 'day', step: 1, format: '%j' },
        ]
      : [
          { unit: 'month', step: 1, format: '%F' },
          { unit: 'week', step: 1, format: '%j' },
        ]
  gantt.templates.task_class = (_s, _e, t) => `st-${String(t.status)}`
  gantt.templates.timeline_cell_class = (_t, d) =>
    isoDay(new Date(d.getTime() - d.getTimezoneOffset() * 60000)) === today ? 'pilot-today' : ''
}

onMounted(() => {
  gantt.plugins({ keyboard_navigation: true, tooltip: true })
  gantt.i18n.setLocale('tr')
  configure()
  gantt.attachEvent(
    'onBeforeTaskChanged',
    (id: string | number, mode: string, old: { start_date?: Date; end_date?: Date }) => {
      const t = gantt.getTask(id)
      const task = byId.get(String(id))
      if (!task || !old.start_date || !old.end_date || !t.start_date || !t.end_date) return false
      const edge = t.start_date.getTime() !== old.start_date.getTime() ? 'start' : 'end'
      const from = isoDay(
        edge === 'start' ? old.start_date : new Date(old.end_date.getTime() - DAY),
      )
      const to = isoDay(edge === 'start' ? t.start_date! : new Date(t.end_date!.getTime() - DAY))
      pilot.log.unshift(`mod: ${mode}`)
      return onEdgeDrop({ task, edge, from, to })
    },
  )
  gantt.init(host.value!)
  gantt.parse({
    data: tree.map((n) => ({
      id: n.id,
      parent: n.parent ?? 0,
      text: n.text,
      start_date: n.start,
      end_date: n.end,
      type: n.kind === 'group' ? 'project' : 'task',
      open: n.kind === 'group',
      status: n.status,
      readonly: n.kind !== 'task',
    })),
    links: data.links.map((l) => ({
      id: l.dependency_id,
      source: l.source,
      target: l.target,
      type: '0',
    })),
  })
  gantt.showDate(todayUtc())
})
watch(
  () => [pilot.scale, pilot.face],
  () => {
    configure()
    gantt.render()
  },
)
onBeforeUnmount(() => gantt.destructor())
</script>

<template>
  <PilotShell
    title="DHTMLX Gantt (Community)"
    :task-count="data.tasks.length"
    note="Bugün çizgisi (marker) ve gruplama PRO'da; bugün sütunu boyanır, grup = project satırı."
  >
    <div ref="host" class="dhx-host" />
  </PilotShell>
</template>

<style>
.dhx-host {
  position: absolute;
  inset: 0;
}
.gantt_container {
  --dhx-gantt-font-family: var(--font-sans);
  --dhx-gantt-base-colors-background: var(--bg-surface);
  --dhx-gantt-base-colors-text-base: var(--ink);
  --dhx-gantt-base-colors-border: var(--border-subtle);
  --dhx-gantt-base-colors-border-light: var(--border-subtle);
  --dhx-gantt-grid-body-background: var(--bg-surface);
  --dhx-gantt-grid-scale-background: var(--bg-surface);
  --dhx-gantt-grid-scale-color: var(--ink-faint);
  --dhx-gantt-scale-background: var(--bg-surface);
  --dhx-gantt-scale-color: var(--ink-faint);
  --dhx-gantt-timeline-scale-background: var(--bg-surface);
  --dhx-gantt-timeline-scale-color: var(--ink-faint);
  --dhx-gantt-task-row-background: var(--bg-surface);
  --dhx-gantt-task-row-background--odd: var(--bg-surface);
  --dhx-gantt-task-row-border: var(--border-subtle);
  --dhx-gantt-grid-row-border: var(--border-subtle);
  --dhx-gantt-task-color: var(--gp-ink);
  --dhx-gantt-task-border-radius: var(--radius-sm);
  --dhx-gantt-link-background: var(--ink-muted);
  --dhx-gantt-base-colors-select: var(--bg-raised);
  --dhx-gantt-base-colors-hover-color: var(--bg-raised);
}
.gantt_task_line.st-baslanmadi {
  background: var(--gp-todo);
}
.gantt_task_line.st-devam_ediyor {
  background: var(--gp-doing);
}
.gantt_task_line.st-onaya_sunuldu {
  background: var(--gp-review);
}
.gantt_task_line.st-iade_edildi {
  background: var(--gp-back);
}
.gantt_task_line.st-tamamlandi {
  background: var(--gp-done);
}
.gantt_task_line.st-sub {
  background: transparent;
  border: 1px solid var(--gp-doing);
}
.gantt_task_cell.pilot-today {
  background: color-mix(in srgb, var(--accent-text) 35%, transparent);
}
</style>
