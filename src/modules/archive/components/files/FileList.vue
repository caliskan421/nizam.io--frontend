<script setup lang="ts">
import './files.css'

import { computed } from 'vue'

import { UiButton } from '@/shared/ui'

import type { FileListEmits, FileListProps } from '../index'
import { formatBytes, typeBadge } from '../../model/mime'
import { tagView } from '../../model/tags'
import FileStates from './FileStates.vue'
import TagDot from './TagDot.vue'
import { folderText } from './messages'

/**
 * Dosya listesi (E-06-61): sütunlar ad / görev / tür / boyut / etiket, mevcut alanlarla.
 * Ad hücresi seçim düğmesidir (`aria-pressed`); seçili satır `aria-selected`. Sözleşme ızgarayla
 * aynıdır (`FileGridProps`).
 */
const props = defineProps<FileListProps>()
const emit = defineEmits<FileListEmits>()

const showStates = computed(() => props.needsTask || props.error || props.files.length === 0)
</script>

<template>
  <div
    class="arch-files"
    role="region"
    :aria-label="folderText('files.list')"
    data-testid="file-list"
  >
    <FileStates
      v-if="showStates"
      :needs-task="needsTask"
      :error="error"
      :loading="loading"
      :empty="files.length === 0"
      @retry="emit('retry')"
    />
    <table v-else class="arch-list">
      <thead>
        <tr>
          <th scope="col">{{ folderText('files.column.name') }}</th>
          <th scope="col">{{ folderText('files.column.task') }}</th>
          <th scope="col">{{ folderText('files.column.type') }}</th>
          <th scope="col">{{ folderText('files.column.size') }}</th>
          <th scope="col">{{ folderText('files.column.tag') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="file in files"
          :key="file.file_id"
          :aria-selected="file.file_id === selectedFileId ? 'true' : 'false'"
        >
          <td>
            <button
              type="button"
              class="arch-row__open"
              :aria-pressed="file.file_id === selectedFileId ? 'true' : 'false'"
              :data-file-id="file.file_id"
              :title="file.display_name"
              @click="emit('select', file.file_id)"
            >
              {{ file.display_name }}
            </button>
          </td>
          <td>{{ taskTitles[file.work_item_id] ?? folderText('shared.noValue') }}</td>
          <td>{{ typeBadge(file.content_type) }}</td>
          <td>{{ formatBytes(file.size_bytes) }}</td>
          <td>
            <span class="arch-row__tag"
              ><TagDot :tag="file.tag" />{{ tagView(file.tag).label }}</span
            >
          </td>
        </tr>
      </tbody>
    </table>
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
