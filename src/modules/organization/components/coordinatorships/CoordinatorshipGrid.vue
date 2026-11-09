<script setup lang="ts">
import './coordinatorships.css'

import type { CoordinatorshipGridEmits, CoordinatorshipGridProps } from '../index'
import CoordinatorshipCard from './CoordinatorshipCard.vue'
import { coordsText } from './messages'
import { provideCardActions } from './use-card-actions'

/**
 * 08 düz kart ızgarası (E-08-24 grup başlığı yok, P16; `auto-fill minmax(280px, 1fr)`). Küme
 * sayfadan süzülmüş ve sıralanmış gelir; eylem görünürlüğü bir kez hesaplanıp kartlara paylaşılır.
 */
defineProps<CoordinatorshipGridProps>()
const emit = defineEmits<CoordinatorshipGridEmits>()

provideCardActions()
</script>

<template>
  <section class="coords-grid" :aria-label="coordsText('coordinatorships.card.grid')">
    <CoordinatorshipCard
      v-for="item in items"
      :key="item.departmentId"
      :item="item"
      @assign-coordinator="emit('assignCoordinator', $event)"
      @create-task="emit('createTask', $event)"
    />
  </section>
</template>
