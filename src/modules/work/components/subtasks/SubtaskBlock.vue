<script setup lang="ts">
import './subtasks.css'

import type { SubtaskBlockEmits, SubtaskBlockProps } from '../index'
import SubtaskList from './SubtaskList.vue'
import { subtaskText } from './messages'
import { useSubtaskList } from './use-subtask-list'

/**
 * Satır içi alt görev bloğu (E-03-21 açılan blok, E-03-30…37; `rp-subs`). Satırdaki açma
 * düğmesi (`rp-subtog`, sayaç `subtask_counts`) liste satırının işidir; blok açıldığında (bu
 * bileşen bağlandığında) yalnız o görevin alt görevleri okunur — panel sekmesiyle AYNI sorgu.
 * Başlık "alt görevler · ‹t›/‹n›" + yalnız "Kişi ve tarih isteğe bağlıdır." (E-03-30, P5).
 * Alt görev başlığı → `openSubtasks` (üst görevin paneli "Alt görevler" sekmesinde, E-03-32).
 * Tablo erişilebilirliği: `role="row"` tek `role="cell"` taşır (`ozellikler.md` §7-13).
 */
const props = defineProps<SubtaskBlockProps>()
const emit = defineEmits<SubtaskBlockEmits>()

const { counts } = useSubtaskList(() => props.item)
</script>

<template>
  <div
    class="rp-subs"
    role="row"
    :aria-label="subtaskText('subtasks.rowsLabel', { title: item.title })"
    data-testid="subtask-block"
  >
    <div class="rp-subs__cell" role="cell">
      <div class="rp-subs__head">
        <span class="rp-kicker" data-testid="subtask-count">
          {{ subtaskText('subtasks.head', { done: counts.done, total: counts.total }) }}
        </span>
        <span class="rp-cap">{{ subtaskText('subtasks.caption') }}</span>
      </div>
      <SubtaskList :item="item" variant="block" @open="emit('openSubtasks', item.work_item_id)" />
    </div>
  </div>
</template>
