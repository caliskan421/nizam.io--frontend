<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, shallowRef, watch } from 'vue'

import { UiButton } from '@/shared/ui'

import { useTableOperation } from '../composables/use-table-operation'
import { CELL_TYPES, isBasicCell, type BasicCellType } from '../model/cell-value'
import {
  needsConfirmation,
  STRUCTURE_LABELS,
  structureCommand,
  usesColumn,
  usesName,
  usesOrder,
  usesRow,
  usesWidth,
  validStructure,
  type StructureDraft,
  type StructureKind,
} from '../model/structure'
import type { TableSnapshot, TableTarget, TableWrite } from '../model/types'
import TableOperationNotice from './TableOperationNotice.vue'

const props = defineProps<{
  target: TableTarget
  snapshot: TableSnapshot
  initial: StructureKind
  owner: boolean
  reload: () => Promise<boolean>
}>()
const emit = defineEmits<{ close: []; locked: []; saved: [kind: StructureKind] }>()
const draft = reactive<StructureDraft>({
  kind: props.initial,
  id: '',
  after: '',
  name: '',
  width: '160',
  type: 'text',
})
const baseline = ref(props.snapshot.table.schema_version)
const firstField = ref<HTMLSelectElement | null>(null)
const confirm = ref(false)
const reviewed = ref(false)
const invalid = ref('')
const pending = shallowRef<TableWrite | null>(null)
const actions = computed(() =>
  (Object.keys(STRUCTURE_LABELS) as StructureKind[]).filter(
    (kind) => kind !== 'delete_table' || props.owner,
  ),
)
const selectedColumn = computed(() =>
  props.snapshot.columns.find((column) => column.id === draft.id),
)
const columns = computed(() =>
  draft.kind === 'convert_column'
    ? props.snapshot.columns.filter((column) => isBasicCell(column.type))
    : props.snapshot.columns,
)
const rows = computed(() =>
  props.snapshot.rows.map((row, index) => ({
    id: row.id,
    name: `Bu görünümdeki ${index + 1}. satır`,
  })),
)
const targets = computed(() => (usesColumn(draft.kind) ? columns.value : rows.value))
const destinationTypes = computed<readonly BasicCellType[]>(() => {
  const basic = Object.keys(CELL_TYPES) as BasicCellType[]
  if (draft.kind !== 'convert_column') return basic
  return selectedColumn.value?.type === 'text' ? basic.filter((kind) => kind !== 'text') : ['text']
})
const valid = computed(() => {
  if (draft.kind === 'delete_table' && !props.owner) return false
  if (
    draft.kind === 'convert_column' &&
    (!selectedColumn.value ||
      !isBasicCell(selectedColumn.value.type) ||
      !destinationTypes.value.includes(draft.type))
  )
    return false
  return (
    validStructure(draft, props.snapshot) &&
    ((!usesColumn(draft.kind) && draft.kind !== 'add_column') ||
      (Number.isSafeInteger(baseline.value) && baseline.value > 0))
  )
})
const { busy, message, conflict, uncertain, retry, reset, run, reload } = useTableOperation({
  scope: () => props.target,
  denied: () => emit('locked'),
  success: () => emit('saved', draft.kind),
  reload: props.reload,
})

onMounted(() => firstField.value?.focus())
watch(
  () => draft.kind,
  (kind) => {
    draft.id = ''
    draft.after = ''
    draft.name = kind === 'rename_table' ? props.snapshot.table.name : ''
    draft.width = '160'
    draft.type = 'text'
    confirm.value = false
    invalid.value = ''
    reviewed.value = false
    baseline.value = props.snapshot.table.schema_version
    reset()
  },
  { immediate: true },
)
watch(
  () => draft.id,
  () => {
    draft.after = ''
    if (draft.kind === 'rename_column') draft.name = selectedColumn.value?.name ?? ''
    if (draft.kind === 'resize_column') draft.width = String(selectedColumn.value?.width ?? 160)
    if (draft.kind === 'convert_column') draft.type = destinationTypes.value[0] ?? 'text'
  },
)

