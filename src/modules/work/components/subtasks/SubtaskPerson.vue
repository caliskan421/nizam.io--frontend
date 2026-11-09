<script setup lang="ts">
import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import type { WorkItem, WorkItemSubtask } from '../../model/types'
import { subtaskText } from './messages'
import { personOptions } from './subtask-format'

/**
 * Kişi yuvası (E-03-33; `rp-subslot` + yerel `select`). Seçenekler yalnız ana göreve
 * atananlar; boş seçenek "Kişi yok" (boş dize → atananı kaldırır). Zorunluluk işareti yok (P5).
 * İyimser değil: seçim `change` yayar, `select` sunucu değerine geri döner; yeni değer yalnız
 * yeniden okunan listeden gelir. Yetkisizde (s.146) salt metin.
 */
const props = defineProps<{
  item: WorkItem
  subtask: WorkItemSubtask
  editable: boolean
  busy: boolean
}>()
const emit = defineEmits<{ change: [accountId: string] }>()

const current = computed(() => props.subtask.assignee_account_id ?? '')
const options = computed(() =>
  personOptions(props.item, props.subtask, subtaskText('subtasks.row.unknownPerson')),
)
const shown = computed(
  () =>
    options.value.find((o) => o.value === current.value)?.label ??
    subtaskText('subtasks.row.personNone'),
)

function onChange(event: Event): void {
  const select = event.target as HTMLSelectElement
  const value = select.value
  select.value = current.value
  if (value !== current.value) emit('change', value)
}
</script>

<template>
  <label v-if="editable" class="rp-subslot" :title="shown">
    <UiIcon name="user" size="sm" />
    <select
      :value="current"
      :aria-label="subtaskText('subtasks.row.person')"
      :disabled="busy"
      data-testid="subtask-person"
      @change="onChange"
    >
      <option value="">{{ subtaskText('subtasks.row.personNone') }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </label>
  <span v-else class="rp-subslot" :title="shown" data-testid="subtask-person-text">
    <UiIcon name="user" size="sm" />
    <span class="rp-trunc">{{ shown }}</span>
  </span>
</template>
