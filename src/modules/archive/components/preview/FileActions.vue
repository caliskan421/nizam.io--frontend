<script setup lang="ts">
import './preview.css'

import { computed, ref, watch } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { DesignStub, UiButton, UiIconButton } from '@/shared/ui'

import { archiveCapabilities } from '../../model/capabilities'
import { MOVE_FILE, RETAG_FILE } from '../../model/stubs'
import type { FileActionsEmits, FileActionsProps } from '../index'
import { previewText } from './messages'
import RenameFileDialog from './RenameFileDialog.vue'
import { useFileActions } from './use-file-actions'

/**
 * W124 · E-06-56…60, 64 — önizleme eylemleri (tasarım `rp-iconrow`): İndir (birincil), Yeniden
 * adlandır, Etiketi değiştir / Başka klasöre taşı (uç yok → devre dışı, designStub BE-074/075,
 * sıfır yazma), Dosyayı sil. Görünürlük yalnız `archiveCapabilities` olgularıyla (mercek
 * yetki değildir — P1): ad değiştirme ŞY ∨ K ∨ (yükleyen ∧ ekip satırı), silme yalnız yükleyen
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
watch(actions.removing, (pending) => emit('removing', pending))

const caps = computed(() => archiveCapabilities(standing.value, store.programId))
const facts = computed(() => ({
  departmentId: props.target.departmentId,
  uploadedByAccountId: props.file.uploaded_by_account_id,
}))
const canDownload = computed(() => caps.value.download())
const canRename = computed(() => caps.value.rename(facts.value))
const canDelete = computed(() => caps.value.delete(facts.value))
const renaming = ref(false)
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
    <DesignStub id="BE-074" data-testid="file-retag-stub">
      <UiIconButton
        icon="tag"
        :label="previewText('archive.actions.retag')"
        :disabled="!RETAG_FILE.available"
        data-testid="file-retag"
      />
    </DesignStub>
    <DesignStub id="BE-075" data-testid="file-move-stub">
      <UiIconButton
        icon="folder-move"
        :label="previewText('archive.actions.move')"
        :disabled="!MOVE_FILE.available"
        data-testid="file-move"
      />
    </DesignStub>
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
  </div>
</template>
