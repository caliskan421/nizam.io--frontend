<script setup lang="ts">
import './files.css'

import { UiButton, UiEmptyState } from '@/shared/ui'

import { folderText } from './messages'

/**
 * Dosya alanı durumları (ızgara ve liste ortak): hata (yeniden dene), ilk yükleme (iskelet) ve
 * boş. Dolu listede çizilmez. (Yönetici "Görev klasörü seçin" durumu BE-072 ile kalktı.)
 */
defineProps<{ error: boolean; loading: boolean; empty: boolean }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <UiEmptyState
    v-if="error"
    icon="alert"
    :title="folderText('files.error')"
    role="alert"
    data-testid="files-error"
  >
    <template #action>
      <UiButton size="sm" @click="$emit('retry')">{{ folderText('files.retry') }}</UiButton>
    </template>
  </UiEmptyState>
  <div
    v-else-if="loading && empty"
    class="arch-grid"
    aria-busy="true"
    :aria-label="folderText('files.loading')"
    data-testid="files-loading"
  >
    <span v-for="i in 6" :key="i" class="arch-skel-card" aria-hidden="true" />
  </div>
  <UiEmptyState
    v-else-if="empty"
    icon="file"
    :title="folderText('files.empty.title')"
    :text="folderText('files.empty.text')"
    data-testid="files-empty"
  />
</template>
