<script setup lang="ts">
import { ref } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { UiErrorState } from '@/shared/ui'
import { ConflictDialog } from '@/shared/ui/conflict'

import type { WorkItem, WorkItemSubtask } from '../../model/types'
import SubtaskAdd from './SubtaskAdd.vue'
import SubtaskRow from './SubtaskRow.vue'
import { subtaskText } from './messages'
import type { SubtaskPop } from './subtask-format'
import { useSubtaskEdit } from './use-subtask-edit'
import { useSubtaskList } from './use-subtask-list'

/**
 * Alt görev satırları + ekle satırı + çakışma diyaloğu; blok ve panel sekmesinin ORTAK gövdesi
 * (aynı sorgu `useWorkItemSubtasks`). Aynı anda tek açılır (tarih ya da menü; koordinatör
 * kabulü). Eylem görünürlüğü `capabilities.ts` (s.146 yönet, s.147 kapat/aç).
 */
const props = defineProps<{ item: WorkItem; variant: 'block' | 'panel' }>()
const emit = defineEmits<{ open: [] }>()

const list = useSubtaskList(() => props.item)
const edit = useSubtaskEdit({
  item: () => props.item,
  target: () => list.target.value,
  reload: () => list.query.refetch(),
})
const pop = ref<{ id: string; kind: SubtaskPop } | null>(null)

function popOf(subtask: WorkItemSubtask): SubtaskPop | null {
  return pop.value?.id === subtask.subtask_id ? pop.value.kind : null
}

function setPop(subtask: WorkItemSubtask, kind: SubtaskPop | null): void {
  if (kind) pop.value = { id: subtask.subtask_id, kind }
  else if (pop.value?.id === subtask.subtask_id) pop.value = null
}
</script>

<template>
  <p v-if="list.query.isPending.value" class="rp-cap" role="status">
    {{ subtaskText('subtasks.loading') }}
  </p>
  <UiErrorState
    v-else-if="list.query.isError.value"
    :error="toApiError(list.query.error.value)"
    retryable
    :retrying="list.query.isFetching.value"
    @retry="list.query.refetch()"
  />
  <template v-else>
    <SubtaskRow
      v-for="s in list.subtasks.value"
      :key="s.subtask_id"
      :item="item"
      :subtask="s"
      :variant="variant"
      :can-manage="list.canManage.value"
      :can-toggle="list.canToggle(s)"
      :pending="edit.isPending(s.subtask_id)"
      :pop="popOf(s)"
      @toggle="edit.toggle(s)"
      @open="emit('open')"
      @patch="edit.patch(s, $event)"
      @remove="edit.remove(s)"
      @pop="setPop(s, $event)"
    />
    <p
      v-if="list.subtasks.value.length === 0 && !list.canManage.value"
      class="rp-cap"
      data-testid="subtasks-empty"
    >
      {{ subtaskText('subtasks.empty') }}
    </p>
  </template>
  <SubtaskAdd v-if="list.canManage.value && list.loaded.value" :item="item" :variant="variant" />
  <ConflictDialog
    v-model:open="edit.conflict.open.value"
    :fields="edit.conflict.fields.value"
    @resolve="edit.conflict.choose"
    @cancel="edit.conflict.dismiss"
  />
</template>
