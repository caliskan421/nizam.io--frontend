<script setup lang="ts">
import { computed, ref, shallowRef, useId, watch } from 'vue'

import { ARCHIVE_TAGS, TAG_LABELS, type ArchiveTag } from '@/modules/archive/public'
import { targetOf, useAttachFile, type WorkItem } from '@/modules/work/public'
import type { MutationOutcome } from '@/shared/http/mutation'
import { UiButton, UiField, UiModal, UiSelect, useToast } from '@/shared/ui'
import { outcomeText, UiOutcomeNotice } from '@/shared/ui/confirm'

import { homeText } from '../../model/messages'

/**
 * "Kanıt yükle" penceresi (E-Ü1-03/13/19; P3, P35: ortak bileşenlerle en sade): görev seçici
 * (bana atananlar), zorunlu etiket (kapalı küme, varsayılan yok) ve dosya. `attachFile`
 * multipart (bilet yok); `Idempotency-Key` "Yükle" başına; "sonuç bilinmiyor"da dosya + etiket
 * korunur, yeniden gönderme aynı anahtarla (`UiOutcomeNotice`). Yükleme görev durumunu
 * DEĞİŞTİRMEZ. "En çok 90 MB" çizilmez (sözleşmede sınır yok). `preset` verilirse görev sabit
 * seçilidir (satır eylemi / `work.attachment_required`).
 */
const props = defineProps<{ items: readonly WorkItem[]; preset: string | null }>()
const open = defineModel<boolean>('open', { default: false })

type Outcome = MutationOutcome<unknown, unknown, unknown>

const attach = useAttachFile()
const toast = useToast()
const formId = `u1-upload-${useId()}`
const taskId = ref('')
const tag = ref('')
const file = shallowRef<File | null>(null)
const tried = ref(false)
const outcome = shallowRef<Outcome | null>(null)
const input = ref<HTMLInputElement | null>(null)

const taskOptions = computed(() =>
  props.items.map((i) => ({ value: i.work_item_id, label: i.title })),
)
const tagOptions = ARCHIVE_TAGS.map((t) => ({ value: t, label: TAG_LABELS[t] }))
const selected = computed(() => props.items.find((i) => i.work_item_id === taskId.value) ?? null)
const pending = attach.isPending

const taskError = computed(() =>
  tried.value && !selected.value ? homeText('home.u1.dialog.required') : undefined,
)
const tagError = computed(() =>
  tried.value && !ARCHIVE_TAGS.includes(tag.value as ArchiveTag)
    ? homeText('home.u1.dialog.required')
    : undefined,
)
const fileError = computed(() =>
  tried.value && !file.value ? homeText('home.u1.dialog.required') : undefined,
)
const inlineError = computed(() => {
  const o = outcome.value
  if (!o || o.kind === 'success' || o.kind === 'unknown_outcome' || o.kind === 'edit_conflict') {
    return null
  }
  return outcomeText(o)
})

watch(open, (isOpen) => {
  if (!isOpen) return
  taskId.value = props.preset ?? ''
  tag.value = ''
  file.value = null
  tried.value = false
  outcome.value = null
  attach.reset()
  if (input.value) input.value.value = ''
})

function finish(result: Outcome): void {
  if (result.kind === 'success') {
    toast.push({ message: homeText('home.u1.dialog.uploaded') })
    open.value = false
    return
  }
  outcome.value = result
}

async function submit(): Promise<void> {
  tried.value = true
  const item = selected.value
  const chosen = file.value
  if (!item || !chosen || !ARCHIVE_TAGS.includes(tag.value as ArchiveTag) || pending.value) return
  outcome.value = null
  finish(
    await attach.submit({
      target: targetOf(item),
      workItemId: item.work_item_id,
      file: chosen,
      tag: tag.value as ArchiveTag,
    }),
  )
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="homeText('home.u1.dialog.uploadTitle')"
    :dismissible="!pending"
  >
    <div class="role-home-dialog">
      <p v-if="items.length === 0" class="rh-region-empty" data-empty>
        {{ homeText('home.u1.dialog.noTasks') }}
      </p>
      <form v-else :id="formId" class="rh-form" novalidate @submit.prevent="submit">
        <UiField :label="homeText('home.u1.dialog.task')" :error="taskError">
          <UiSelect
            v-model="taskId"
            data-testid="u1-upload-task"
            :options="taskOptions"
            :placeholder="homeText('home.u1.dialog.taskPlaceholder')"
            :disabled="pending || preset !== null"
          />
        </UiField>
        <UiField :label="homeText('home.u1.dialog.tag')" :error="tagError">
          <UiSelect
            v-model="tag"
            data-testid="u1-upload-tag"
            :options="tagOptions"
            :placeholder="homeText('home.u1.dialog.tag')"
            :disabled="pending"
          />
        </UiField>
        <UiField :label="homeText('home.u1.dialog.file')" :error="fileError">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              ref="input"
              type="file"
              data-testid="u1-upload-file"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
              :disabled="pending"
              @change="file = ($event.target as HTMLInputElement).files?.[0] ?? null"
            />
          </template>
        </UiField>
        <p v-if="inlineError" class="rh-error" role="alert" data-testid="u1-upload-error">
          {{ inlineError }}
        </p>
        <UiOutcomeNotice :outcome="outcome" @resolved="(o) => finish(o as Outcome)" />
      </form>
    </div>
    <template #footer>
      <UiButton :disabled="pending" data-testid="u1-upload-cancel" @click="open = false">
        {{ homeText('home.u1.dialog.cancel') }}
      </UiButton>
      <UiButton
        v-if="items.length > 0"
        variant="primary"
        type="submit"
        :form="formId"
        icon="file-upload"
        :disabled="pending"
        data-testid="u1-upload-submit"
      >
        {{ homeText('home.u1.dialog.uploadSubmit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
