<script setup lang="ts">
/**
 * SVAR Vue Gantt (MIT çekirdek) adayı. Grup = `summary` satırı, durum = `taskTypes`
 * (çubuk sınıfı `wx-<durum>` → `--gp-*`), bugün = `markers`, uç sürükleme =
 * `intercept('update-task')` (P8 politikası; tüm çubuğu taşıma reddedilir).
 */
import { computed, shallowRef } from 'vue'
import { Gantt, Willow, WillowDark, type IApi } from '@svar-ui/vue-gantt'
import '@svar-ui/vue-gantt/all.css'
import PilotShell from '../../common/PilotShell.vue'
import { isoDay, makeGantt, todayUtc, DAY } from '../../common/mock'
import { buildTree, STATUS_LABEL } from '../../common/tree'
import { canDrag, onEdgeDrop, pilot } from '../../common/state'

const data = makeGantt()
const tree = buildTree(data)
const byId = new Map(tree.map((n) => [n.id, n]))
const tasks = tree.map((n) => ({
  id: n.id,
  parent: n.parent ?? 0,
  text: n.text,
  // Kopya: SVAR tarih nesnelerini yerinde değiştiriyor (pilot bulgusu) → karşılaştırma bozulur.
  start: new Date(n.start),
  end: new Date(n.end),
  type: n.kind === 'group' ? 'summary' : n.kind === 'sub' ? 'sub' : n.status,
  open: n.kind === 'group',
  progress: 0,
}))
const links = data.links.map((l) => ({
  id: l.dependency_id,
  source: l.source,
  target: l.target,
  type: 'e2s' as const,
}))
const taskTypes = [
  ...Object.entries(STATUS_LABEL).map(([id, label]) => ({ id, label })),
  { id: 'sub', label: 'Alt görev (statik)' },
  { id: 'summary', label: 'Koordinatörlük' },
]
// `markers` MIT sürümde çizilmiyor (PRO, ölçüldü: 0 öğe) → bugün sütunu `highlightTime` ile.
const markers = [{ start: todayUtc(), text: 'bugün', css: 'pilot-today' }]
const todayIso = isoDay(todayUtc())
function highlightTime(d: Date, unit: string): string {
  if (unit !== 'day') return ''
  const iso = isoDay(new Date(d.getTime() - d.getTimezoneOffset() * 60000))
  if (iso === todayIso) return 'pilot-today-col'
  return d.getDay() === 0 || d.getDay() === 6 ? 'wx-weekend' : ''
}
const scales = computed(() =>
  pilot.scale === 'gun'
    ? [
        { unit: 'month', step: 1, format: '%F' },
        { unit: 'day', step: 1, format: '%j' },
      ]
    : [
        { unit: 'month', step: 1, format: '%F' },
        { unit: 'week', step: 1, format: '%j' },
      ],
)
const cellWidth = computed(() => (pilot.scale === 'gun' ? 21 : 42))
const columns = [{ id: 'text', header: 'görev', width: 300, flexgrow: 0 }]
const api = shallowRef<IApi>()

function init(a: IApi) {
  api.value = a
  // Bağımlılık ekleme Gantt'ta tasarlanmadı (F3 ayrı karar) → bağ oluşturma kapalı.
  a.intercept('add-link', () => false)
  // Sürükleme bitişi `update-task` olarak `diff` (gün) + yalnız değişen uç alanıyla gelir;
  // `start` ve `end` birlikte = tüm çubuğu taşıma (kapalı).
  a.intercept('update-task', (ev) => {
    const n = byId.get(String(ev.id))
    if (ev.inProgress || ev.diff === undefined) return true
    if (!n?.task) return false
    const hasS = ev.task.start !== undefined
    const hasE = ev.task.end !== undefined
    if (hasS === hasE) {
      pilot.log.unshift('reddedildi: tüm çubuğu taşıma kapalı')
      return false
    }
    const edge = hasS ? 'start' : 'end'
    const base = edge === 'start' ? n.start : new Date(n.end.getTime() - DAY)
    const to = new Date(base.getTime() + ev.diff * DAY)
    if (!onEdgeDrop({ task: n.task, edge, from: isoDay(base), to: isoDay(to) })) return false
    if (edge === 'start') n.start = to
    else n.end = new Date(to.getTime() + DAY)
    return true
  })
}
</script>

<template>
  <PilotShell title="SVAR Vue Gantt" :task-count="data.tasks.length">
    <component :is="pilot.theme === 'dark' ? WillowDark : Willow" :fonts="false">
      <div class="svar-host">
        <Gantt
          :tasks="tasks"
          :links="links"
          :task-types="taskTypes"
          :scales="scales"
          :cell-width="cellWidth"
          :cell-height="44"
          :columns="columns"
          :markers="markers"
          :highlight-time="highlightTime"
          :readonly="!canDrag(pilot.face)"
          :init="init"
        />
      </div>
    </component>
  </PilotShell>
</template>

<style>
/* Durum rengi SVAR'ın kendi değişkeniyle (özgüllük yarışı yok). */
.svar-host {
  position: absolute;
  inset: 0;
}
.wx-willow-theme,
.wx-willow-dark-theme {
  --wx-background: var(--bg-surface);
  --wx-color-font: var(--ink);
  --wx-color-secondary-font: var(--ink-muted);
  --wx-gantt-border: 1px solid var(--border-subtle);
  --wx-gantt-link-color: var(--ink-muted);
  --wx-gantt-task-font-color: var(--gp-ink);
  --wx-gantt-bar-border-radius: var(--radius-sm);
  --wx-font-family: var(--font-sans);
}
.wx-task.baslanmadi {
  --wx-gantt-task-color: var(--gp-todo);
}
.wx-task.devam_ediyor {
  --wx-gantt-task-color: var(--gp-doing);
}
.wx-task.onaya_sunuldu {
  --wx-gantt-task-color: var(--gp-review);
}
.wx-task.iade_edildi {
  --wx-gantt-task-color: var(--gp-back);
}
.wx-task.tamamlandi {
  --wx-gantt-task-color: var(--gp-done);
}
.wx-task.sub {
  --wx-gantt-task-color: transparent;
  --wx-gantt-task-border: 1px solid var(--gp-doing);
}
.wx-progress-marker {
  display: none;
}
.pilot-today-col {
  background: color-mix(in srgb, var(--accent-text) 35%, transparent);
}
.pilot-today {
  background: var(--accent-text);
  color: var(--accent-ink);
}
</style>
