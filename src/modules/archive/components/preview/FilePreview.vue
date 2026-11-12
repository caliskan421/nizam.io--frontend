<script setup lang="ts">
import './preview.css'

import { computed, nextTick, ref, watch } from 'vue'

import { i18n } from '@/shared/i18n'
import { cssVar } from '@/shared/tokens/css-var'
import { DesignStub, UiIconButton } from '@/shared/ui'

import { usePreviewDetails } from '../../api/preview'
import { formatBytes, typeBadge } from '../../model/mime'
import { tagView } from '../../model/tags'
import { UPLOAD_DATE } from '../../model/stubs'
import type { FilePreviewEmits, FilePreviewProps } from '../index'
import FileActions from './FileActions.vue'
import PreviewArea from './PreviewArea.vue'
import { useReturnFocus } from './focus-return'
import { previewText } from './messages'

/**
 * W124 · E-06-45…57 — 07 sağ panel "Önizleme" (`Arsiv-Klasor.dc.html` aside). Başlık "i / N"
 * (toplam bilinmiyorsa "i / i+"), önceki/sonraki, kapat (odak dosya kartına döner — KESİN 27:
 * Esc, ✕, silme/ad değişimi). Önizleme alanı yalnız raster görselde ve ≤ 20 MiB'de aynı kökenden
 * `Authorization`'lı okunan `blob:` URL'sidir (HTML/SVG/PDF gömülmez; diğer türlerde nötr tür
 * simgesi); tam ekran devre dışı (designStub BE-026). Ayrıntılar: ad, tür · boyut, Görev
 * (`openTask`), Etiket (P34), Yükleyen (`listWorkItemFiles`; null → nötr, BE-071), Tarih `—`
 * (BE-070). İndir / yeniden adlandır / sil `FileActions`'tadır. 390 px'te panel akışta durur.
 */
const props = defineProps<FilePreviewProps>()
const emit = defineEmits<FilePreviewEmits>()

const root = ref<HTMLElement | null>(null)
type Button = { $el: HTMLButtonElement } | null
const previousButton = ref<Button>(null)
const nextButton = ref<Button>(null)
const details = usePreviewDetails(
  () => props.target,
  () => props.file,
)
const returnFocus = useReturnFocus(() => props.file.file_id, root)

const badge = computed(() => typeBadge(props.file.content_type))
const typeName = computed(() => i18n.global.t(`archive.type.${badge.value}`))
const tag = computed(() => tagView(props.file.tag))

const positionText = computed(() => {
  const { position, total, hasMore } = props
  if (total === null) return previewText('archive.preview.positionUnknown', { position })
  return previewText(hasMore ? 'archive.preview.positionMore' : 'archive.preview.position', {
    position,
    total,
  })
})
const previousDisabled = computed(() => props.position <= 1)
// Son yüklenen dosyada devam varsa "sonraki" etkindir (üst sayfa bir sayfa daha yükler).
const nextDisabled = computed(
  () => !props.hasMore && props.total !== null && props.position >= props.total,
)

let navigating = false
function navigate(direction: 'previous' | 'next'): void {
  navigating = true
  if (direction === 'next') emit('next')
  else emit('previous')
}

// Düğme kapanınca odak gövdeye düşmesin (KESİN 27): öteki düğmeye, o da kapalıysa panele geçer.
watch([previousDisabled, nextDisabled], async () => {
  if (!navigating) return
  navigating = false
  await nextTick()
  const active = document.activeElement
  if (active && active !== document.body && !(active as HTMLButtonElement).disabled) return
  const buttons = [previousButton, nextButton]
    .map((b) => b.value?.$el ?? null)
    .filter((b): b is HTMLButtonElement => b !== null && !b.disabled)
  ;(buttons[0] ?? root.value)?.focus()
})

function close(): void {
  emit('close')
  void returnFocus.restore()
}

function afterRemoved(fileId: string): void {
  emit('deleted', fileId)
  void returnFocus.restore()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  event.preventDefault()
  event.stopPropagation()
  close()
}
</script>

<template>
  <aside
    ref="root"
    class="fp"
    tabindex="-1"
    :aria-label="previewText('archive.preview.region')"
    data-testid="file-preview"
    :data-file-id="file.file_id"
    @keydown="onKeydown"
  >
    <div class="fp-head">
      <h2 class="fp-head__title">{{ previewText('archive.preview.title') }}</h2>
      <span class="fp-kicker" data-testid="preview-position">{{ positionText }}</span>
      <UiIconButton
        ref="previousButton"
        icon="chevron-left"
        :label="previewText('archive.preview.previous')"
        :disabled="previousDisabled"
        data-testid="preview-previous"
        @click="navigate('previous')"
      />
      <UiIconButton
        ref="nextButton"
        icon="chevron-right"
        :label="previewText('archive.preview.next')"
        :disabled="nextDisabled"
        data-testid="preview-next"
        @click="navigate('next')"
      />
      <span class="fp-sep" aria-hidden="true"></span>
      <UiIconButton
        icon="close"
        :label="previewText('archive.preview.close')"
        data-testid="preview-close"
        @click="close"
      />
    </div>

    <PreviewArea :file="file" :target="target" :type-name="typeName" />

    <div class="fp-name">
      <p class="fp-name__text" data-testid="preview-name">{{ file.display_name }}</p>
      <p class="fp-cap" data-testid="preview-meta">
        {{
          previewText('archive.preview.typeAndSize', {
            type: typeName,
            size: formatBytes(file.size_bytes),
          })
        }}
      </p>
    </div>

    <dl class="fp-dl">
      <dt>{{ previewText('archive.preview.task') }}</dt>
      <dd>
        <button
          v-if="taskTitle"
          type="button"
          class="fp-link"
          :aria-label="previewText('archive.preview.openTask', { title: taskTitle })"
          data-testid="preview-task"
          @click="emit('openTask', file.work_item_id)"
        >
          {{ taskTitle }}
        </button>
        <button
          v-else
          type="button"
          class="fp-link"
          data-testid="preview-task"
          @click="emit('openTask', file.work_item_id)"
        >
          {{ previewText('archive.preview.taskUntitled') }}
        </button>
      </dd>
      <template v-if="file.subtask_id">
        <dt>{{ previewText('archive.preview.subtask') }}</dt>
        <dd data-testid="preview-subtask">
          {{ details.subtaskTitle.value ?? previewText('archive.preview.noValue') }}
        </dd>
      </template>
      <dt>{{ previewText('archive.preview.tag') }}</dt>
      <dd>
        <span class="fp-status" data-testid="preview-tag">
          <span class="fp-dot" :style="{ background: cssVar(tag.tone) }"></span>{{ tag.label }}
        </span>
      </dd>
      <dt>{{ previewText('archive.preview.uploader') }}</dt>
      <dd data-testid="preview-uploader">
        {{ details.uploaderName.value ?? previewText('archive.preview.noValue') }}
      </dd>
      <dt>{{ previewText('archive.preview.date') }}</dt>
      <dd class="fp-mono" data-testid="preview-date" :data-available="UPLOAD_DATE.available">
        <DesignStub id="BE-070">{{ previewText('archive.preview.noValue') }}</DesignStub>
      </dd>
    </dl>

    <FileActions
      :file="file"
      :target="target"
      @removing="emit('removing', $event)"
      @deleted="afterRemoved"
      @renamed="(fileId: string) => emit('renamed', fileId)"
    />
  </aside>
</template>
