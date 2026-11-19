<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'

import { UiButton } from '@/shared/ui'

import { useTableOperation } from '../composables/use-table-operation'
import { CELL_TYPES, cellInput, cellText, isBasicCell } from '../model/cell-value'
import type { TableColumn, TableSnapshot, TableTarget, TableWrite } from '../model/types'
import TableOperationNotice from './TableOperationNotice.vue'

const props = defineProps<{
  target: TableTarget
  snapshot: TableSnapshot
  column: TableColumn
  rowId: string
  reload: () => Promise<boolean>
}>()
const emit = defineEmits<{ close: []; locked: []; saved: [] }>()
const initial = currentCell()
const raw = ref(initial?.value == null ? '' : String(initial.value))
const baseline = ref(initial?.version ?? 0)
const comparison = ref<string | null>(null)
const invalid = ref('')
const unavailable = computed(
  () =>
    !props.snapshot.rows.some((row) => row.id === props.rowId) ||
    props.snapshot.columns.find((column) => column.id === props.column.id)?.type !==
      props.column.type,
)
const pending = shallowRef<TableWrite | null>(null)
const inputId = 'table-cell-draft'
const valueInput = ref<HTMLInputElement | null>(null)
const inputType = computed(() => {
  const kind = props.column.type
  if (kind === 'phone') return 'tel'
  return kind === 'date' || kind === 'email' ? kind : 'text'
})

onMounted(() => document.getElementById(inputId)?.focus())
const { busy, canClose, message, conflict, uncertain, retry, reload, run } = useTableOperation({
  scope: () => props.target,
  denied: () => emit('locked'),
  success: () => emit('saved'),
  reload: props.reload,
})

function currentCell() {
  return props.snapshot.cells.find(
    (cell) => cell.row_id === props.rowId && cell.column_id === props.column.id,
  )
}

async function readCurrent() {
  if (!(await reload()) || uncertain.value) return
  await nextTick()
  const cell = currentCell()
  baseline.value = cell?.version ?? 0
  comparison.value = cellText(cell?.value)
}

async function submit() {
  const type = props.column.type
  if (busy.value || conflict.value || uncertain.value || unavailable.value || !isBasicCell(type))
    return
  if (!Number.isSafeInteger(baseline.value)) {
    invalid.value = 'Bu hücrenin sürümü güvenli biçimde düzenlenemiyor.'
    return
  }
  if (type === 'date' && valueInput.value?.validity.badInput) {
    invalid.value = 'Tarihi tamamlayın veya alanı tamamen temizleyin.'
    return
  }
  const input = cellInput(type, raw.value)
  if (input.error !== undefined) {
    invalid.value = input.error
    return
  }
  invalid.value = ''
  const operation: TableWrite = {
    tableID: props.snapshot.table.id,
    command: {
      kind: 'set_cells',
      cells: [
        {
          row_id: props.rowId,
          column_id: props.column.id,
          version: baseline.value,
          value: input.value,
        },
      ],
    },
    ...(input.decimal !== undefined ? { decimal: input.decimal } : {}),
  }
  pending.value = operation
  await run(operation)
}

function sendAgain() {
  if (pending.value && retry.value) void run(pending.value, retry.value)
}
</script>

<template>
  <form
    class="t-card tables-create"
    @submit.prevent="submit"
    @keydown.esc.prevent="canClose && $emit('close')"
  >
    <h2>{{ column.name }} · Hücreyi düzenle</h2>
    <p v-if="unavailable" class="tables-notice" role="status">
      Hücrenin satırı veya tipi değişti. Girdinizi buradan kopyalayabilirsiniz.
    </p>
    <p v-else-if="comparison !== null" class="tables-notice">
      Güncel değer: <strong>{{ comparison }}</strong>
    </p>
    <label class="tables-field" :for="inputId">
      {{ isBasicCell(column.type) ? CELL_TYPES[column.type] : 'Hücre değeri' }}
      <select
        v-if="column.type === 'checkbox'"
        :id="inputId"
        v-model="raw"
        class="t-select"
        :disabled="busy || uncertain"
      >
        <option value="">Boş</option>
        <option value="true">Evet</option>
        <option value="false">Hayır</option>
      </select>
      <textarea
        v-else-if="column.type === 'text'"
        :id="inputId"
        v-model="raw"
        class="t-input tables-textarea"
        :readonly="busy || uncertain"
        rows="3"
      />
      <input
        v-else
        :id="inputId"
        ref="valueInput"
        v-model="raw"
        class="t-input"
        :type="inputType"
        :inputmode="column.type === 'number' ? 'decimal' : undefined"
        :readonly="busy || uncertain"
      />
    </label>
    <p v-if="invalid" role="alert">{{ invalid }}</p>
    <TableOperationNotice
      :message="message"
      :busy="busy"
      :conflict="conflict"
      :uncertain="uncertain"
      :retryable="!!retry"
      @reload="readCurrent"
      @retry="sendAgain"
    />
    <div class="tables-actions">
      <UiButton variant="ghost" :disabled="!canClose" @click="$emit('close')">{{
        comparison !== null ? 'Güncel değeri kullan' : 'Kapat'
      }}</UiButton>
      <UiButton
        variant="primary"
        type="submit"
        :disabled="busy || conflict || uncertain || unavailable"
        >{{ comparison !== null ? 'Düzenlememi uygula' : 'Kaydet' }}</UiButton
      >
    </div>
  </form>
</template>
