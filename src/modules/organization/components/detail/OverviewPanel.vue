<script setup lang="ts">
import { computed } from 'vue'

import type { useDepartmentRoster, useDepartmentWorkItems } from '../../api'
import type { CoordinatorshipView, DashboardReport } from '../../model/types'
import type { CoordinatorshipTab } from '../index'
import AboutCard from './AboutCard.vue'
import ActivityCard from './ActivityCard.vue'
import AttentionCard from './AttentionCard.vue'
import { badgeText, kpiCells } from './detail-model'
import KpiStrip from './KpiStrip.vue'
import ShortcutsCard from './ShortcutsCard.vue'
import TeamCard from './TeamCard.vue'

/**
 * "Genel bakış" (E-08-58; tasarım: KPI şeridi tam genişlik, solda Hakkında + Ekip, sağda Dikkat
 * gerektirenler + Kısayollar + Son etkinlik). "Alt birimler" kartı çizilmez (E-08-76/77, K14).
 */
const props = defineProps<{
  view: CoordinatorshipView
  dashboard: DashboardReport | null
  dashboardError: boolean
  reportLoading: boolean
  roster: ReturnType<typeof useDepartmentRoster>
  work: ReturnType<typeof useDepartmentWorkItems>
  viewTeam: boolean
  canEdit: boolean
  canAddMember: boolean
}>()
const emit = defineEmits<{ edit: []; addMember: []; tab: [tab: CoordinatorshipTab] }>()

const workSet = computed(() => ({
  items: props.work.items.value,
  complete: props.work.complete.value,
}))
const badge = computed(() => badgeText(props.view.displayName, props.view.code))
const workLoading = computed(() => props.work.query.isPending.value)
const workError = computed(() => props.work.query.isError.value)
const cells = computed(() =>
  kpiCells({
    stat: props.view.stat,
    dashboard: props.dashboard,
    work: workSet.value,
    workLoading: workLoading.value || workError.value,
  }),
)
</script>

<template>
  <KpiStrip :cells="cells" :loading="reportLoading" :error="dashboardError" />
  <div class="rp-col cd-col">
    <AboutCard :description="view.description" :can-edit="canEdit" @edit="emit('edit')" />
    <TeamCard
      v-if="viewTeam"
      :roster="roster"
      :work="workSet"
      :can-add-member="canAddMember"
      @add-member="emit('addMember')"
      @all="emit('tab', 'uyeler')"
    />
  </div>
  <aside class="rp-aside cd-aside" :aria-label="view.displayName">
    <AttentionCard
      :department-id="view.departmentId"
      :code="badge"
      :work="workSet"
      :loading="workLoading"
      :error="workError"
    />
    <ShortcutsCard :department-id="view.departmentId" />
    <ActivityCard />
  </aside>
</template>
