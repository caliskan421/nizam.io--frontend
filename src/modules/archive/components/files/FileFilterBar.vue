<script setup lang="ts">
import './files.css'

import { computed } from 'vue'

import { UiCount, UiIcon } from '@/shared/ui'
import { rovingTarget } from '@/shared/ui/roving'

import type { FileFilterBarEmits, FileFilterBarProps } from '../index'
import { countLabel } from '../../model/filters'
import { ARCHIVE_TAGS, tagView } from '../../model/tags'
import type { ArchiveView } from '../../model/types'
import TagDot from './TagDot.vue'
import { folderText } from './messages'

/**
 * Dosya araç çubuğu (E-06-38…40/46): başlık + sayaç ("n" kesin, süzgeçlide "n+", BE-073), etiket
 * segmenti (kapalı küme, P34) ve görünüm segmenti. Basılı etiket yeniden basılınca kalkar
 * ("Tümü"). Klavye: segment içinde ←/→.
 */
const props = defineProps<FileFilterBarProps>()
const emit = defineEmits<FileFilterBarEmits>()

const count = computed(() => countLabel(props.loaded, props.hasMore, props.total))
const VIEWS: readonly { value: ArchiveView; icon: 'grid' | 'list' }[] = [
  { value: 'izgara', icon: 'grid' },
  { value: 'liste', icon: 'list' },
]

function roving(event: KeyboardEvent): void {
  const group = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button')
  rovingTarget(event, [...group], 'horizontal')
}
</script>

<template>
  <div class="arch-bar" data-testid="file-filter-bar">
    <h2 id="arch-files-title" class="arch-bar__title">
      {{ folderText('files.title') }}
      <UiCount :value="`${count.value}${count.approximate ? '+' : ''}`" />
    </h2>
    <div class="arch-bar__group">
      <div
        class="rp-seg"
        role="group"
        :aria-label="folderText('files.tag.label')"
        @keydown="roving"
      >
        <button
          type="button"
          :aria-pressed="tag === null ? 'true' : 'false'"
          @click="emit('update:tag', null)"
        >
          {{ folderText('files.tag.all') }}
        </button>
        <button
          v-for="item in ARCHIVE_TAGS"
          :key="item"
          type="button"
          :aria-pressed="tag === item ? 'true' : 'false'"
          :data-tag="item"
          @click="emit('update:tag', tag === item ? null : item)"
        >
          <TagDot :tag="item" aria-hidden="true" />{{ tagView(item).label }}
        </button>
      </div>
      <div
        class="rp-seg"
        role="group"
        :aria-label="folderText('shared.view.label')"
        @keydown="roving"
      >
        <button
          v-for="item in VIEWS"
          :key="item.value"
          type="button"
          :aria-pressed="view === item.value ? 'true' : 'false'"
          :aria-label="folderText(`shared.view.${item.value}`)"
          :data-view="item.value"
          @click="emit('update:view', item.value)"
        >
          <UiIcon :name="item.icon" size="sm" />
        </button>
      </div>
    </div>
  </div>
</template>
