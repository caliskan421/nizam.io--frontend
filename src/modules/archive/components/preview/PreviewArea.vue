<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import { DesignStub, UiButton, UiIcon, UiIconButton } from '@/shared/ui'

import { useFilePreview } from '../../api/preview'
import { canPreview, isPreviewableImage } from '../../model/mime'
import { THUMBNAIL } from '../../model/stubs'
import type { ArchiveFile, ArchiveTarget } from '../../model/types'
import { previewText } from './messages'

/**
 * W124 · E-06-49/50 — önizleme alanı: raster görsel (≤ 20 MiB) için `blob:` URL'si (aynı
 * kökenden `Authorization`'lı okuma; HTML/SVG/PDF gömülmez), diğer türlerde nötr tür simgesi;
 * yükleniyor / hata (yeniden dene) durumları; tam ekran devre dışı (designStub BE-026).
 */
const props = defineProps<{ file: ArchiveFile; target: ArchiveTarget; typeName: string }>()

const preview = useFilePreview(
  () => props.target,
  () => props.file,
)
const eligible = computed(() => canPreview(props.file))
const raster = computed(() => isPreviewableImage(props.file.content_type))
const previewState = computed<'image' | 'loading' | 'failed' | 'none'>(() => {
  if (!eligible.value) return 'none'
  if (preview.url.value) return 'image'
  if (preview.query.isError.value) return 'failed'
  return 'loading'
})
const noneText = computed(() =>
  raster.value
    ? previewText('archive.preview.tooLarge')
    : previewText('archive.preview.unavailable'),
)
</script>

<template>
  <div class="fp-area" :data-state="previewState" data-testid="preview-area">
    <img
      v-if="previewState === 'image'"
      class="fp-area__img"
      :src="preview.url.value ?? undefined"
      :alt="previewText('archive.preview.image', { name: file.display_name })"
      data-testid="preview-image"
    />
    <div
      v-else
      class="fp-area__note"
      role="group"
      :aria-label="previewText('archive.preview.area')"
    >
      <template v-if="previewState === 'loading'">
        <span data-testid="preview-loading">{{ previewText('archive.preview.loading') }}</span>
      </template>
      <template v-else-if="previewState === 'failed'">
        <span data-testid="preview-failed">{{ previewText('archive.preview.failed') }}</span>
        <UiButton size="sm" data-testid="preview-retry" @click="preview.query.refetch()">
          {{ previewText('archive.preview.retry') }}
        </UiButton>
      </template>
      <template v-else>
        <UiIcon name="file" size="lg" />
        <span class="fp-kicker fp-badge" data-testid="preview-badge">{{ typeName }}</span>
        <span class="fp-cap" data-testid="preview-none">{{ noneText }}</span>
      </template>
    </div>
    <DesignStub id="BE-026" class="fp-area__full">
      <UiIconButton
        icon="expand"
        :label="previewText('archive.preview.fullscreen')"
        :disabled="!THUMBNAIL.fullscreen"
        data-testid="preview-fullscreen"
      />
    </DesignStub>
  </div>
</template>
