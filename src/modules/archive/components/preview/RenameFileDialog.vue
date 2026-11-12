<script setup lang="ts">
import './preview.css'

import { computed, ref, shallowRef, watch } from 'vue'

import { errorText } from '@/shared/i18n'
import type { MutationOutcome } from '@/shared/http/mutation'
import { UiButton, UiField, UiInput, UiModal, useToast } from '@/shared/ui'
import { notifyOutcome, UiOutcomeNotice } from '@/shared/ui/confirm'

import { useRenameArchiveFile } from '../../api/writes'
import type { RenameFileDialogEmits, RenameFileDialogProps } from '../index'
import { previewText } from './messages'
import { MAX_FILE_NAME, validateFileName } from './rename'

/**
 * W124 · E-06-57/64 — yeniden adlandırma penceresi (P3: tek alanlı en sade pencere, ortak
 * form). Anahtarsız `renameFile` (son yazan kazanır): boş ad/150 karakter aşımı istemcide
 * reddedilir; 422 `records.name_invalid` ve 409 `records.name_taken`/`records.moved` TEK alan
 * bildirimi olarak adın altında gösterilir (sunucu `message` yok); sonuç bilinmiyorsa kör
 * tekrar yok — yazma katmanı listeyi yeniden okur, pencere sonucu bildirir. 429 gibi yerinde
 * gösterilmeyen sonuçlar ortak bildirimle (`notifyOutcome`) duyurulur. İstek sürerken
 * pencere kapatılamaz; odak kapanınca tetikleyiciye döner (`UiModal`).
 */
const props = defineProps<RenameFileDialogProps>()
const emit = defineEmits<RenameFileDialogEmits>()

const rename = useRenameArchiveFile()
// Kurulumda alınır: sökülmüş pencerenin geç sonucu bildirim üretmez (KESİN 26a).
const toast = useToast()

const draft = ref('')
const tried = ref(false)
type Outcome = MutationOutcome<unknown, unknown, unknown>
const outcome = shallowRef<Outcome | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    draft.value = props.file.display_name
    tried.value = false
    outcome.value = null
  },
  { immediate: true },
)

const pending = computed(() => rename.isPending.value)

const fieldError = computed(() => {
  const invalid = validateFileName(draft.value)
  if (tried.value && invalid === 'required') return previewText('archive.actions.renameRequired')
  if (invalid === 'too_long') {
    return previewText('archive.actions.renameTooLong', { max: MAX_FILE_NAME })
  }
  const o = outcome.value
  if (o?.kind === 'failed') return errorText(o.error)
  return undefined
})

function close(): void {
  if (!pending.value) emit('update:open', false)
}

function settle(result: Outcome): void {
  outcome.value = result
  if (result.kind === 'success') {
    toast.push({ message: previewText('archive.actions.renamed') })
    emit('update:open', false)
    emit('renamed', props.file.file_id)
    return
  }
  // Alanda/yerinde gösterilmeyen sınıflar (429 `rate_limited`, `conflict_retry`, `scope_changed`…)
  // sessiz kalmaz: ortak bildirim (sahibi sökülmüş sonuç `notifyOutcome` içinde elenir).
  if (!['failed', 'unknown_outcome', 'edit_conflict'].includes(result.kind)) notifyOutcome(result)
}

async function submit(): Promise<void> {
  tried.value = true
  if (pending.value || validateFileName(draft.value) !== null) return
  const name = draft.value.trim()
  if (name === props.file.display_name) {
    emit('update:open', false)
    return
  }
  outcome.value = null
  settle(
    await rename.submit({
      target: props.target,
      workItemId: props.file.work_item_id,
      fileId: props.file.file_id,
      displayName: name,
    }),
  )
}

/** Yalnız alan bildirimi olmayan sonuçlar (sonuç bilinmiyor / çakışma) pencere altında çizilir. */
const showNotice = computed(
  () => outcome.value?.kind === 'unknown_outcome' || outcome.value?.kind === 'edit_conflict',
)
</script>

<template>
  <UiModal
    :open="open"
    :title="previewText('archive.actions.renameTitle')"
    :description="previewText('archive.actions.renameDescription')"
    :dismissible="!pending"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <form id="af-rename" class="af-form" novalidate @submit.prevent="submit">
      <UiField :label="previewText('archive.actions.renameLabel')" :error="fieldError">
        <UiInput v-model="draft" name="display_name" data-testid="rename-input" />
      </UiField>
      <UiOutcomeNotice v-if="showNotice" :outcome="outcome" @resolved="settle" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" data-testid="rename-cancel" @click="close">
        {{ previewText('archive.actions.renameCancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="af-rename"
        :disabled="pending"
        data-testid="rename-submit"
      >
        {{ previewText('archive.actions.renameSave') }}
      </UiButton>
    </template>
  </UiModal>
</template>
