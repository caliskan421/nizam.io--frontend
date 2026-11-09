<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

import { canCreateWorkItem } from '@/modules/work/public'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useDepartmentRoster, useDepartmentWorkItems } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import type { CoordinatorshipView, DashboardReport } from '../../model/types'
import DepartmentForm from '../forms/DepartmentForm.vue'
import MemberAddDialog from '../forms/MemberAddDialog.vue'
import type { CoordinatorshipTab } from '../index'
import DetailHead from './DetailHead.vue'
import type { DetailTabItem } from './detail-model'
import DetailTabs from './DetailTabs.vue'
import MembersPanel from './MembersPanel.vue'
import OverviewPanel from './OverviewPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import TasksPanel from './TasksPanel.vue'
import { detailText } from './messages'

/**
 * Bulunan birimin gövdesi: başlık (E-08-51…56), sekmeler (E-08-57…63) ve sekme panelleri. Tek
 * birim için yalnız o birimin uçları: `listMembers` (ekip, kişi sayısı, Üyeler sekmesi) ve
 * `listProgramWorkItems?department_id=` sonuna dek (KPI notları, Dikkat, açık iş; §9 — aynı ucun
 * sayfalaması fan-out değildir). Formlar W74 bileşenleri (P3); kapsam (program) değişince açık
 * form kapanır, eski kapsamla gönderim yok.
 */
const props = defineProps<{
  view: CoordinatorshipView
  dashboard: DashboardReport | null
  dashboardError: boolean
  reportLoading: boolean
  tab: CoordinatorshipTab
}>()
const emit = defineEmits<{ 'update:tab': [tab: CoordinatorshipTab] }>()

const store = useScopeStore()
const { standing } = useStanding()
const id = computed(() => props.view.departmentId)
const facts = computed(() =>
  organizationFacts(standing.value, store.programId, { departmentId: id.value }),
)
const viewTeam = computed(() => can('viewTeam', facts.value))
const canEdit = computed(() => can('editDepartment', facts.value))
const canAddMember = computed(() => can('assignMembership', facts.value))
const canCreateTask = computed(() => canCreateWorkItem(standing.value, store.programId))

/** E-08-50: kırıntının son parçası birim adı (bulunamayan birimde katalog başlığı). */
usePageCrumb(() => props.view.displayName)

const roster = useDepartmentRoster(id, viewTeam)
const work = useDepartmentWorkItems(id)

const editOpen = ref(false)
const addOpen = ref(false)
watch(
  () => store.programId,
  () => {
    editOpen.value = false
    addOpen.value = false
  },
)

const rosterReady = computed(() => roster.query.data.value !== undefined)
const tabs = computed<DetailTabItem[]>(() => [
  { value: 'genel', label: detailText('coordinatorship.tabs.genel') },
  ...(viewTeam.value
    ? [
        {
          value: 'uyeler' as const,
          label: detailText('coordinatorship.tabs.uyeler'),
          count: rosterReady.value ? roster.active.value.length : undefined,
        },
      ]
    : []),
  {
    value: 'gorevler',
    label: detailText('coordinatorship.tabs.gorevler'),
    count: props.view.stat?.total_tasks,
  },
  {
    value: 'arsiv',
    label: detailText('coordinatorship.tabs.arsiv'),
    phase: detailText('coordinatorship.phase.f5'),
  },
  {
    value: 'toplantilar',
    label: detailText('coordinatorship.tabs.toplantilar'),
    phase: detailText('coordinatorship.phase.f4'),
  },
  ...(canEdit.value
    ? [
        {
          value: 'ayarlar' as const,
          label: detailText('coordinatorship.tabs.ayarlar'),
        },
      ]
    : []),
])
const active = computed<CoordinatorshipTab>(() =>
  tabs.value.some((t) => t.value === props.tab && !t.phase) ? props.tab : 'genel',
)
const panelId = `cd-panel-${useId()}`
</script>

<template>
  <DetailHead
    :view="view"
    :people="rosterReady ? roster.active.value.length : null"
    :can-edit="canEdit"
    :can-create-task="canCreateTask"
    @edit="editOpen = true"
  />
  <div class="rp-body cd-body">
    <DetailTabs
      :tabs="tabs"
      :active="active"
      :panel-id="panelId"
      @select="emit('update:tab', $event)"
    />
    <div
      :id="panelId"
      class="cd-panel"
      role="tabpanel"
      :aria-labelledby="`${panelId}-tab-${active}`"
      tabindex="0"
      :data-panel="active"
    >
      <OverviewPanel
        v-if="active === 'genel'"
        :view="view"
        :dashboard="dashboard"
        :dashboard-error="dashboardError"
        :report-loading="reportLoading"
        :roster="roster"
        :work="work"
        :view-team="viewTeam"
        :can-edit="canEdit"
        :can-add-member="canAddMember"
        @edit="editOpen = true"
        @add-member="addOpen = true"
        @tab="emit('update:tab', $event)"
      />
      <MembersPanel
        v-else-if="active === 'uyeler'"
        :department-id="id"
        :roster="roster"
        :can-add-member="canAddMember"
        @add-member="addOpen = true"
      />
      <TasksPanel v-else-if="active === 'gorevler'" :view="view" />
      <SettingsPanel v-else :view="view" @edit="editOpen = true" />
    </div>
  </div>
  <DepartmentForm v-if="canEdit" v-model:open="editOpen" :department-id="id" />
  <MemberAddDialog v-if="canAddMember" v-model:open="addOpen" :department-id="id" />
</template>
