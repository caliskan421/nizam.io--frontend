<script setup lang="ts">
import './upload.css'

import { computed, nextTick, ref, shallowRef, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { errorText } from '@/shared/i18n'
import { reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { focusFirstInvalid, UiButton, UiField, UiHint, UiModal, UiSelect } from '@/shared/ui'
import { outcomeText, UiOutcomeNotice } from '@/shared/ui/confirm'

import { useAttachArchiveFile } from '../../api/writes'
import { archiveCapabilities } from '../../model/capabilities'
import { ARCHIVE_TAGS, isArchiveTag, TAG_LABELS } from '../../model/tags'
import type { FileRecord } from '../../model/types'
import type { UploadDialogEmits, UploadDialogProps } from '../index'
import { errorField, type UploadField } from './model'
import UploadDropZone from './UploadDropZone.vue'
import { useSubtaskOptions } from './use-subtask-options'

/**
 * W125 · E-06-05/35/62 — görev seçtiren yükleme penceresi (P35; pencere çizilmemiş → P3 ile
 * `shared/ui` modal + form). Görev listesi yalnız yükleme yetkili görevlerdir (`upload`
 * capability; sunucu yine denetler). Etiket ZORUNLU, varsayılan yok (P34 sözlüğü). Alt görev
 * yalnız seçili görevin `listWorkItemSubtasks` okumasıyla. `attachFile`: eylem başına anahtar,
 * belirsizlikte aynı anahtarla TEK tekrar (`UiOutcomeNotice`). `fetch` yükleme bayt ilerlemesi
 * vermez → ilerleme durumu belirsiz (indeterminate). Sökülmüş sahipte geç sonuç UI başlatmaz.
 */
const props = withDefaults(defineProps<UploadDialogProps>(), { defaultTaskId: null })
const emit = defineEmits<UploadDialogEmits>()

type Outcome = MutationOutcome<unknown, FileRecord, unknown>

const { t } = useI18n()
const store = useScopeStore()
const { standing } = useStanding()
const attach = useAttachArchiveFile()
const pending = attach.isPending
const formId = `au-form-${useId()}`

const open = ref(true)
const taskId = ref('')
const tag = ref('')
const subtaskId = ref('')
const file = shallowRef<File | null>(null)
const extraDropped = ref(false)
const tried = ref(false)
const outcome = shallowRef<Outcome | null>(null)

const allowed = computed(() => {
  const caps = archiveCapabilities(standing.value, store.snapshot.programId)
  return props.tasks.filter((task) => caps.upload(task.departmentId))
})
const selected = computed(() => allowed.value.find((task) => task.workItemId === taskId.value))
const target = computed(() => {
  const programId = store.snapshot.programId
  const task = selected.value
  return programId !== null && task ? { programId, departmentId: task.departmentId } : null
})

watch(
  allowed,
  (list) => {
    if (taskId.value !== '' && !list.some((task) => task.workItemId === taskId.value)) {
      taskId.value = ''
    }
    if (taskId.value === '' && props.defaultTaskId) {
      if (list.some((task) => task.workItemId === props.defaultTaskId)) {
        taskId.value = props.defaultTaskId
      }
    }
  },
  { immediate: true },
)
watch(taskId, () => {
  subtaskId.value = ''
})
// Sunucu hatası, ilgili alan değişince temizlenir.
watch([taskId, tag, file], () => {
  if (outcome.value?.kind === 'failed') outcome.value = null
})

const subtasks = useSubtaskOptions(() => selected.value?.workItemId ?? null, target)
const taskOptions = computed(() =>
  allowed.value.map((task) => ({ value: task.workItemId, label: task.title })),
)
const tagOptions = computed(() =>
  ARCHIVE_TAGS.map((value) => ({ value, label: TAG_LABELS[value] })),
)

const serverField = computed<{ field: UploadField; text: string } | null>(() => {
  const o = outcome.value
  if (o?.kind !== 'failed') return null
  const field = errorField(o.error.code)
  return field ? { field, text: errorText(o.error) } : null
})
const fieldError = (field: UploadField, missing: boolean, text: string) =>
  tried.value && missing
    ? text
    : serverField.value?.field === field
      ? serverField.value.text
      : undefined
const taskError = computed(() =>
  fieldError('task', !selected.value, t('archive.upload.task.required')),
)
const tagError = computed(() =>
  fieldError('tag', !isArchiveTag(tag.value), t('archive.upload.tag.required')),
)
const fileError = computed(() => fieldError('file', !file.value, t('archive.upload.file.required')))
const inlineError = computed(() => {
  const o = outcome.value
  if (!o || o.kind === 'success' || o.kind === 'unknown_outcome' || o.kind === 'edit_conflict') {
    return null
  }
  return serverField.value ? null : outcomeText(o)
})

function close(): void {
  if (pending.value) return
  emit('close')
}

function settle(result: Outcome): void {
  // Sahip sökülmüşse (geç sonuç) ekrana özgü akış başlamaz.
  if (!reachesOwner(result)) return
  if (result.kind === 'success') {
    emit('uploaded', result.data.file_id)
    emit('close')
    return
  }
  outcome.value = result
  void nextTick(() => focusFirstInvalid())
}

async function submit(): Promise<void> {
  tried.value = true
  const task = selected.value
  const where = target.value
  const chosen = file.value
  const chosenTag = tag.value
  if (!task || !where || !chosen || !isArchiveTag(chosenTag) || pending.value) {
    await nextTick()
    focusFirstInvalid()
    return
  }
  outcome.value = null
  settle(
    await attach.submit({
      target: where,
      workItemId: task.workItemId,
      file: chosen,
      tag: chosenTag,
      ...(subtaskId.value ? { subtaskId: subtaskId.value } : {}),
    }),
  )
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="t('archive.upload.title')"
    :description="t('archive.upload.description')"
    :dismissible="!pending"
    @close="close"
  >
    <form :id="formId" class="au-form" novalidate @submit.prevent="submit">
      <UiField
        :label="t('archive.upload.task.label')"
        :hint="allowed.length === 0 ? t('archive.upload.task.none') : t('archive.upload.task.hint')"
        :error="taskError"
      >
        <UiSelect
          v-model="taskId"
          data-testid="upload-task"
          :options="taskOptions"
          :placeholder="t('archive.upload.task.placeholder')"
          :disabled="pending || allowed.length === 0"
        />
      </UiField>
      <UiField :label="t('archive.upload.tag.label')" :error="tagError">
        <UiSelect
          v-model="tag"
          data-testid="upload-tag"
          :options="tagOptions"
          :placeholder="t('archive.upload.tag.placeholder')"
          :disabled="pending"
        />
      </UiField>
      <UiField
        :label="t('archive.upload.subtask.label')"
        :hint="
          subtasks.unavailable.value
            ? t('archive.upload.subtask.unavailable')
            : subtasks.loading.value
              ? t('archive.upload.subtask.loading')
              : undefined
        "
      >
        <UiSelect
          v-model="subtaskId"
          data-testid="upload-subtask"
          :options="subtasks.options.value"
          :disabled="pending || !selected"
        />
      </UiField>
      <UiField :label="t('archive.upload.file.label')" :error="fileError">
        <template #default="{ id, describedBy, invalid }">
          <UploadDropZone
            :id="id"
            :file="file"
            :disabled="pending"
            :invalid="invalid"
            :described-by="describedBy"
            @update:file="(value) => (file = value)"
            @extra="(value) => (extraDropped = value)"
          />
        </template>
      </UiField>
      <UiHint v-if="extraDropped">{{ t('archive.upload.file.firstOnly') }}</UiHint>
      <p v-if="pending" class="au-progress" role="status" data-testid="upload-progress">
        <progress class="au-progress__bar" :aria-label="t('archive.upload.progress')" />
        {{ t('archive.upload.progress') }}
      </p>
      <p v-if="inlineError" class="au-error" role="alert" data-testid="upload-error">
        {{ inlineError }}
      </p>
      <UiOutcomeNotice :outcome="outcome" @resolved="(o) => settle(o as Outcome)" />
    </form>
    <template #footer>
      <UiButton :disabled="pending" data-testid="upload-cancel" @click="close">
        {{ t('archive.upload.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        :form="formId"
        icon="file-upload"
        data-testid="upload-submit"
        :disabled="pending"
      >
        {{ t('archive.upload.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
