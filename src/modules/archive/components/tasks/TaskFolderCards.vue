<script setup lang="ts">
import './tasks.css'

import { UiIcon } from '@/shared/ui'

import type { TaskFolderCardsEmits, TaskFolderCardsProps } from '../index'
import { folderText } from '../files/messages'

/**
 * Görev klasörü kartları (07; E-06-36/37). Kart = görev adı (iki satırda kesilir) + dosya sayısı;
 * seçili görev `aria-pressed`, seçiliye yeniden basmak süzgeci kaldırır (`select(null)`).
 * Yönetici görev listesi 200 tavanında kesildiyse uyarı (P33).
 */
const props = defineProps<TaskFolderCardsProps>()
const emit = defineEmits<TaskFolderCardsEmits>()

function pick(workItemId: string): void {
  emit('select', props.selectedTaskId === workItemId ? null : workItemId)
}
</script>

<template>
  <section class="arch-tasks" aria-labelledby="arch-tasks-title" data-testid="task-folders">
    <div class="arch-tasks__head">
      <h2 id="arch-tasks-title" class="arch-tasks__title">{{ folderText('tasks.title') }}</h2>
      <span class="arch-tasks__caption">{{ folderText('tasks.caption') }}</span>
    </div>
    <div
      v-if="loading"
      class="arch-tasks__grid"
      aria-busy="true"
      :aria-label="folderText('tasks.loading')"
    >
      <span v-for="i in 4" :key="i" class="arch-tasks__skel" aria-hidden="true" />
    </div>
    <p v-else-if="tasks.length === 0" class="arch-tasks__note" data-testid="tasks-empty">
      {{ folderText('tasks.empty') }}
    </p>
    <ul v-else class="arch-tasks__grid">
      <li v-for="task in tasks" :key="task.work_item_id">
        <button
          type="button"
          class="arch-task"
          :aria-pressed="task.work_item_id === selectedTaskId ? 'true' : 'false'"
          :data-task-id="task.work_item_id"
          @click="pick(task.work_item_id)"
        >
          <UiIcon name="archive" />
          <span class="arch-task__name">{{ task.title }}</span>
          <span class="arch-task__count">{{
            folderText('tasks.fileCount', { n: task.file_count })
          }}</span>
        </button>
      </li>
    </ul>
    <p v-if="truncated" class="arch-tasks__note">{{ folderText('shared.tasksTruncated') }}</p>
  </section>
</template>
