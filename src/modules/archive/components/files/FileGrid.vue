<script setup lang="ts">
import './files.css'

import { computed } from 'vue'

import { UiButton } from '@/shared/ui'

import type { FileGridEmits, FileGridProps } from '../index'
import { typeBadge } from '../../model/mime'
import FileStates from './FileStates.vue'
import TagDot from './TagDot.vue'
import { folderText } from './messages'

/**
 * Dosya ızgarası (E-06-41…45): kart = nötr tür rozeti (küçük resim yok, BE-026) + etiket noktası
 * + ad + görev adı (+ "↳ Alt görev" satırı, E-06-44: ad yalnız önizlemede). Seçili kart
 * `aria-pressed`. Liste sonunda "Daha fazla yükle" (imleç). Durumlar `FileStates`.
 */
const props = defineProps<FileGridProps>()
const emit = defineEmits<FileGridEmits>()

const showStates = computed(() => props.needsTask || props.error || props.files.length === 0)
</script>

<template>
  <div
    class="arch-files"
    role="region"
    :aria-label="folderText('files.grid')"
    data-testid="file-grid"
  >
    <FileStates
      v-if="showStates"
      :needs-task="needsTask"
      :error="error"
      :loading="loading"
      :empty="files.length === 0"
      @retry="emit('retry')"
    />
    <ul v-else class="arch-grid">
      <li v-for="file in files" :key="file.file_id">
        <button
          type="button"
          class="arch-card"
          :aria-pressed="file.file_id === selectedFileId ? 'true' : 'false'"
          :data-file-id="file.file_id"
          :title="file.display_name"
          @click="emit('select', file.file_id)"
        >
          <span class="arch-card__thumb">
            <span class="arch-badge">{{ typeBadge(file.content_type) }}</span>
            <TagDot :tag="file.tag" card />
          </span>
          <span class="arch-card__body">
            <span class="arch-card__name">{{ file.display_name }}</span>
            <span class="arch-card__task">{{
              taskTitles[file.work_item_id] ?? folderText('shared.noValue')
            }}</span>
            <span v-if="file.subtask_id" class="arch-card__sub" data-testid="file-subtask">
              ↳ {{ folderText('files.subtask') }}
            </span>
          </span>
        </button>
      </li>
    </ul>
    <UiButton
      v-if="!showStates && hasMore"
      class="arch-files__more"
      size="sm"
      :disabled="loading"
      :aria-busy="loading ? 'true' : undefined"
      @click="emit('loadMore')"
    >
      {{ folderText('files.loadMore') }}
    </UiButton>
  </div>
</template>
