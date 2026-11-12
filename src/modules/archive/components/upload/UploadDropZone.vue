<script setup lang="ts">
import './upload.css'

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { UiButton, UiIcon } from '@/shared/ui'

import { formatBytes } from '../../model/mime'
import { firstDropped } from './model'

/**
 * Dosya seçimi + sürükle-bırak alanı (W125 · E-06-62; Ü3 yalnız biçim referansı). Gerçek
 * `<input type=file>` gizlidir; klavye/ekran okuyucu yolu `id` alan düğmesidir. Tek dosya.
 */
const props = defineProps<{
  file: File | null
  disabled: boolean
  invalid?: boolean
  /** `UiField` etiket bağlantısı ve açıklama kimliği. */
  id?: string
  describedBy?: string
}>()
const emit = defineEmits<{ 'update:file': [file: File | null]; extra: [extra: boolean] }>()

const { t } = useI18n()
const input = ref<HTMLInputElement | null>(null)
const over = ref(false)

function take(files: FileList | null | undefined): void {
  const { file, extra } = firstDropped(files)
  if (!file) return
  emit('update:file', file)
  emit('extra', extra)
}

function onChange(event: Event): void {
  const el = event.target as HTMLInputElement
  take(el.files)
  // Aynı dosya yeniden seçilebilsin.
  el.value = ''
}

function onDrop(event: DragEvent): void {
  over.value = false
  if (props.disabled) return
  take(event.dataTransfer?.files)
}

function onOver(): void {
  if (!props.disabled) over.value = true
}
</script>

<template>
  <div
    class="au-drop"
    :class="{ 'au-drop--over': over, 'au-drop--invalid': invalid }"
    data-testid="upload-drop"
    @dragenter.prevent="onOver"
    @dragover.prevent="onOver"
    @dragleave="over = false"
    @drop.prevent="onDrop"
  >
    <UiIcon name="file-upload" />
    <p class="au-drop__text">
      {{ over ? t('archive.upload.file.dropActive') : t('archive.upload.file.drop') }}
    </p>
    <p v-if="file" class="au-drop__file" data-testid="upload-file-name">
      {{ t('archive.upload.file.selected', { name: file.name, size: formatBytes(file.size) }) }}
    </p>
    <UiButton
      :id="id"
      :aria-describedby="describedBy"
      :aria-invalid="invalid ? 'true' : undefined"
      :disabled="disabled"
      data-testid="upload-choose"
      @click="input?.click()"
    >
      {{ file ? t('archive.upload.file.change') : t('archive.upload.file.choose') }}
    </UiButton>
    <input
      ref="input"
      class="au-input"
      type="file"
      hidden
      tabindex="-1"
      aria-hidden="true"
      data-testid="upload-file"
      :disabled="disabled"
      @change="onChange"
    />
  </div>
</template>
