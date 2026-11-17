<script setup lang="ts">
import { UiHint, UiInput } from '@/shared/ui'

import { folderText } from '../../components/files/messages'
import { isSingleCharSearch } from '../../model/filters'

/**
 * 07 klasör araması (E-06-26): dosya adı + görev başlığı + yükleyen adı (`search_scope=all`).
 * Tek karakterde görev/yükleyen için iki karakter gerektiği yardımcı metinle söylenir; istek ve
 * sonuç sunucudan gelir (istemci eşiği kopyalamaz).
 */
const text = defineModel<string>({ required: true })
defineEmits<{ flush: [] }>()
</script>

<template>
  <div class="arch-search">
    <UiInput
      v-model="text"
      type="search"
      icon="search"
      size="sm"
      :aria-label="folderText('folder.search.label')"
      :placeholder="folderText('folder.search.placeholder')"
      data-testid="folder-search"
      @keydown.enter="$emit('flush')"
    />
    <UiHint v-if="isSingleCharSearch(text)" role="status" data-testid="folder-search-hint">
      {{ folderText('folder.search.minHint') }}
    </UiHint>
  </div>
</template>
