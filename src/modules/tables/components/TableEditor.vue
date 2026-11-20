<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'

import { UiButton } from '@/shared/ui'

import type { StructureKind } from '../model/structure'
import type { TableColumn, TableSnapshot, TableTarget } from '../model/types'
import CellEditForm from './CellEditForm.vue'
import TableGrid from './TableGrid.vue'
import TableStructureForm from './TableStructureForm.vue'

const props = defineProps<{
  target: TableTarget
  snapshot: TableSnapshot
  locked: boolean
  reload: () => Promise<boolean>
}>()
const emit = defineEmits<{ deleted: []; open: [boolean]; reordered: []; locked: [] }>()
const optedIn = defineModel<boolean>('optedIn', { required: true })
const message = ref('')
const role = computed(() =>
  props.snapshot.table.access_source ? undefined : props.snapshot.table.effective_role,
)
const owner = computed(() => role.value === 'owner')
const editor = computed(() => role.value === 'editor')
const editing = computed(() => !props.locked && (owner.value || (editor.value && optedIn.value)))
const cell = shallowRef<{ rowId: string; column: TableColumn } | null>(null)
const action = ref<StructureKind | null>(null)
const showingPanel = computed(() => cell.value !== null || action.value !== null)

function selectCell(rowId: string, column: TableColumn) {
  if (!editing.value || showingPanel.value) return
  cell.value = { rowId, column }
  message.value = ''
  emit('open', true)
}

function selectAction(kind: StructureKind) {
  if (!editing.value || showingPanel.value) return
  action.value = kind
  message.value = ''
  emit('open', true)
}

async function closePanel() {
  cell.value = null
  action.value = null
  emit('open', false)
  await nextTick()
  document.getElementById('tables-edit-control')?.focus()
}

watch(role, () => {
  optedIn.value = false
  if (showingPanel.value) void closePanel()
})

function lock() {
  emit('locked')
  optedIn.value = false
  void closePanel()
}

function savedCell() {
  message.value = 'Hücre kaydedildi.'
  void closePanel()
}

function savedStructure(kind: StructureKind) {
  message.value = 'Tablo güncellendi.'
  void closePanel()
  if (kind === 'delete_table') emit('deleted')
  else if (kind === 'move_row' || kind === 'delete_row' || kind === 'add_row') emit('reordered')
}
</script>

<template>
  <div class="tables-actions">
    <span v-if="!editing" class="tables-chip">Salt okunur</span>
    <span v-if="owner" class="tables-chip">Sahip</span>
    <UiButton
      v-if="editor && !locked"
      id="tables-edit-control"
      size="sm"
      :disabled="showingPanel"
      @click="optedIn = !optedIn"
    >
      {{ optedIn ? 'Görüntülemeye dön' : 'Düzenlemek istiyorum' }}
    </UiButton>
    <template v-if="editing">
      <UiButton
        :id="owner ? 'tables-edit-control' : undefined"
        size="sm"
        variant="primary"
        :disabled="showingPanel"
        @click="selectAction('add_column')"
        >Sütun ekle</UiButton
      >
      <UiButton size="sm" :disabled="showingPanel" @click="selectAction('add_row')"
        >Satır ekle</UiButton
      >
      <UiButton size="sm" :disabled="showingPanel" @click="selectAction('rename_table')"
        >Tabloyu düzenle</UiButton
      >
    </template>
  </div>
  <p v-if="optedIn && !owner" class="tables-muted">Yazma yetkisi her kayıt sırasında denetlenir.</p>
  <p v-if="locked" class="tables-notice" role="status">
    Düzenleme kapatıldı. Bu tabloda yaptığınız işleme izin verilmedi.
  </p>
  <p v-else-if="message" class="tables-notice" role="status">{{ message }}</p>
  <CellEditForm
    v-if="cell"
    :snapshot="snapshot"
    :target="target"
    :row-id="cell.rowId"
    :column="cell.column"
    :reload="reload"
    @close="closePanel"
    @locked="lock"
    @saved="savedCell"
  />
  <TableStructureForm
    v-if="action"
    :snapshot="snapshot"
    :target="target"
    :initial="action"
    :owner="owner"
    :reload="reload"
    @close="closePanel"
    @locked="lock"
    @saved="savedStructure"
  />
  <TableGrid :snapshot="snapshot" :editing="editing && !showingPanel" @edit="selectCell" />
</template>
