<script setup lang="ts">
import './preview.css'

import { computed, ref, watch } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiIconButton } from '@/shared/ui'

import { archiveCapabilities } from '../../model/capabilities'
import type { FileActionsEmits, FileActionsProps } from '../index'
import { previewText } from './messages'
import MoveFileDialog from './MoveFileDialog.vue'
import RenameFileDialog from './RenameFileDialog.vue'
import RetagMenu from './RetagMenu.vue'
import { useFileActions } from './use-file-actions'

/**
 * W124 · E-06-56…60, 64 — önizleme eylemleri (tasarım `rp-iconrow`): İndir (birincil), Yeniden
 * adlandır, Etiketi değiştir (`retagFile`, BE-074; `RetagMenu`), Başka göreve taşı (`moveFile`,
 * RECORDS-K46; `MoveFileDialog`, kaynakta yeniden adlandırma yetkisiyle görünür), Dosyayı sil. Görünürlük yalnız `archiveCapabilities` olgularıyla (mercek
 * yetki değildir — P1): ad ve etiket değiştirme ŞY ∨ K ∨ (yükleyen ∧ ekip satırı), silme yalnız yükleyen
 * ∧ (ŞY ∨ ekip satırı); yetkisiz eylem GİZLİ (gizleme güvenlik değildir, sunucu 403/404 verir).
 * `RenameFileDialog` burada bağlıdır (`FilePreview` → `FileActions` → `RenameFileDialog`).
 */
const props = defineProps<FileActionsProps>()
const emit = defineEmits<FileActionsEmits>()

const store = useScopeStore()
const { standing } = useStanding()
const actions = useFileActions(
  () => props.file,
  () => props.target,
  (fileId) => emit('deleted', fileId),
)

// Silme uçuştayken sayfa paneli açık tutar: yenilenen liste dosyayı düşürse de sonuç bildirimi
// sahibine ulaşır (KESİN 26a: sökülmüş sahip bildirim üretmez; burada sökülen biz değiliz).
const moving = ref(false)
watch([actions.removing, moving], ([deleting, relocating]) =>
  emit('removing', deleting || relocating),
)

const caps = computed(() => archiveCapabilities(standing.value, store.programId))
const facts = computed(() => ({
  departmentId: props.target.departmentId,
  uploadedByAccountId: props.file.uploaded_by_account_id,
}))
const canDownload = computed(() => caps.value.download())
const canRename = computed(() => caps.value.rename(facts.value))
const canRetag = computed(() => caps.value.retag(facts.value))
const canMove = computed(() => caps.value.move(facts.value))
const canDelete = computed(() => caps.value.delete(facts.value))
const renaming = ref(false)
const relocating = ref(false)
</script>

<template>
  <div class="af-row" role="group" :aria-label="previewText('archive.actions.label')">
    <UiButton
      v-if="canDownload"
      variant="primary"
      icon="download"
      :disabled="actions.busy.value"
      data-testid="file-download"
      @click="actions.startDownload"
    >
      {{
        actions.downloading.value
          ? previewText('archive.actions.downloading')
          : previewText('archive.actions.download')
      }}
    </UiButton>
    <UiIconButton
      v-if="canRename"
      icon="edit"
      :label="previewText('archive.actions.rename')"
      :disabled="actions.busy.value"
      data-testid="file-rename"
      @click="renaming = true"
    />
    <RetagMenu
      v-if="canRetag"
      :current="file.tag"
      :busy="actions.busy.value"
      @select="actions.startRetag"
    />
    <UiIconButton
      v-if="canMove"
      icon="folder-move"
      :label="previewText('archive.actions.move')"
      :disabled="actions.busy.value"
      data-testid="file-move"
      @click="relocating = true"
    />
    <UiIconButton
      v-if="canDelete"
      icon="trash"
      tone="danger"
      :label="previewText('archive.actions.remove')"
      :disabled="actions.busy.value"
      data-testid="file-delete"
      @click="actions.startRemove"
    />
    <RenameFileDialog
      v-if="canRename"
      v-model:open="renaming"
      :file="file"
      :target="target"
      @renamed="(fileId: string) => emit('renamed', fileId)"
    />
    <MoveFileDialog
      v-if="canMove"
      v-model:open="relocating"
      :file="file"
      :target="target"
      @moving="(pending: boolean) => (moving = pending)"
      @moved="(fileId: string) => emit('moved', fileId)"
    />
  </div>
</template>
