<script setup lang="ts">
import './files.css'

import { computed, ref } from 'vue'

import { UiIcon } from '@/shared/ui'

import { useWorkItemFiles } from '../../api'
import { targetOf } from '../../model/target'
import type { SubtaskFileSlotProps } from '../index'
import FileUploadDialog from './FileUploadDialog.vue'
import { filesText } from './messages'
import { filesOfSubtask, slotLabel } from './model'
import { useFileAccess } from './use-file-access'
import { useFileActions } from './use-file-actions'

/**
 * W46 · E-03-35 — alt görev satırındaki kanıt yuvası (`rp-subslot`, dosya simgesi).
 *  - Dosya adı `listWorkItemFiles` içinde `subtask_id` eşleşenlerden (panel "Dosyalar"
 *    sekmesiyle AYNI sorgu / anahtar; satır başına ek istek yok). Birden çoksa "ad +n".
 *  - Dosya varsa tık son dosyayı indirir (bilet akışı); yoksa yükleme yetkisinde (s.148;
 *    yönetici her durumda gizli) "Kanıt yükle" → etiket seçicili pencere `subtask_id` ile;
 *    yetkisizde salt "Kanıt yok". Zorunluluk işareti (`data-req`/`data-miss`) yok (BE-006, P5).
 */
const props = defineProps<SubtaskFileSlotProps>()
// İki kök (yuva + pencere): çağıranın sınıf/öznitelikleri yuvaya.
defineOptions({ inheritAttrs: false })

const files = useWorkItemFiles(
  () => props.item.work_item_id,
  () => targetOf(props.item),
)
const access = useFileAccess(() => props.item)
const attached = computed(() =>
  filesOfSubtask(files.data.value?.files ?? [], props.subtask.subtask_id),
)
const latest = computed(() => attached.value[attached.value.length - 1] ?? null)
const label = computed(() => slotLabel(attached.value))
const actions = useFileActions(
  () => props.item,
  () => latest.value ?? { file_id: '', display_name: '' },
)
const uploadOpen = ref(false)

const mode = computed<'file' | 'upload' | 'none'>(() => {
  if (latest.value) return 'file'
  return access.canUpload.value ? 'upload' : 'none'
})
const text = computed(() => {
  if (mode.value === 'file') return label.value ?? ''
  if (files.isPending.value) return filesText('workFiles.slot.loading')
  return filesText(mode.value === 'upload' ? 'workFiles.slot.upload' : 'workFiles.slot.none')
})
const tip = computed(() => {
  if (mode.value !== 'file' || !latest.value) return text.value
  return filesText('workFiles.row.downloadOf', { name: latest.value.display_name })
})

function activate(): void {
  if (mode.value === 'file') void actions.download()
  else if (mode.value === 'upload') uploadOpen.value = true
}
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    class="wf-subslot"
    data-testid="subtask-file-slot"
    :data-mode="mode"
    :title="tip"
    :aria-label="tip"
    :disabled="mode === 'none' || actions.busy.value"
    @click="activate"
  >
    <UiIcon :name="mode === 'upload' ? 'file-upload' : 'file'" size="sm" />
    <span class="rp-trunc">{{ text }}</span>
  </button>
  <FileUploadDialog
    v-if="mode !== 'none'"
    v-model:open="uploadOpen"
    :item="item"
    :subtask-id="subtask.subtask_id"
  />
</template>
