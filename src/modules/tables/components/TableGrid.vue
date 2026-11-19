<script setup lang="ts">
import { computed } from 'vue'

import type { components } from '@/shared/api/schema'

import type { TableSnapshot } from '../model/types'

const props = defineProps<{ snapshot: TableSnapshot }>()
type Cell = components['schemas']['TableCell']
type Column = components['schemas']['TableColumn']

const references = {
  table_reference: 'tables',
  person_reference: 'people',
  department_reference: 'departments',
  task_reference: 'tasks',
  file_reference: 'files',
} as const
const primitive = new Set(['text', 'number', 'phone', 'email', 'date', 'checkbox'])
const columns = computed(() =>
  props.snapshot.columns.filter(
    (column) =>
      primitive.has(column.type) ||
      column.type === 'attachment' ||
      Object.hasOwn(references, column.type),
  ),
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
    return { id: column.id, labels: labels(column, cell), hidden: cell?.redacted === true }
  })
}
</script>

<template>
  <div><span class="tables-chip">Salt okunur</span></div>
  <div
    v-if="snapshot.rows.length && columns.length"
    class="tables-grid"
    role="region"
    aria-label="Tablo satırları"
    tabindex="0"
  >
    <table :aria-label="snapshot.table.name">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.id" scope="col">{{ column.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in snapshot.rows" :key="row.id">
          <td v-for="cell in cellsFor(row.id)" :key="cell.id">
            <span v-if="cell.labels.length">{{ cell.labels.join(' · ') }}</span>
            <span v-if="cell.hidden" class="tables-chip">Erişilemeyen bağlantı</span>
            <span v-if="!cell.labels.length && !cell.hidden" class="tables-muted">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="tables-empty">
    {{ columns.length ? 'Henüz satır yok.' : 'Gösterilecek sütun yok.' }}
  </p>
</template>
