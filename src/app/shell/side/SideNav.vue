<script setup lang="ts">
import type { MenuEntry } from '@/app/routes.catalog'
import { UiBadge, UiNavItem } from '@/shared/ui'

import type { TaskBadges } from './badges'
import { menuIcon, phaseNote, type SideMenuGroup } from './menu'
import { sideText } from './messages'

/**
 * Ana menü (E-00-11…26, E-00-31). Gruplar ve öğeler `useSideMenu()`'dan (katalog + faz +
 * capability). Etkin öğe katalogdaki `activeMenuKey` ile (`aria-current` yalnız onda). Faz
 * dışı (`devre_disi`) öğe tıklanamaz, açıklaması `title`'da. `rail`: dar menü — başlıksız
 * gruplar, yalnız simge; rozetler dar hâlde yok.
 */
defineProps<{
  groups: readonly SideMenuGroup[]
  activeKey?: string
  rail?: boolean
  badges?: TaskBadges
}>()

function disabledAttrs(entry: MenuEntry): Record<string, string> {
  return entry.visibility === 'devre_disi' ? { title: phaseNote(entry) } : {}
}
</script>

<template>
  <nav
    :aria-label="sideText('side.mainMenu')"
    :class="rail ? 'rp-navlist side-railnav' : 'rp-navgroups side-nav'"
  >
    <div
      v-for="g in groups"
      :key="g.group"
      class="rp-navgroup"
      :class="{ 'side-railgroup': rail }"
      :data-group="g.group"
    >
      <p v-if="!rail" class="rp-navlabel">{{ g.label }}</p>
      <div class="rp-navlist side-navlist">
        <UiNavItem
          v-for="entry in g.entries"
          :key="entry.name"
          :to="{ name: entry.name }"
          :label="entry.title"
          :icon="menuIcon(entry.key)"
          :active="entry.key === activeKey"
          :rail="rail"
          :disabled="entry.visibility === 'devre_disi'"
          v-bind="disabledAttrs(entry)"
        >
          <template v-if="entry.key === 'tasks' && badges">
            <UiBadge
              v-if="badges.pendingDates"
              count
              class="side-badge side-badge--dates"
              :label="sideText('side.badge.dates', { n: badges.pendingDates })"
              >{{ badges.pendingDates }}</UiBadge
            >
            <UiBadge
              v-if="badges.overdue"
              count
              tone="danger"
              class="side-badge"
              :label="sideText('side.badge.overdue', { n: badges.overdue })"
              >{{ badges.overdue }}</UiBadge
            >
          </template>
        </UiNavItem>
      </div>
    </div>
  </nav>
</template>
