<script setup lang="ts">
import './full-preview.css'

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'

import { i18n } from '@/shared/i18n'
import { UiButton, UiIcon } from '@/shared/ui'
import { useFocusTrap } from '@/shared/ui/focus-trap'

import { splitPreviewName } from '../../model/full-preview-layout'
import { formatBytes, isPdf, typeBadge } from '../../model/mime'
import type { ArchiveFile, ArchiveTarget } from '../../model/types'
import { previewText } from './messages'
import { useFileDownload } from './use-file-actions'
import { useFullPreviewLayout } from './use-full-preview-layout'
import { isPreviewAccessFailure, useFullPreviewResource } from './use-full-preview-resource'

const props = defineProps<{
  file: ArchiveFile
  target: ArchiveTarget
  taskTitle: string | null
  trigger: HTMLElement
}>()
const emit = defineEmits<{ close: [] }>()

const panel = useTemplateRef<HTMLDialogElement>('panel')
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')
const stage = useTemplateRef<HTMLElement>('stage')
const chip = useTemplateRef<HTMLElement>('chip')
const titleId = useId()
const trap = useFocusTrap(panel)
const { access, record, image, canShowDetails, signal, deny, recheck } = useFullPreviewResource(
  props.file,
  props.target,
)
const { size, natural, scrolled, decoded } = useFullPreviewLayout(stage, chip, image.url)
const pdf = computed(() => isPdf(record.value.content_type))
const name = computed(() => splitPreviewName(record.value.display_name))
const badge = computed(() => typeBadge(record.value.content_type))
const kind = computed(() =>
  badge.value === 'IMG'
    ? record.value.content_type.split('/')[1]?.split(';')[0]?.toUpperCase()
    : badge.value,
)
const fileSize = computed(() => formatBytes(record.value.size_bytes))
const metadata = computed(() =>
  [i18n.global.t(`archive.type.${badge.value}`), fileSize.value, props.taskTitle]
    .filter(Boolean)
    .join(' · '),
)
const download = useFileDownload(
  () => record.value,
  () => props.target,
  () => ({
    signal,
    isCurrent: () => canShowDetails.value,
  }),
)

async function downloadFile(): Promise<void> {
  if (!canShowDetails.value) return
  const result = await download.start()
  if (result?.kind === 'failed') {
    if (
      result.error.code !== 'identity.download_ticket_invalid' &&
      isPreviewAccessFailure(result.error)
    )
      deny()
    else recheck()
  } else if (result?.kind === 'ticket_failed') recheck()
}

const decodeFailed = ref(false)
const visibleImage = computed(() => canShowDetails.value && image.url.value && !decodeFailed.value)
watch(image.url, () => {
  decodeFailed.value = false
})
watch(canShowDetails, async (allowed) => {
  if (!allowed) {
    await nextTick()
    closeButton.value?.focus()
  }
})

onMounted(() => {
  panel.value?.showModal()
  closeButton.value?.focus()
})
onBeforeUnmount(() => {
  panel.value?.close()
  void nextTick(() => {
    if (props.trigger.isConnected) props.trigger.focus()
  })
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="panel"
      class="full-preview"
      :data-details="canShowDetails"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      data-testid="archive-full-preview"
      @keydown="trap.onKeydown"
      @keydown.esc.stop.prevent="emit('close')"
      @cancel.prevent="emit('close')"
    >
      <button
        ref="closeButton"
        class="t-btn t-btn--secondary full-preview__close"
        type="button"
        :aria-label="previewText('archive.fullscreen.close')"
        aria-keyshortcuts="Escape"
        data-testid="archive-full-close"
        @click="emit('close')"
      >
        <UiIcon name="close" size="sm" />
        <span>{{ previewText('archive.fullscreen.close') }}</span>
        <kbd class="t-kbd" aria-hidden="true">Esc</kbd>
      </button>
      <span v-if="canShowDetails" class="full-preview__kind" aria-hidden="true">{{ kind }}</span>
      <div class="full-preview__titles">
        <template v-if="canShowDetails">
          <h1
            :id="titleId"
            class="full-preview__name"
            :title="record.display_name"
            :aria-label="record.display_name"
          >
            <span class="full-preview__stem">{{ name.stem }}</span>
            <span class="full-preview__extension">{{ name.extension }}</span>
          </h1>
          <p class="full-preview__meta">{{ metadata }}</p>
        </template>
        <h1 v-else :id="titleId" class="full-preview__name">
          {{ previewText('archive.fullscreen.title') }}
        </h1>
      </div>
      <section class="full-preview__stage">
        <div
          ref="stage"
          class="full-preview__viewport"
          :data-scroll="size?.scroll ?? false"
          :data-document="Boolean(visibleImage && pdf)"
          :tabindex="size?.scroll ? 0 : undefined"
          :aria-label="size?.scroll ? previewText('archive.fullscreen.scrollRegion') : undefined"
          @scroll.passive="scrolled = true"
        >
          <div v-if="visibleImage" class="full-preview__figure">
            <span v-if="pdf" ref="chip" class="full-preview__chip">
              {{ previewText('archive.fullscreen.firstPage') }}
            </span>
            <img
              :key="image.url.value ?? undefined"
              :src="image.url.value ?? undefined"
              :alt="
                previewText(pdf ? 'archive.preview.pdfFirstPage' : 'archive.preview.image', {
                  name: record.display_name,
                })
              "
              :width="size?.width"
              :height="size?.height"
              draggable="false"
              @load="decoded"
              @error="decodeFailed = true"
            />
            <span v-if="!pdf && natural.width" class="full-preview__dimensions">
              {{ previewText('archive.fullscreen.dimensions', natural) }}
            </span>
          </div>
          <div
            v-else
            class="full-preview__status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <template v-if="!canShowDetails">
              <UiIcon name="file" size="lg" />
              <h2>
                {{
                  previewText(
                    access === 'denied'
                      ? 'archive.fullscreen.denied'
                      : 'archive.fullscreen.unverified',
                  )
                }}
              </h2>
            </template>
            <template v-else-if="access === 'checking' || image.loading.value">
              <span class="full-preview__spinner" aria-hidden="true" />
              <p>{{ previewText('archive.preview.loading') }}</p>
            </template>
            <template v-else>
              <UiIcon name="file" size="lg" />
              <h2>{{ previewText('archive.fullscreen.unavailable') }}</h2>
              <p>{{ previewText('archive.fullscreen.unavailableHint') }}</p>
            </template>
          </div>
        </div>
        <div
          v-if="visibleImage && size?.scroll && !scrolled"
          class="full-preview__hint"
          aria-hidden="true"
        >
          <span
            ><UiIcon name="chevron-down" size="sm" />{{
              previewText('archive.fullscreen.scroll')
            }}</span
          >
        </div>
      </section>
      <div v-if="canShowDetails" class="full-preview__download">
        <UiButton
          icon="download"
          variant="primary"
          :disabled="download.pending.value"
          @click="downloadFile"
        >
          {{ previewText('archive.fullscreen.download') }}
          <span class="full-preview__download-size">· {{ fileSize }}</span>
        </UiButton>
      </div>
    </dialog>
  </Teleport>
</template>
