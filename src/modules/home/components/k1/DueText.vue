<script setup lang="ts">
import { computed } from 'vue'

import { dueView } from '../../model/role/due'
import { homeText } from '../../model/messages'
import type { WorkRow } from '../../model/role/common'

/**
 * "bitiş 20.10 · 1 gün geç" (E-K1-16, E-Ü1-11): gecikme sunucudan (`days_overdue`), kalan gün
 * kurulum gününe göre. Geciken kısım `--danger`.
 */
const props = defineProps<{
  item: Pick<WorkRow, 'end_on' | 'is_overdue' | 'days_overdue'>
  today: string
}>()

const due = computed(() => dueView(props.item, props.today))
const relative = computed(() => {
  switch (due.value.kind) {
    case 'late':
      return homeText('home.k1.common.late', { n: due.value.days })
    case 'left':
      return homeText('home.k1.common.left', { n: due.value.days })
    case 'today':
      return homeText('home.k1.common.todayDue')
    default:
      return null
  }
})
</script>

<template>
  <span class="rh-due-text">
    {{ homeText('home.k1.common.dueOn', { date: due.date }) }}
    <template v-if="relative">
      ·
      <span :class="{ 'rh-danger': due.kind === 'late' }">{{ relative }}</span>
    </template>
  </span>
</template>
