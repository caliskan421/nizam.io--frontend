<script setup lang="ts">
import './files.css'

import { computed, ref, shallowRef, useId, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { UiButton, UiField, UiModal, UiSelect } from '@/shared/ui'
import { outcomeText, UiOutcomeNotice } from '@/shared/ui/confirm'

import { useAttachFile } from '../../api'
import { targetOf } from '../../model/target'
import type { AttachFileInput, FileRecord } from '../../model/types'
import type { FileUploadDialogEmits, FileUploadDialogProps } from '../index'
import { filesText } from './messages'
import { isFileTag, tagOptions } from './model'

/**
 * W46 · E-03-52, E-03-35 — dosya / kanıt yükleme penceresi (P3: `shared/ui` ile en sade).
 * `attachFile` doğrudan multipart (bilet yok); etiket kapalı kümeden ZORUNLU (P5, varsayılan
 * yok); `subtaskId` verilirse `subtask_id` sorgusu. `Idempotency-Key` "Yükle" başına üretilir
 * (pencere açılışında değil); "sonuç bilinmiyor"da dosya + etiket korunur, yeniden gönderme
 * aynı anahtarla (`UiOutcomeNotice`). Yükleme görev durumunu DEĞİŞTİRMEZ (durum yalnız
 * geçiş uçlarıyla). Görünürlük (s.148) açan bileşenin işidir; sunucu yine denetler.
 */
const props = defineProps<FileUploadDialogProps>()
const emit = defineEmits<FileUploadDialogEmits>()

type Outcome = MutationOutcome<AttachFileInput, FileRecord>

const attach = useAttachFile()
const pending = attach.isPending
const formId = `wf-upload-${useId()}`
const file = shallowRef<File | null>(null)
const tag = ref('')
const tried = ref(false)
const outcome = shallowRef<Outcome | null>(null)
const input = ref<HTMLInputElement | null>(null)

const title = computed(() =>
  filesText(props.subtaskId ? 'workFiles.upload.subtask' : 'workFiles.upload.task'),
)
const fileError = computed(() =>
  tried.value && !file.value ? filesText('workFiles.upload.fileRequired') : undefined,
)
const tagError = computed(() =>
  tried.value && !isFileTag(tag.value) ? filesText('workFiles.upload.tagRequired') : undefined,
)
const inlineError = computed(() => {
  const o = outcome.value
  if (!o || o.kind === 'success' || o.kind === 'unknown_outcome' || o.kind === 'edit_conflict') {
    return null
  }
  return outcomeText(o)
})
const options = tagOptions()

function reset(): void {
  file.value = null
  tag.value = ''
  tried.value = false
  outcome.value = null
  attach.reset()
  if (input.value) input.value.value = ''
}

watch(
  () => props.open,
  (open) => {
    if (open) reset()
  },
)

function close(): void {
  if (pending.value) return
  emit('update:open', false)
}

function onFile(event: Event): void {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

function settle(result: Outcome): void {
  if (result.kind === 'success') {
    emit('uploaded', result.data)
    emit('update:open', false)
    return
  }
  outcome.value = result
}

async function submit(): Promise<void> {
  tried.value = true
  const chosen = file.value
  const value = tag.value
  if (!chosen || !isFileTag(value) || pending.value) return
  outcome.value = null
  settle(
    await attach.submit({
      target: targetOf(props.item),
      workItemId: props.item.work_item_id,
      file: chosen,
      tag: value,
      ...(props.subtaskId ? { subtaskId: props.subtaskId } : {}),
    }),
  )
}
</script>

<template>
  <UiModal
    :open="open"
    :title="title"
    :description="filesText('workFiles.upload.description')"
    :dismissible="!pending"
    @update:open="(value) => !value && close()"
  >
    <form :id="formId" class="wf-form" novalidate @submit.prevent="submit">
      <UiField :label="filesText('workFiles.upload.file')" :error="fileError">
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            ref="input"
            class="wf-file"
            type="file"
            data-testid="upload-file"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            :disabled="pending"
            @change="onFile"
          />
        </template>
      </UiField>
      <UiField :label="filesText('workFiles.upload.tag')" :error="tagError">
        <UiSelect
          v-model="tag"
          data-testid="upload-tag"
          :options="options"
          :placeholder="filesText('workFiles.upload.tagPlaceholder')"
          :disabled="pending"
        />
      </UiField>
      <p v-if="inlineError" class="wf-error" role="alert" data-testid="upload-error">
        {{ inlineError }}
      </p>
      <UiOutcomeNotice :outcome="outcome" @resolved="(o) => settle(o as Outcome)" />
    </form>
    <template #footer>
      <UiButton :disabled="pending" data-testid="upload-cancel" @click="close">
        {{ filesText('workFiles.upload.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        :form="formId"
        icon="file-upload"
        data-testid="upload-submit"
        :disabled="pending"
      >
        {{ filesText('workFiles.upload.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
