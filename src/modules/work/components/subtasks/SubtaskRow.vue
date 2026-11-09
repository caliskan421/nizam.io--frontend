<script setup lang="ts">
import { nextTick, ref } from 'vue'

import { UiCheck } from '@/shared/ui'

import SubtaskFileSlot from '../files/SubtaskFileSlot.vue'
import type { UpdateSubtaskBody, WorkItem, WorkItemSubtask } from '../../model/types'
import SubtaskDates from './SubtaskDates.vue'
import SubtaskMenu from './SubtaskMenu.vue'
import SubtaskPerson from './SubtaskPerson.vue'
import { subtaskText } from './messages'
import type { SubtaskPop } from './subtask-format'

/**
 * Tek alt görev satırı. `block` (satır içi, `rp-stask`: kutu · başlık · kişi · tarih · kanıt ·
 * menü) ve `panel` (sekme, `rp-dsub`: kutu · başlık · menü, altında kişi · tarih) aynı satırdır.
 *  - Kutu (E-03-31; s.147): tık İYİMSER DEĞİL — varsayılan engellenir, `toggle` yayılır; kutu
 *    yeni değeri yalnız yeniden okunan listeden alır, istek sürerken devre dışı (bekleme).
 *  - Başlık (E-03-32): blokta üst görevin paneline ("Alt görevler" sekmesi) bağlantı; menüden
 *    "Başlığı düzenle" yerinde giriş (Enter kaydeder, Esc / odak kaybı vazgeçer).
 *  - Kanıt yuvası (E-03-35) `SubtaskFileSlot` (W46), yalnız blokta.
 */
const props = defineProps<{
  item: WorkItem
  subtask: WorkItemSubtask
  variant: 'block' | 'panel'
  canManage: boolean
  canToggle: boolean
  pending: boolean
  pop: SubtaskPop | null
}>()
const emit = defineEmits<{
  toggle: []
  open: []
  patch: [changes: UpdateSubtaskBody]
  remove: []
  pop: [value: SubtaskPop | null]
}>()

const editing = ref(false)
const titleDraft = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

function onToggle(): void {
  if (!props.pending) emit('toggle')
}

function startRename(): void {
  titleDraft.value = props.subtask.title
  editing.value = true
  void nextTick(() => titleInput.value?.focus())
}

function saveTitle(): void {
  const title = titleDraft.value.trim()
  editing.value = false
  if (title !== '' && title !== props.subtask.title) emit('patch', { title })
}

function setPop(kind: SubtaskPop, open: boolean): void {
  emit('pop', open ? kind : null)
}
</script>

<template>
  <div
    :class="variant === 'block' ? 'rp-stask' : 'rp-dsub'"
    :data-done="subtask.done ? 'true' : 'false'"
    :data-testid="`subtask-${subtask.subtask_id}`"
  >
    <span class="sub-check" :data-pending="pending ? 'true' : 'false'">
      <UiCheck
        v-if="canToggle"
        :model-value="subtask.done"
        :label="subtaskText('subtasks.row.done', { title: subtask.title })"
        :disabled="pending"
        :aria-busy="pending ? 'true' : undefined"
        data-testid="subtask-done"
        @click.prevent="onToggle"
      />
    </span>
    <input
      v-if="editing"
      ref="titleInput"
      v-model="titleDraft"
      class="rp-stask__input"
      type="text"
      maxlength="300"
      :aria-label="subtaskText('subtasks.row.titleInput')"
      data-testid="subtask-title-input"
      @keydown.enter.prevent="saveTitle"
      @keydown.esc.stop.prevent="editing = false"
      @blur="editing = false"
    />
    <button
      v-else-if="variant === 'block'"
      type="button"
      class="rp-stask__title"
      :title="subtaskText('subtasks.row.open')"
      data-testid="subtask-title"
      @click="emit('open')"
    >
      <span class="rp-strike">{{ subtask.title }}</span>
    </button>
    <span v-else class="rp-dsub__t" :title="subtask.title" data-testid="subtask-title">
      <span class="rp-strike">{{ subtask.title }}</span>
    </span>
    <div class="sub-slots">
      <SubtaskPerson
        :item="item"
        :subtask="subtask"
        :editable="canManage"
        :busy="pending"
        @change="emit('patch', { assignee_account_id: $event })"
      />
      <SubtaskDates
        :subtask="subtask"
        :editable="canManage"
        :open="pop === 'date'"
        :busy="pending"
        @open="setPop('date', $event)"
        @save="emit('patch', $event)"
      />
      <div v-if="variant === 'block'" class="sub-cell">
        <SubtaskFileSlot :item="item" :subtask="subtask" />
      </div>
    </div>
    <SubtaskMenu
      v-if="canManage"
      :title="subtask.title"
      :open="pop === 'menu'"
      :busy="pending"
      @open="setPop('menu', $event)"
      @rename="startRename"
      @remove="emit('remove')"
    />
    <span v-else class="sub-menu" aria-hidden="true" />
  </div>
</template>
