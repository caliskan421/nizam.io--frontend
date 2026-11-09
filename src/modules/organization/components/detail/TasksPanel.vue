<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { UiIcon } from '@/shared/ui'

import type { CoordinatorshipView } from '../../model/types'
import { detailText } from './messages'

/**
 * Görevler sekmesi (E-08-60; P3 minimum): rapor satırından sade özet + "Görevlerde aç"
 * (`/gorevler?koordinatorluk=‹id›`). 03 listesi gömülmez (tek liste yüzeyi 03). Rapor satırı
 * yoksa "—".
 */
const props = defineProps<{ view: CoordinatorshipView }>()

const none = () => detailText('coordinatorship.tasks.none')
const rows = computed(() => {
  const s = props.view.stat
  return [
    {
      key: 'total',
      label: detailText('coordinatorship.tasks.total'),
      value: s?.total_tasks,
    },
    {
      key: 'completed',
      label: detailText('coordinatorship.tasks.completed'),
      value: s?.completed_tasks,
    },
    {
      key: 'open',
      label: detailText('coordinatorship.tasks.open'),
      value: s ? s.total_tasks - s.completed_tasks : undefined,
    },
    {
      key: 'overdue',
      label: detailText('coordinatorship.tasks.overdue'),
      value: s?.overdue_tasks,
    },
  ]
})
const tasks = computed(() => ({
  name: TASKS_ROUTE.name,
  query: { koordinatorluk: props.view.departmentId },
}))
</script>

<template>
  <section class="t-card cd-card cd-narrow" aria-labelledby="cd-tasks-title" data-card="tasks">
    <h2 id="cd-tasks-title" class="rp-cardtitle">
      {{ detailText('coordinatorship.tasks.label') }}
    </h2>
    <dl class="rp-dl cd-dl">
      <template v-for="row in rows" :key="row.key">
        <dt>{{ row.label }}</dt>
        <dd class="rp-mono" :data-task-stat="row.key">{{ row.value ?? none() }}</dd>
      </template>
    </dl>
    <RouterLink
      class="t-btn t-btn--secondary t-btn--sm cd-open03"
      :to="tasks"
      data-action="open-tasks"
    >
      <UiIcon name="tasks" size="sm" />
      {{ detailText('coordinatorship.tasks.open03') }}
    </RouterLink>
  </section>
</template>
