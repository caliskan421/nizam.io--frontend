<script setup lang="ts">
import './preview.css'

import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import { ownerLife, type MutationOutcome } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiField, UiModal, UiSelect, useToast } from '@/shared/ui'
import { notifyOutcome, UiOutcomeNotice } from '@/shared/ui/confirm'

import { useMoveArchiveFile } from '../../api/writes'
import type { FileRecord } from '../../model/types'
import type { MoveFileDialogEmits, MoveFileDialogProps } from '../index'
import { useSubtaskOptions } from '../upload/use-subtask-options'
import { moveErrorField, targetRejected } from './move'
import { previewText } from './messages'
import { useMoveTargets } from './use-move-targets'

/**
 * W194 · E-06-59 — "Başka göreve taşı" penceresi (P3: ortak modal + form). `moveFile` (RECORDS-K46):
 * hedef AYNI programdaki GÖREV (+ isteğe bağlı o görevin alt görevi; görev değişince sıfırlanır).
 * Başlıklar KAYNAK dosyanındır (`target`); hedef departman seçmek kapsamı değiştirmez. Anahtarsız:
 * sonuç bilinmiyorsa kör tekrar yok (`UiOutcomeNotice`). Hedef görünmüyor/dolu hataları hedef
 * alanında, diğerleri pencere altında; sunucu `message` ve istemci sayı yok. İyimser kaldırma yok:
 * başarı yalnız sunucu yanıtıyla, dönen kaydın GERÇEK adıyla bildirilir. `moving` sonuç teslimine
 * dek önizleme sahibini açık tutar; kapsam/dosya değişince pencere kapanır, geç sonuç sessizdir.
 */
const props = defineProps<MoveFileDialogProps>()
const emit = defineEmits<MoveFileDialogEmits>()

const move = useMoveArchiveFile()
const store = useScopeStore()
// Kurulumda alınır: sökülmüş pencerenin geç sonucu bildirim üretmez (KESİN 26a).
const toast = useToast()
const owner = ownerLife()
const targets = useMoveTargets(() => props.open)

type Outcome = MutationOutcome<unknown, FileRecord, unknown>
const taskId = ref('')
const subtaskId = ref('')
const tried = ref(false)
const lost = ref(false)
const running = ref(false)
const outcome = shallowRef<Outcome | null>(null)
// Kapsam/dosya değişince artar: önceki kapsamın geç sonucu bildirim/kapanış üretmez.
let generation = 0

const selected = computed(() => targets.candidates.value.find((t) => t.workItemId === taskId.value))
const subtaskTarget = computed(() => {
  const task = selected.value
  return store.snapshot.programId !== null && task
    ? { programId: store.snapshot.programId, departmentId: task.departmentId }
    : null
})
const subtasks = useSubtaskOptions(() => selected.value?.workItemId ?? null, subtaskTarget)
const taskOptions = computed(() =>
  targets.candidates.value.map((t) => ({ value: t.workItemId, label: t.title })),
)

function reset(): void {
  taskId.value = ''
  subtaskId.value = ''
  tried.value = false
  lost.value = false
  outcome.value = null
}
watch(
  () => props.open,
  (isOpen) => isOpen && reset(),
  { immediate: true },
)
watch(taskId, () => (subtaskId.value = ''))
// Seçili hedef yenilenen listeden düştü (silindi/atama kalktı): seçim kaybolur, kullanıcı bilgilenir.
watch(targets.candidates, (list) => {
  if (taskId.value !== '' && !list.some((t) => t.workItemId === taskId.value)) {
    taskId.value = ''
    lost.value = true
  }
})
const stopScope = store.onChange(() => {
  generation++
  emit('update:open', false)
})
watch(
  () => props.file.file_id,
  () => {
    generation++
    emit('update:open', false)
  },
)
watch(running, (value) => emit('moving', value))
onBeforeUnmount(() => {
  stopScope()
  if (running.value) emit('moving', false)
})

function pickTask(value: string): void {
  taskId.value = value
  lost.value = false
  outcome.value = null
}

