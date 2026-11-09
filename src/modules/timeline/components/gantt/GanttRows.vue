<script setup lang="ts">
import './gantt.css'

import { computed, nextTick, ref, useTemplateRef } from 'vue'

import { designStub } from '@/shared/design-stub'
import { UiIcon } from '@/shared/ui'

import { useGanttKeyboard, type DateKeyRequest } from '../../composables/useGanttKeyboard'
import type { GanttLayout, GanttRow, RowWindow } from '../../model/rows'
import type { GanttRowsEmits, GanttRowsProps } from '../index'
import { useGanttHover } from './gantt-context'
import { ganttText } from './messages'
import { dotTitle, isLate, rowSummary, statusTone } from './task-view'

/**
 * Sol sütun: `treegrid` (koordinatörlük grubu → görev; E-03C-21, 28, 30…32, 35). Dolaşan
 * `tabindex` (tek sekme durağı), ↑↓ PageUp/Down Home/End, →← aç/kapa, Enter seç; görünür pencere
 * dışındaki odak satırı kaydırmayı üst bileşenden ister (`reveal`). Durum rengi tek başına
 * taşıyıcı değildir: her görev satırının görünmez hücresi başlık, durum, aralık ve gecikmeyi
 * söyler. Kod sütunu: yalnız `departmentCodes` verilen birimde `‹KOD›-—` (sıra numarası statik,
 * BE-005); aksi hâlde boş. `tasks` / `departmentNames` sözleşme gereği alınır, satırlar `layout`'tan.
 */
const props = defineProps<
  GanttRowsProps & {
    layout: GanttLayout
    window: RowWindow
    pageSize: number
    departmentCodes?: ReadonlyMap<string, string>
    /** W95 uzantı noktası: Shift(+Alt)+←/→ tarih kısayolu (verilmezse işlenmez). */
    dateKeyHandler?: (request: DateKeyRequest) => boolean | void
  }
>()
const emit = defineEmits<
  GanttRowsEmits & {
    toggle: [groupKey: string, open: boolean]
    reveal: [index: number]
  }
>()

const hover = useGanttHover()
const root = useTemplateRef<HTMLElement>('root')
const focusKey = ref<string | null>(null)

const visible = computed(() =>
  props.layout.rows
    .slice(props.window.first, props.window.last + 1)
    .map((row, offset) => ({ row, index: props.window.first + offset })),
)

/** Dolaşan sekme durağı: odaktaki satır, yoksa seçili, yoksa pencerenin ilk satırı. */
const tabStop = computed<string | null>(() => {
  const rendered = new Set(visible.value.map((v) => v.row.key))
  for (const key of [focusKey.value, props.selectedId]) {
    if (key && rendered.has(key)) return key
  }
  return visible.value[0]?.row.key ?? null
})

async function focusRow(index: number): Promise<void> {
  const row = props.layout.rows[index]
  if (!row) return
  focusKey.value = row.key
  emit('reveal', index)
  await nextTick()
  const el = [...(root.value?.children ?? [])].find(
    (child) => (child as HTMLElement).dataset.rowKey === row.key,
  ) as HTMLElement | undefined
  el?.focus({ preventScroll: true })
}

const keyboard = useGanttKeyboard({
  rows: () => props.layout.rows,
  pageSize: () => props.pageSize,
  focusRow: (index) => void focusRow(index),
  setGroupOpen: (key, open) => emit('toggle', key, open),
  select: (id) => emit('select', id),
  onDateKey: (request) => (props.dateKeyHandler ? props.dateKeyHandler(request) : false),
})

function onClick(row: GanttRow): void {
  focusKey.value = row.key
  if (row.kind === 'group') emit('toggle', row.key, !row.open)
  else emit('select', row.task.work_item_id)
}

function groupName(row: Extract<GanttRow, { kind: 'group' }>): string {
  return row.name ?? ganttText('timeline.gantt.unknownGroup')
}

function groupLabel(row: Extract<GanttRow, { kind: 'group' }>): string {
  return ganttText('timeline.gantt.groupSummary', {
    name: groupName(row),
    done: row.done,
    total: row.total,
  })
}

function codeOf(row: Extract<GanttRow, { kind: 'task' }>): string {
  const prefix = props.departmentCodes?.get(row.task.department_id)
  return prefix ? `${prefix}-${designStub('BE-005', '—')}` : ''
}
</script>

<template>
  <div
    ref="root"
    class="gantt-rows"
    role="treegrid"
    :aria-label="ganttText('timeline.gantt.label')"
    :aria-rowcount="layout.rows.length"
  >
    <div
      v-for="{ row, index } in visible"
      :key="row.key"
      role="row"
      class="gantt-row"
      :class="[
        `gantt-row--${row.kind}`,
        {
          'is-hover': hover === row.key,
          'is-selected': row.kind === 'task' && row.key === selectedId,
          'is-closed': row.kind === 'group' && !row.open,
        },
      ]"
      :style="{ top: `${row.y}px`, height: `${row.height}px` }"
      :data-row-key="row.key"
      :aria-rowindex="index + 1"
      :aria-level="row.level"
      :aria-expanded="row.kind === 'group' ? row.open : undefined"
      :aria-selected="row.kind === 'task' ? row.key === selectedId : undefined"
      :aria-label="row.kind === 'group' ? groupLabel(row) : undefined"
      :tabindex="row.key === tabStop ? 0 : -1"
      @keydown="keyboard.onKeydown($event, index)"
      @focus="focusKey = row.key"
      @click="onClick(row)"
      @pointerenter="hover = row.key"
      @pointerleave="hover = null"
    >
      <template v-if="row.kind === 'group'">
        <div role="rowheader" class="gantt-row__label">
          <UiIcon name="chevron-down" size="sm" class="gantt-row__chevron" />
          <span class="gantt-row__name">{{ groupName(row) }}</span>
          <span class="gantt-row__count">
            {{ ganttText('timeline.gantt.groupCount', { done: row.done, total: row.total }) }}
          </span>
        </div>
      </template>
      <template v-else>
        <div role="rowheader" class="gantt-row__label">
          <span class="gantt-row__code">{{ codeOf(row) }}</span>
          <span
            class="gantt-dot"
            :class="[
              `gantt-dot--${statusTone(row.task.status)}`,
              { 'gantt-dot--late': isLate(row.task) },
            ]"
            :title="dotTitle(row.task)"
            aria-hidden="true"
          />
          <span class="gantt-row__title">{{ row.task.title }}</span>
        </div>
        <div role="gridcell" class="gantt-sr">
          {{ rowSummary(row.task, layout.dependentIds.has(row.key)) }}
        </div>
      </template>
    </div>
  </div>
</template>
