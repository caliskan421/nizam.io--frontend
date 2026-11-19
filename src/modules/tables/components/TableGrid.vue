<script setup lang="ts">
import { computed } from 'vue'

import { isBasicCell } from '../model/cell-value'
import type { TableCell as Cell, TableColumn as Column, TableSnapshot } from '../model/types'

const props = defineProps<{ snapshot: TableSnapshot; editing: boolean }>()
defineEmits<{ edit: [rowId: string, column: Column] }>()

const references = {
  table_reference: 'tables',
  person_reference: 'people',
  department_reference: 'departments',
  task_reference: 'tasks',
  file_reference: 'files',
} as const
const columns = computed(() =>
  props.snapshot.columns.filter(
    (column) =>
      isBasicCell(column.type) ||
      column.type === 'attachment' ||
      Object.hasOwn(references, column.type),
  ),
)
function columnWidth(column: Column) {
  return Number.isInteger(column.width) && column.width >= 40 && column.width <= 1200
    ? column.width
    : 160
}

const gridWidth = computed(() =>
  columns.value.reduce((total, column) => total + columnWidth(column), 0),
)
const byRow = computed(() => {
  const rows = new Map<string, Map<string, Cell>>()
  for (const cell of props.snapshot.cells) {
    const cells = rows.get(cell.row_id) ?? new Map()
    cells.set(cell.column_id, cell)
    rows.set(cell.row_id, cells)
  }
  return rows
})

function visibleLabels(value: Cell['value'], names: Record<string, string> | undefined) {
  if (!names) return []
  const ids = Array.isArray(value) ? value : [value]
  return ids.flatMap((id) =>
    typeof id === 'string' && Object.hasOwn(names, id) ? [names[id]!] : [],
  )
}

function attachmentLabels(value: Cell['value']) {
  if (typeof value !== 'string') return []
  const attachments = props.snapshot.attachments
  if (!attachments || !Object.hasOwn(attachments, value)) return []
  return [attachments[value]!.name]
}

function labels(column: Column, cell: Cell | undefined): string[] {
  if (!cell) return []
  const { value } = cell
  if (column.type === 'attachment') {
    return attachmentLabels(value)
  }
  if (Object.hasOwn(references, column.type)) {
    const kind = references[column.type as keyof typeof references]
    const names = props.snapshot.references?.[kind]
    return visibleLabels(value, names)
  }
  if (typeof value === 'boolean') return [value ? 'Evet' : 'Hayır']
  return value === null || Array.isArray(value) ? [] : [String(value)]
}

function cellsFor(row: string) {
  return columns.value.map((column) => {
    const cell = byRow.value.get(row)?.get(column.id)
    return { column, labels: labels(column, cell), hidden: cell?.redacted === true }
  })
}
</script>

<template>
  <div
    v-if="snapshot.rows.length && columns.length"
    class="tables-grid"
    role="region"
    aria-label="Tablo satırları"
    tabindex="0"
  >
    <table
      :aria-label="snapshot.table.name"
      :style="{ width: `calc(var(--space-10) + ${gridWidth}px)` }"
    >
      <colgroup>
        <col class="tables-row-track" />
        <col
          v-for="column in columns"
          :key="column.id"
          :style="{ width: columnWidth(column) + 'px' }"
        />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th v-for="column in columns" :key="column.id" scope="col">{{ column.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in snapshot.rows" :key="row.id">
          <th class="tables-row-number" scope="row">{{ index + 1 }}</th>
          <td v-for="cell in cellsFor(row.id)" :key="cell.column.id">
            <button
              v-if="editing && isBasicCell(cell.column.type)"
              class="tables-cell-button"
              type="button"
              :aria-label="`${index + 1}. satır, ${cell.column.name}: ${cell.labels.join(' · ') || 'Boş'} · Düzenle`"
              @click="$emit('edit', row.id, cell.column)"
            >
              {{ cell.labels.join(' · ') || '—' }}
            </button>
            <template v-else>
              <span v-if="cell.labels.length">{{ cell.labels.join(' · ') }}</span>
              <span v-if="cell.hidden" class="tables-chip">Erişilemeyen bağlantı</span>
              <span v-if="!cell.labels.length && !cell.hidden" class="tables-muted">—</span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="tables-empty">
    {{ columns.length ? 'Henüz satır yok.' : 'Gösterilecek sütun yok.' }}
  </p>
</template>