const serverField = computed(() => {
  const o = outcome.value
  return o?.kind === 'failed' ? { field: moveErrorField(o.error), text: errorText(o.error) } : null
})
const taskError = computed(() => {
  const o = outcome.value
  if (o?.kind === 'failed' && moveErrorField(o.error) === 'task') {
    return targetRejected(o.error)
      ? previewText('archive.actions.moveTargetInvalid')
      : errorText(o.error)
  }
  if (lost.value) return previewText('archive.actions.moveTargetInvalid')
  if (tried.value && !selected.value) return previewText('archive.actions.moveTaskRequired')
  return undefined
})
const subtaskError = computed(() =>
  serverField.value?.field === 'subtask' ? serverField.value.text : undefined,
)
const taskHint = computed(() => {
  if (targets.failed.value) return previewText('archive.actions.moveTaskError')
  if (targets.loading.value) return previewText('archive.actions.moveTaskLoading')
  if (targets.candidates.value.length === 0) return previewText('archive.actions.moveTaskNone')
  return targets.truncated.value ? previewText('archive.actions.moveTaskTruncated') : undefined
})
const inlineError = computed(() =>
  serverField.value && serverField.value.field === null ? serverField.value.text : null,
)
const showNotice = computed(
  () => outcome.value?.kind === 'unknown_outcome' || outcome.value?.kind === 'edit_conflict',
)

function close(): void {
  if (!running.value) emit('update:open', false)
}

function deliver(result: Outcome, title: string, token: number): void {
  if (!owner.alive() || token !== generation) return
  outcome.value = result
  if (result.kind === 'success') {
    const name = result.data.display_name
    toast.push({
      message:
        name === props.file.display_name
          ? previewText('archive.actions.moved', { task: title })
          : previewText('archive.actions.movedRenamed', { task: title, name }),
    })
    emit('moved', props.file.file_id)
    emit('update:open', false)
    return
  }
  if (result.kind === 'failed') {
    if (targetRejected(result.error)) taskId.value = ''
    else if (moveErrorField(result.error) === 'subtask') subtaskId.value = ''
    return
  }
  if (!['unknown_outcome', 'edit_conflict'].includes(result.kind)) notifyOutcome(result)
}

async function submit(): Promise<void> {
  tried.value = true
  const task = selected.value
  if (running.value || !task) return
  const title = task.title || previewText('archive.actions.moveFallbackTask')
  const token = generation
  outcome.value = null
  running.value = true
  try {
    const result = await move.submit({
      target: props.target,
      workItemId: props.file.work_item_id,
      fileId: props.file.file_id,
      targetWorkItemId: task.workItemId,
      ...(subtaskId.value ? { targetSubtaskId: subtaskId.value } : {}),
    })
    deliver(result, title, token)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <UiModal
    :open="open"
    :title="previewText('archive.actions.moveTitle')"
    :description="previewText('archive.actions.moveDescription')"
    :dismissible="!running"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <form id="af-move" class="af-form" novalidate @submit.prevent="submit">
      <UiField
        :label="previewText('archive.actions.moveTaskLabel')"
        :hint="taskHint"
        :error="taskError"
      >
        <UiSelect
          :model-value="taskId"
          data-testid="move-task"
          :options="taskOptions"
          :placeholder="previewText('archive.actions.moveTaskPlaceholder')"
          :disabled="running || taskOptions.length === 0"
          @update:model-value="pickTask"
        />
      </UiField>
      <UiField
        :label="previewText('archive.actions.moveSubtaskLabel')"
        :hint="
          subtasks.unavailable.value
            ? previewText('archive.actions.moveSubtaskUnavailable')
            : subtasks.loading.value
              ? previewText('archive.actions.moveSubtaskLoading')
              : undefined
        "
        :error="subtaskError"
      >
        <UiSelect
          v-model="subtaskId"
          data-testid="move-subtask"
          :options="subtasks.options.value"
          :disabled="running || !selected"
        />
      </UiField>
      <p v-if="inlineError" class="af-error" role="alert" data-testid="move-error">
        {{ inlineError }}
      </p>
      <UiOutcomeNotice
        v-if="showNotice"
        :outcome="outcome"
        @resolved="(o) => deliver(o as Outcome, '', generation)"
      />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="running" data-testid="move-cancel" @click="close">
        {{ previewText('archive.actions.moveCancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="af-move"
        :disabled="running"
        data-testid="move-submit"
      >
        {{ previewText('archive.actions.moveSubmit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
