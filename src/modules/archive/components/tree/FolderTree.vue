<script setup lang="ts">
import './tree.css'

import { ref } from 'vue'

import { rovingTarget } from '@/shared/ui/roving'
import { UiIcon } from '@/shared/ui'

import type { FolderTreeEmits, FolderTreeProps } from '../index'
import { folderText } from '../files/messages'

/**
 * Klasör ağacı (07; E-06-27…30). Düzey 0 = `folders` (yönetici: bütün klasörler, K/Ü: tek düğüm);
 * düzey 1 = YALNIZ açık klasörün görevleri. Seçili düğüm `aria-current="page"`: görev
 * seçiliyken görev düğümü, değilse klasör düğümü. Açık klasöre yeniden basmak görev süzgecini
 * kaldırır (`selectTask(null)`); başka klasör `selectFolder`. Klavye: ↑/↓/Home/End.
 */
const props = defineProps<FolderTreeProps>()
const emit = defineEmits<FolderTreeEmits>()
const root = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent): void {
  const items = [...(root.value?.querySelectorAll<HTMLElement>('button.arch-node') ?? [])]
  rovingTarget(event, items, 'vertical')
}

function openFolder(folderId: string): void {
  if (folderId === props.activeFolderId) {
    if (props.selectedTaskId !== null) emit('selectTask', null)
    return
  }
  emit('selectFolder', folderId)
}
</script>

<template>
  <nav
    ref="root"
    class="arch-tree"
    :aria-label="folderText('tree.label')"
    data-testid="folder-tree"
    @keydown="onKeydown"
  >
    <p class="arch-tree__kicker">{{ folderText('tree.kicker') }}</p>
    <template v-for="folder in folders" :key="folder.folderId">
      <button
        type="button"
        class="arch-node"
        :data-folder-id="folder.folderId"
        :aria-current="
          folder.folderId === activeFolderId && selectedTaskId === null ? 'page' : undefined
        "
        @click="openFolder(folder.folderId)"
      >
        <UiIcon
          name="chevron-down"
          size="sm"
          class="arch-node__chev"
          :class="{ 'arch-node__chev--open': folder.folderId === activeFolderId }"
        />
        <UiIcon name="archive" size="sm" class="arch-node__icon" />
        <span class="arch-node__name">{{ folder.name }}</span>
        <span class="rp-count">{{ folder.fileCount ?? folderText('tree.noValue') }}</span>
      </button>
      <template v-if="folder.folderId === activeFolderId">
        <span
          v-if="loadingTasks"
          class="arch-tree__skel"
          role="status"
          :aria-label="folderText('tree.loadingTasks')"
        />
        <button
          v-for="task in tasks"
          :key="task.work_item_id"
          type="button"
          class="arch-node arch-node--sub"
          :style="{ '--arch-level': 1 }"
          :data-task-id="task.work_item_id"
          :aria-current="task.work_item_id === selectedTaskId ? 'page' : undefined"
          @click="emit('selectTask', task.work_item_id)"
        >
          <UiIcon name="chevron-down" size="sm" class="arch-node__chev arch-node__chev--none" />
          <UiIcon name="archive" size="sm" class="arch-node__icon" />
          <span class="arch-node__name">{{ task.title }}</span>
          <span class="rp-count">{{ task.file_count }}</span>
        </button>
        <p v-if="truncated" class="arch-tree__note">{{ folderText('shared.tasksTruncated') }}</p>
      </template>
    </template>
  </nav>
</template>
