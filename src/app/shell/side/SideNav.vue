<script setup lang="ts">
import { UiBadge, UiNavItem } from '@/shared/ui'

import type { TaskBadges } from './badges'
import { menuIcon, phaseNote, type SideMenuEntry, type SideMenuGroup } from './menu'
import type { MenuBadgeKind } from './menu-definition'
import { sideText } from './messages'

/**
 * Ana menü (E-00-11…26, E-00-31, F6 E-00-41…46). Gruplar ve öğeler `useSideMenu()`'dan (katalog +
 * rol tanımı + faz + capability); etiket rol etiketidir. Etkin öğe katalogdaki `activeMenuKey` ile
 * (`aria-current` yalnız onda). Faz dışı (`devre_disi`) öğe tıklanamaz, açıklaması `title`'da.
 * Rozetler öğenin rol tanımındaki `badges` sırasıyla çizilir; değeri `badges` prop'undan, yoksa
 * ya da 0 ise çizilmez. `rail`: dar menü — başlıksız gruplar, yalnız simge; rozetler dar hâlde yok.
 */
defineProps<{
  groups: readonly SideMenuGroup[]
  activeKey?: string
  rail?: boolean
  badges?: TaskBadges
}>()

function disabledAttrs(entry: SideMenuEntry): Record<string, string> {
  return entry.visibility === 'devre_disi' ? { title: phaseNote(entry) } : {}
}

const BADGE_VALUE: Readonly<Record<MenuBadgeKind, (b: TaskBadges) => number | null>> = {
  overdue: (b) => b.overdue,
  dates: (b) => b.pendingDates,
  approval: (b) => b.awaitingApproval,
}

function shownBadges(
  entry: SideMenuEntry,
  badges: TaskBadges | undefined,
): { kind: MenuBadgeKind; n: number }[] {
  if (!badges) return []
  const shown: { kind: MenuBadgeKind; n: number }[] = []
  for (const kind of entry.badges) {
    const n = BADGE_VALUE[kind](badges)
    if (n) shown.push({ kind, n })
  }
  return shown
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
          :label="entry.label"
          :icon="menuIcon(entry.key)"
          :active="entry.key === activeKey"
          :rail="rail"
          :disabled="entry.visibility === 'devre_disi'"
          v-bind="disabledAttrs(entry)"
        >
          <UiBadge
            v-for="b in shownBadges(entry, badges)"
            :key="b.kind"
            count
            :tone="b.kind === 'overdue' ? 'danger' : undefined"
            class="side-badge"
            :class="{ 'side-badge--dates': b.kind !== 'overdue' }"
            :data-badge="b.kind"
            :label="sideText(`side.badge.${b.kind}`, { n: b.n })"
            >{{ b.n }}</UiBadge
          >
        </UiNavItem>
      </div>
    </div>
  </nav>
</template>
