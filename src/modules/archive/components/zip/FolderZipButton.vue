<script setup lang="ts">
import './zip.css'

import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiIconButton } from '@/shared/ui'

import { archiveCapabilities } from '../../model/capabilities'
import type { FolderZipButtonProps } from '../index'
import { zipText } from './messages'
import { useZipDownload } from './use-zip-download'

/**
 * E-06-34 — klasör ZIP'i (07 üst çubuk simge düğmesi). Görünürlük yalnız `capabilities`
 * (`folderZip`: ŞY her klasör; K kendi; Ü sanal klasör); mercek yetki değildir (P1). Bilet
 * tıklama anında alınır ve hemen tüketilir (`useArchiveDownload`); kota/yarım indirme metinleri
 * `zip-status.ts`. Sürerken düğme devre dışı bırakılmaz (odak gövdeye düşmez); ikinci tıklama
 * `useZipDownload` içinde yok sayılır. Sunucu her istekte denetler (403 `records.not_authorized` gerçek sonuçtur).
 */
const props = defineProps<FolderZipButtonProps>()

const store = useScopeStore()
const { standing } = useStanding()
const visible = computed(() =>
  archiveCapabilities(standing.value, store.programId).folderZip(props.folder),
)
const zip = useZipDownload('folder', () => props.folder.folder_id)

const label = zipText('folder.label')
const noteText = computed(() => {
  if (zip.phase.value === 'busy') return zipText('folder.busy')
  if (zip.phase.value === 'saved') return zipText('folder.saved')
  return zip.error.value
})

function onClick(): void {
  void zip.start({
    target: props.target,
    kind: 'folder',
    id: props.folder.folder_id,
    fallbackName: `${props.folder.name}.zip`,
  })
}
</script>

<template>
  <span v-if="visible" class="zip" data-testid="folder-zip">
    <UiIconButton
      icon="download"
      size="md"
      :label="label"
      :aria-busy="zip.busy.value"
      :aria-describedby="noteText ? 'folder-zip-note' : undefined"
      data-testid="folder-zip-button"
      @click="onClick"
    />
    <span
      v-if="noteText"
      id="folder-zip-note"
      class="zip__note"
      :class="{ 'zip__note--error': zip.phase.value === 'failed' }"
      :role="zip.phase.value === 'failed' ? 'alert' : 'status'"
      data-testid="folder-zip-note"
    >
      {{ noteText }}
    </span>
  </span>
</template>
