<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { UiIcon, type IconName } from '@/shared/ui'

import { detailText, type DetailTextKey } from './messages'

/**
 * Kısayollar (E-08-84…89): "Görevlerde aç" canlı (`/gorevler?koordinatorluk=‹id›`); "Zaman
 * çizelgesinde gör" (F3), "Arşiv klasörü" (F5), "Toplantı planla" (F4) faz notuyla devre dışı
 * (P2, stub değil); "Birim raporu (PDF)" F6 → çizilmez (P6 kalıbı).
 */
const props = defineProps<{ departmentId: string }>()

const tasks = computed(() => ({
  name: TASKS_ROUTE.name,
  query: { koordinatorluk: props.departmentId },
}))

const LATER: ReadonlyArray<{
  key: string
  icon: IconName
  label: DetailTextKey
  phase: DetailTextKey
}> = [
  {
    key: 'timeline',
    icon: 'gantt',
    label: 'organization.coordinatorship.shortcuts.timeline',
    phase: 'organization.coordinatorship.phase.f3',
  },
  {
    key: 'archive',
    icon: 'archive',
    label: 'organization.coordinatorship.shortcuts.archive',
    phase: 'organization.coordinatorship.phase.f5',
  },
  {
    key: 'meeting',
    icon: 'meetings',
    label: 'organization.coordinatorship.shortcuts.meeting',
    phase: 'organization.coordinatorship.phase.f4',
  },
]
</script>

<template>
  <section
    class="t-card cd-card cd-card--aside cd-shortcuts"
    aria-labelledby="cd-links-title"
    data-card="shortcuts"
  >
    <h2 id="cd-links-title" class="rp-cardtitle cd-shortcuts__title">
      {{ detailText('organization.coordinatorship.shortcuts.title') }}
    </h2>
    <RouterLink class="rp-menuitem cd-shortcut" :to="tasks" data-shortcut="tasks">
      <UiIcon name="tasks" size="sm" class="cd-shortcut__icon" />
      <span class="rp-trunc">{{ detailText('organization.coordinatorship.shortcuts.tasks') }}</span>
      <UiIcon name="chevron-right" size="sm" class="cd-shortcut__go" />
    </RouterLink>
    <span
      v-for="item in LATER"
      :key="item.key"
      class="rp-menuitem cd-shortcut"
      role="link"
      aria-disabled="true"
      :title="detailText(item.phase)"
      :data-shortcut="item.key"
    >
      <UiIcon :name="item.icon" size="sm" class="cd-shortcut__icon" />
      <span class="rp-trunc">{{ detailText(item.label) }}</span>
      <span class="cd-phase">{{ detailText(item.phase) }}</span>
    </span>
  </section>
</template>
