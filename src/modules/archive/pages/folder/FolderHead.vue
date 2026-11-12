<script setup lang="ts">
import './folder.css'

import { computed, ref, type ComponentPublicInstance } from 'vue'

import { DesignStub, UiButton, UiIcon } from '@/shared/ui'

import { FolderZipButton } from '../../components'
import { folderText } from '../../components/files/messages'
import type { ArchiveFolder, ArchiveTarget } from '../../model/types'

/**
 * Klasör başlığı (E-06-31…35): ad, meta (görev klasörü ve dosya sayısı canlı; kişi adları gizli,
 * bayt toplamı statik `—` — BE-025; "çalışma grubu" rozeti yok — P39), klasör ZIP'i (W126) ve
 * "Yükle" (W125 penceresini sayfa açar). Eylemler yalnız yetkili olana çizilir (K1).
 */
const props = defineProps<{
  folder: Pick<ArchiveFolder, 'folder_id' | 'name' | 'is_virtual' | 'file_count'> | null
  target: ArchiveTarget | null
  taskCount: number | null
  tasksTruncated: boolean
  canZip: boolean
  canUpload: boolean
}>()
const emit = defineEmits<{ upload: [] }>()
const uploadButton = ref<ComponentPublicInstance | null>(null)

/** Yükleme penceresi kapanınca odak tetikleyiciye döner (KESİN 27). */
defineExpose({
  focusUpload: () => (uploadButton.value?.$el as HTMLElement | undefined)?.focus(),
})

const taskMeta = computed(() => {
  if (props.taskCount === null) return null
  return folderText(props.tasksTruncated ? 'folder.meta.tasksMore' : 'folder.meta.tasks', {
    n: props.taskCount,
  })
})
const fileMeta = computed(() =>
  props.folder ? folderText('folder.meta.files', { n: props.folder.file_count }) : null,
)
const meta = computed(() =>
  [taskMeta.value, fileMeta.value].filter((part) => part !== null).join(' · '),
)
</script>

<template>
  <div class="arch-head" data-testid="folder-head">
    <UiIcon name="archive" size="lg" class="arch-head__icon" />
    <div class="arch-head__text">
      <h1 v-if="folder" class="arch-head__title">{{ folder.name }}</h1>
      <span v-else class="arch-skel" role="status" :aria-label="folderText('folder.loading')" />
      <p v-if="folder" class="arch-head__meta" data-testid="folder-meta">
        {{ meta }}<template v-if="meta"> · </template
        ><DesignStub id="BE-025">{{ folderText('folder.meta.bytes') }}</DesignStub>
      </p>
    </div>
    <div class="arch-head__actions">
      <FolderZipButton v-if="canZip && folder && target" :target="target" :folder="folder" />
      <UiButton
        v-if="canUpload"
        ref="uploadButton"
        variant="primary"
        icon="upload"
        data-testid="folder-upload"
        @click="emit('upload')"
      >
        {{ folderText('folder.upload') }}
      </UiButton>
    </div>
  </div>
</template>
