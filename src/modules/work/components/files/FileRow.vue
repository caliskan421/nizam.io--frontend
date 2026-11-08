<script setup lang="ts">
import './files.css'

import { computed, nextTick, ref, shallowRef } from 'vue'

import { UiButton, UiField, UiIcon, UiIconButton, UiInput } from '@/shared/ui'
import { outcomeText, UiOutcomeNotice } from '@/shared/ui/confirm'

import type { WorkItem, WorkItemFile } from '../../model/types'
import { filesText } from './messages'
import { formatFileSize, normalizedName, tagLabel, uploaderName } from './model'
import { useFileActions, type RenameOutcome } from './use-file-actions'

/**
 * W46 · E-03-61 — "Dosyalar" sekmesinde tek dosya satırı: ad, etiket · boyut · yükleyen
 * (· alt göreve bağlı), indir (bilet), ad değiştir (s.149; 409 `records.name_taken` alanın
 * altında), sil (s.150; kalıcı → istemci onayı). Görünürlük çağırandan (`canRename`,
 * `canDelete`); yetkisiz eylem gizli. İyimser güncelleme yok: ad, yeniden okunan listeden.
 */
const props = defineProps<{
  item: WorkItem
  file: WorkItemFile
  canRename: boolean
  canDelete: boolean
}>()

const actions = useFileActions(
  () => props.item,
  () => props.file,
)
const editing = ref(false)
const draft = ref('')
const tried = ref(false)
const outcome = shallowRef<RenameOutcome | null>(null)
const root = ref<HTMLElement | null>(null)

const meta = computed(() => {
  const parts = [
    tagLabel(props.file.tag),
    formatFileSize(props.file.size_bytes),
    uploaderName(props.file),
  ]
  if (props.file.subtask_id) parts.push(filesText('workFiles.subtaskLinked'))
  return parts.join(' · ')
})
const nameError = computed(() => {
  if (tried.value && normalizedName(draft.value) === null) {
    return filesText('workFiles.row.nameRequired')
  }
  const o = outcome.value
  if (!o || o.kind === 'success' || o.kind === 'unknown_outcome' || o.kind === 'edit_conflict') {
    return undefined
  }
  return outcomeText(o)
})

async function startEdit(): Promise<void> {
  draft.value = props.file.display_name
  tried.value = false
  outcome.value = null
  editing.value = true
  await nextTick()
  root.value?.querySelector('input')?.focus()
}

function settle(result: RenameOutcome): void {
  if (result.kind === 'success') {
    editing.value = false
    outcome.value = null
    return
  }
  outcome.value = result
}

async function save(): Promise<void> {
  tried.value = true
  const name = normalizedName(draft.value)
  if (name === null || actions.renaming.value) return
  if (name === props.file.display_name) {
    editing.value = false
    return
  }
  outcome.value = null
  settle(await actions.renameTo(name))
}
</script>

<template>
  <li ref="root" class="wf-row" data-testid="file-row" :data-file-id="file.file_id">
    <UiIcon name="file" size="sm" />
    <div class="wf-row__main">
      <template v-if="!editing">
        <span class="wf-row__name rp-trunc" :title="file.display_name">{{
          file.display_name
        }}</span>
        <span class="wf-row__meta rp-trunc">{{ meta }}</span>
      </template>
      <form v-else class="wf-form" novalidate data-testid="rename-form" @submit.prevent="save">
        <UiField :label="filesText('workFiles.row.name')" :error="nameError">
          <UiInput v-model="draft" size="sm" data-testid="rename-input" />
        </UiField>
        <UiOutcomeNotice :outcome="outcome" @resolved="settle" />
        <div class="wf-actions">
          <UiButton
            size="sm"
            variant="primary"
            type="submit"
            data-testid="rename-save"
            :disabled="actions.renaming.value"
          >
            {{ filesText('workFiles.row.save') }}
          </UiButton>
          <UiButton size="sm" :disabled="actions.renaming.value" @click="editing = false">
            {{ filesText('workFiles.row.cancel') }}
          </UiButton>
        </div>
      </form>
    </div>
    <div v-if="!editing" class="wf-row__actions">
      <UiButton
        size="sm"
        variant="ghost"
        data-testid="file-download"
        :aria-label="filesText('workFiles.row.downloadOf', { name: file.display_name })"
        :disabled="actions.busy.value"
        @click="actions.download"
      >
        {{ filesText('workFiles.row.download') }}
      </UiButton>
      <UiButton
        v-if="canRename"
        size="sm"
        variant="ghost"
        data-testid="file-rename"
        :aria-label="filesText('workFiles.row.renameOf', { name: file.display_name })"
        :disabled="actions.busy.value"
        @click="startEdit"
      >
        {{ filesText('workFiles.row.rename') }}
      </UiButton>
      <UiIconButton
        v-if="canDelete"
        icon="trash"
        tone="danger"
        data-testid="file-delete"
        :label="filesText('workFiles.row.removeOf', { name: file.display_name })"
        :disabled="actions.busy.value"
        @click="actions.remove"
      />
    </div>
  </li>
</template>