watch(draft, () => {
  confirm.value = false
})
const confirmationText = computed(() => {
  switch (draft.kind) {
    case 'delete_table':
      return 'Tablo listeden kalkar ve paylaşılan bağlantıları artık açılmaz.'
    case 'delete_row':
      return 'Satır, hücreleri ve satıra bağlı yorumları kaldırılır.'
    case 'delete_column':
      return 'Sütunun hücreleri ve hücre yorumları kaldırılır.'
    default:
      return 'Dönüşüm bütün sütuna uygulanır. Bir değer dönüştürülemezse hiçbir hücre değişmez.'
  }
})

async function readCurrent() {
  if (!(await reload()) || uncertain.value) return
  await nextTick()
  baseline.value = props.snapshot.table.schema_version
  reviewed.value = true
  confirm.value = false
}

async function submit() {
  if (busy.value || conflict.value || uncertain.value) return
  if (!valid.value) {
    invalid.value = 'İşlem için gerekli alanları ve seçili kaydı kontrol edin.'
    return
  }
  invalid.value = ''
  if (needsConfirmation(draft.kind) && !confirm.value) {
    confirm.value = true
    return
  }
  const operation = {
    tableID: props.snapshot.table.id,
    command: structureCommand(draft, baseline.value),
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
    @keydown.esc.prevent="!busy && $emit('close')"
  >
    <h2>Tabloyu düzenle</h2>
    <fieldset class="tables-fields" :disabled="busy || conflict || uncertain">
      <label class="tables-field"
        >İşlem
        <select ref="firstField" v-model="draft.kind" class="t-select">
          <option v-for="kind in actions" :key="kind" :value="kind">
            {{ STRUCTURE_LABELS[kind] }}
          </option>
        </select>
      </label>
      <label v-if="usesColumn(draft.kind) || usesRow(draft.kind)" class="tables-field">
        {{ usesColumn(draft.kind) ? 'Sütun' : 'Satır' }}
        <select v-model="draft.id" class="t-select">
          <option value="">Seçin</option>
          <option v-for="item in targets" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <label v-if="usesOrder(draft.kind)" class="tables-field"
        >Konum
        <select v-model="draft.after" class="t-select">
          <option value="">Tablonun başı</option>
          <option
            v-for="item in targets.filter((option) => option.id !== draft.id)"
            :key="item.id"
            :value="item.id"
          >
            {{ item.name }} sonrasına
          </option>
        </select>
      </label>
      <label v-if="usesName(draft.kind)" class="tables-field"
        >Ad
        <input v-model="draft.name" class="t-input" />
      </label>
      <label v-if="usesWidth(draft.kind)" class="tables-field"
        >Sütun genişliği
        <input v-model="draft.width" inputmode="numeric" class="t-input" />
      </label>
      <label
        v-if="draft.kind === 'add_column' || draft.kind === 'convert_column'"
        class="tables-field"
        >Sütun tipi
        <select v-model="draft.type" class="t-select">
          <option v-for="kind in destinationTypes" :key="kind" :value="kind">
            {{ CELL_TYPES[kind] }}
          </option>
        </select>
      </label>
    </fieldset>
    <p v-if="reviewed" class="tables-notice">
      Güncel tablo okundu. Seçiminizi gözden geçirip yeniden onaylayın.
    </p>
    <p v-if="confirm" class="tables-notice" role="status">{{ confirmationText }}</p>
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
      <UiButton variant="ghost" :disabled="busy" @click="$emit('close')">Kapat</UiButton>
      <UiButton
        :variant="confirm && draft.kind.startsWith('delete_') ? 'danger' : 'primary'"
        type="submit"
        :disabled="busy || conflict || uncertain"
      >
        {{ confirm ? 'Onayla' : STRUCTURE_LABELS[draft.kind] }}
      </UiButton>
    </div>
  </form>
</template>
