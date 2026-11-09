<script setup lang="ts">
import './coordinatorships/coordinatorships.css'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { TASKS_NEW_TASK_QUERY, TASKS_ROUTE } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'

import { useCoordinatorships } from '../api'
import { CoordinatorAssignDialog, CoordinatorshipGrid, DepartmentForm } from '../components'
import { coordsText } from '../components/coordinatorships/messages'
import { can, organizationFacts } from '../model/capabilities'
import CoordsHead from './coordinatorships/CoordsHead.vue'
import CoordsToolbar from './coordinatorships/CoordsToolbar.vue'
import { visibleCoordinatorships } from './coordinatorships/filtering'
import { healthSummary } from './coordinatorships/health'
import HealthStrip from './coordinatorships/HealthStrip.vue'
import { useCoordsUrl } from './coordinatorships/use-coords-url'

/**
 * 08 · Koordinatörlükler liste (`/koordinatorlukler`, S2; W72). Yalnız şirket yöneticisi (rota
 * kapısı `AdminGate`, P16). Veri: TEK `listProgramDepartments` ⋈ TEK `reportDashboard`
 * (`useCoordinatorships`; birim başına istek yok, K3). Arama/sıralama istemcide, URL `q`/`sirala`
 * (K10). Toplu seçim, durum seçici, üst birim süzgeci ve grup başlıkları gizli (P7, K14, P16).
 * Formlar W74 bileşenleriyle açılır; "Görev ata" 03 yeni görev girişine departman ön seçili
 * gider. Kapsam değişince açık diyalog/menü kapanır, sıralama varsayılana döner.
 */
const store = useScopeStore()
const router = useRouter()
const { standing, programs } = useStanding()

const creating = ref(false)
const assignTarget = ref<string | null>(null)
const gridKey = ref(0)

const url = useCoordsUrl(() => {
  creating.value = false
  assignTarget.value = null
  gridKey.value += 1
})

const facts = computed(() => organizationFacts(standing.value, store.programId))
const withReport = computed(() => can('readReport', facts.value))
const canCreate = computed(() => can('createDepartment', facts.value))
const canEdit = computed(() => can('editDepartment', facts.value))

const coords = useCoordinatorships(withReport)
const all = computed(() => coords.views.value)
const shown = computed(() =>
  visibleCoordinatorships(all.value, url.state.value.search, url.state.value.direction),
)

const report = computed(() => (withReport.value ? (coords.dashboard.data.value ?? null) : null))
const loading = computed(() => coords.departments.isPending.value)
const loadError = computed(() =>
  coords.departments.isError.value ? toApiError(coords.departments.error.value) : null,
)
const reportError = computed(() =>
  withReport.value && coords.dashboard.isError.value && !report.value
    ? toApiError(coords.dashboard.error.value)
    : null,
)
const summary = computed(() => (report.value ? healthSummary(all.value, Date.now()) : null))
const year = computed(
  () => programs.value?.find((p) => p.programId === store.programId)?.year ?? null,
)
const ready = computed(() => !loading.value && !loadError.value)
const noneLinked = computed(() => ready.value && all.value.length === 0)
const filteredEmpty = computed(() => ready.value && !noneLinked.value && shown.value.length === 0)

function retry(): void {
  void coords.departments.refetch()
  if (withReport.value) void coords.dashboard.refetch()
}

/** Pano hata durumunda yeniden dene (yazma sonrası tazeleme geçersizleme haritasında, W82a). */
function retryReport(): void {
  if (withReport.value) void coords.dashboard.refetch()
}

function createTask(departmentId: string): void {
  void router.push({
    name: TASKS_ROUTE.name,
    query: { ...TASKS_NEW_TASK_QUERY, koordinatorluk: departmentId },
  })
}
</script>

<template>
  <section class="coords-page" data-testid="coordinatorships-page">
    <CoordsHead
      :count="ready ? all.length : null"
      :truncated="coords.departmentsTruncated.value"
      :people="report ? report.total_users : null"
      :year="year"
      :can-create="canCreate"
      :can-more="canEdit"
      @create="creating = true"
    />
    <div class="rp-body">
      <div class="coords-tools">
        <HealthStrip
          v-if="withReport && !loadError && !noneLinked"
          :summary="summary"
          :loading="loading || (coords.dashboard.isPending.value && !reportError)"
          :error="reportError"
          :retrying="coords.dashboard.isFetching.value"
          @retry="retryReport"
        />
        <CoordsToolbar
          :search="url.state.value.search"
          :direction="url.state.value.direction"
          @update:search="url.update({ search: $event })"
          @update:direction="url.update({ direction: $event })"
        />
      </div>
      <div class="coords-list">
        <UiErrorState
          v-if="loadError"
          :error="loadError"
          :title="coordsText('coordinatorships.error')"
          retryable
          :retrying="coords.departments.isFetching.value"
          @retry="retry"
        />
        <div
          v-else-if="loading"
          class="coords-grid"
          aria-busy="true"
          :aria-label="coordsText('coordinatorships.loading')"
        >
          <span v-for="i in 6" :key="i" class="coords-skel--card" aria-hidden="true" />
        </div>
        <UiEmptyState
          v-else-if="noneLinked"
          icon="coords"
          :title="coordsText('coordinatorships.empty.noneTitle')"
          :text="coordsText('coordinatorships.empty.noneText')"
          data-testid="coords-none"
        >
          <template v-if="canCreate" #action>
            <UiButton size="sm" variant="primary" icon="plus" @click="creating = true">
              {{ coordsText('coordinatorships.head.create') }}
            </UiButton>
          </template>
        </UiEmptyState>
        <UiEmptyState
          v-else-if="filteredEmpty"
          icon="search"
          :title="coordsText('coordinatorships.empty.filteredTitle')"
          data-testid="coords-filtered-empty"
        >
          <template #action>
            <UiButton size="sm" @click="url.update({ search: '' })">
              {{ coordsText('coordinatorships.empty.clear') }}
            </UiButton>
          </template>
        </UiEmptyState>
        <CoordinatorshipGrid
          v-else
          :key="gridKey"
          :items="shown"
          @assign-coordinator="assignTarget = $event"
          @create-task="createTask"
        />
        <div v-if="ready && !noneLinked" class="coords-foot">
          <span class="rp-cap">{{ coordsText('coordinatorships.footer.hint') }}</span>
          <span class="rp-cap rp-nowrap" data-testid="coords-count">
            {{
              coordsText('coordinatorships.footer.count', {
                shown: shown.length,
                total: all.length,
              })
            }}
          </span>
        </div>
      </div>
    </div>
    <DepartmentForm v-if="canCreate" v-model:open="creating" />
    <CoordinatorAssignDialog
      v-if="assignTarget"
      :open="true"
      :department-id="assignTarget"
      @update:open="(open: boolean) => !open && (assignTarget = null)"
    />
  </section>
</template>
