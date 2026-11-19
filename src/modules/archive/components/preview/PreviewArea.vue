<script setup lang="ts">
import './preview.css'

import { computed, ref, watch } from 'vue'

import { DesignStub, UiButton, UiIcon, UiIconButton } from '@/shared/ui'

import { useFilePreview } from '../../api/preview'
import { useFileThumbnail } from '../../api/thumbnails'
import { canPreview, isPdf, isPreviewableImage } from '../../model/mime'
import { FULLSCREEN_PREVIEW } from '../../model/stubs'
import type { ArchiveFile, ArchiveTarget } from '../../model/types'
import { previewText } from './messages'

/**
 * W124 · E-06-49/50 — önizleme alanı: raster görsel (≤ 20 MiB) için `blob:` URL'si (aynı
 * kökenden `Authorization`'lı okuma). PDF ilk sayfanın JPEG türeviyle gösterilir.
 * Türev yoksa nötr tür rozeti kullanılır. Tam ekran devre dışı (designStub BE-026).
 */
const props = defineProps<{ file: ArchiveFile; target: ArchiveTarget; typeName: string }>()

const preview = useFilePreview(
  () => props.target,
  () => props.file,
)
const pdf = computed(() => isPdf(props.file.content_type))
const thumbnail = useFileThumbnail(
  () => props.target,
  () => (pdf.value ? props.file.file_id : null),
)
const thumbnailFailed = ref(false)
watch(thumbnail.url, () => {
  thumbnailFailed.value = false
})

const image = computed(() => (pdf.value ? thumbnail.url.value : preview.url.value))
const eligible = computed(() => canPreview(props.file))
const raster = computed(() => isPreviewableImage(props.file.content_type))
const previewState = computed<'image' | 'loading' | 'failed' | 'none'>(() => {
  if (pdf.value) {
    if (image.value && !thumbnailFailed.value) return 'image'
    return thumbnail.loading.value ? 'loading' : 'none'
  }
  if (!eligible.value) return 'none'
  if (image.value) return 'image'
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
      :src="image ?? undefined"
      :alt="
        previewText(pdf ? 'archive.preview.pdfFirstPage' : 'archive.preview.image', {
          name: file.display_name,
        })
      "
      data-testid="preview-image"
      @error="thumbnailFailed = pdf"
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
        :disabled="!FULLSCREEN_PREVIEW.available"
        data-testid="preview-fullscreen"
      />
    </DesignStub>
  </div>
</template>
