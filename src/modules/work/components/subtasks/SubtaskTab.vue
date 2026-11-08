<script setup lang="ts">
import './subtasks.css'

import { computed } from 'vue'

import type { SubtaskTabProps } from '../index'
import SubtaskList from './SubtaskList.vue'
import { subtaskText } from './messages'
import { useSubtaskList } from './use-subtask-list'

/**
 * Panel "Alt görevler" sekmesi (E-03-60; `rp-dsubs`): sayaç (hepsi bitince vurgu), ilerleme
 * çubuğu (`progress`; satır içi stil yok — CSP), satırlar ve "+ ekle". Satır içi blokla AYNI
 * sorgu ve aynı eylemler (E-03-31…37). Eksik uyarısı (`rp-dsubs__miss`) yok (P5, BE-006).
 */
const props = defineProps<SubtaskTabProps>()

const { counts } = useSubtaskList(() => props.item)
const all = computed(() => counts.value.total > 0 && counts.value.done === counts.value.total)
</script>

<template>
  <section class="rp-dsubs" data-testid="subtask-tab">
    <div class="rp-dsubs__head">
      <span class="rp-kicker">{{ subtaskText('subtasks.kicker') }}</span>
      <span class="rp-dsubs__n" :data-all="all ? 'true' : 'false'" data-testid="subtask-count">
        {{ counts.done }}/{{ counts.total }}
      </span>
    </div>
    <progress
      v-if="counts.total > 0"
      class="rp-dsubs__bar"
      :value="counts.done"
      :max="counts.total"
      :aria-label="subtaskText('subtasks.progress')"
    />
    <SubtaskList :item="item" variant="panel" />
  </section>
</template>
