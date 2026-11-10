<script setup lang="ts">
import './tasks/tasks.css'

import { computed, ref } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { scopeFacts } from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'

import { NewTaskDialog, WorkDetailPanel, type WorkDetailTab } from '../components'
import { istanbulToday } from '../components/list/dates'
import TaskTable from '../components/list/TaskTable.vue'
import {
  canCreateWorkItem,
  canReviewDateChange,
  coordinatorDepartmentIds,
} from '../model/capabilities'
import { listDepartmentFilter } from '../model/target'
import { tasksText } from './tasks/messages'
import RequestBand from './tasks/RequestBand.vue'
import TasksFilterBar from './tasks/TasksFilterBar.vue'
import TasksHead from './tasks/TasksHead.vue'
import TasksPager from './tasks/TasksPager.vue'
import TasksStatusBar from './tasks/TasksStatusBar.vue'
import { clearedFilters, hasActiveFilters, nextSort, type SortField } from './tasks/url-state'
import { useNewTaskEntry } from './tasks/use-new-task-entry'
import { useTaskList } from './tasks/use-task-list'
import { useTasksUrl } from './tasks/use-tasks-url'

/**
 * 03 · Görevler › Liste (`/gorevler`, S2; W42). Tek uç `listProgramWorkItems` + sayaç ucu
 * `countProgramWorkItems` (BE-003) + istemci sekme/arama/sıralama (K3, P4); URL durumu katalogdaki süzgeçler (K10). Eylem görünürlüğü
 * yalnız sunucu olgularından (`capabilities.ts`, P1); mercek yalnız içerik kapsamını seçer
 * (koordinatörlük süzgeci yalnız Admin merceğinde). Panel `gorev` ile (W43), yeni görev W45
 * (`?yeni=1` girişi ve sonucu `useNewTaskEntry`, W48). Kapsam değişince bellekteki durum
 * (panel sekmesi, açık alt görev blokları) ve açık yeni görev formu sıfırlanır.
 */
const store = useScopeStore()
const { standing } = useStanding()
const panelTab = ref<WorkDetailTab>('summary')
const tableKey = ref(0)
const today = istanbulToday()

const url = useTasksUrl(() => {
  panelTab.value = 'summary'
  tableKey.value += 1
  entry.close()
})

const adminLens = computed(() => store.lens === 'admin')
const facts = computed(() => scopeFacts(standing.value, store.programId, store.departmentId))
/** Talep verisi yönetici ve koordinatöre dolar; üyede hep `null` (WORK-K82) → süzgeç/band gizli. */
const showRequests = computed(() => facts.value.companyAdmin || facts.value.coordinator)
const canReview = computed(() => canReviewDateChange({ ...facts.value, assigned: false }))
const canCreate = computed(() => canCreateWorkItem(standing.value, store.programId))

/** Görünür olmayan süzgeçler etkisizdir (K/Ü merceğinde koordinatörlük, üyede talep). */
const state = computed(() => ({
  ...url.state.value,
  requests: showRequests.value && url.state.value.requests,
  department: adminLens.value ? url.state.value.department : null,
  // Üye merceğinde küme zaten "ben" (sunucu süzgeci); kişi seçimi etkisiz.
  people: store.lens === 'member' ? [] : url.state.value.people,
}))

const list = useTaskList(state, showRequests)
const departments = computed(() => list.departments.query.data.value?.departments ?? [])

const loading = computed(() => list.query.isPending.value)
const loadError = computed(() =>
  list.query.isError.value && list.items.value.length === 0
    ? toApiError(list.query.error.value)
    : null,
)
const nextError = computed(() =>
  list.query.isFetchNextPageError.value ? toApiError(list.query.error.value) : null,
)
const isEmpty = computed(() => !loading.value && !loadError.value && list.rows.value.length === 0)
const filtered = computed(() => hasActiveFilters(state.value))
const showPager = computed(
  () =>
    !loading.value &&
    !loadError.value &&
    (list.items.value.length > 0 || list.query.hasNextPage.value),
)
/** Derin bağlantıda hedef kapsam yüklenen satırlardan çözülür: panel ilk sayfadan sonra açılır. */
const panelId = computed(() => (loading.value ? null : state.value.open))

const newTaskDepartment = computed(() => {
  if (adminLens.value) return state.value.department
  const own = coordinatorDepartmentIds(standing.value, store.programId)
  return store.departmentId !== null && own.has(store.departmentId) ? store.departmentId : null
})

function openTask(workItemId: string, tab: WorkDetailTab = 'summary'): void {
  panelTab.value = tab
  void url.update({ open: workItemId }, 'push')
}

const entry = useNewTaskEntry({
  ready: () => standing.value !== null,
  canCreate: () => canCreate.value,
  listDepartment: () => listDepartmentFilter(store.snapshot, state.value.department),
  normalizeUrl: () => void url.update({}),
  open: (id) => openTask(id),
})
const creating = entry.creating

function onSort(field: SortField): void {
  void url.update({ sort: nextSort(state.value.sort, field) })
}

function clearFilters(): void {
  void url.update(clearedFilters(state.value))
}

function retry(): void {
  void list.query.refetch()
}

function loadMore(): void {
  void list.query.fetchNextPage()
}
</script>

<template>
  <section class="tasks-page" data-testid="tasks-page">
    <TasksHead :summary="list.summary.value" :can-create="canCreate" @create="creating = true" />
    <div class="rp-body">
      <div class="tasks-tools">
        <TasksStatusBar
          :tab="state.tab"
          :counts="list.counts.value"
          :requests="state.requests"
          :request-count="list.counts.value ? list.requestCount.value : null"
          :show-requests="showRequests"
          :complete="list.countsExact.value"
          @update:tab="url.update({ tab: $event })"
          @update:requests="url.update({ requests: $event })"
        />
        <TasksFilterBar
          :search="state.search"
          :department="state.department"
          :departments="departments"
          :show-department="adminLens"
          :people="state.people"
          :candidates="list.items.value"
          :person-locked="store.lens === 'member'"
          @update:search="url.update({ search: $event })"
          @update:people="url.update({ people: $event })"
          @update:department="url.update({ department: $event })"
        />
        <RequestBand
          v-if="showRequests && list.requestCount.value > 0"
          :count="list.requestCount.value"
          :departments="list.requestDepartments.value"
          :can-review="canReview"
          :complete="list.complete.value"
        />
      </div>
      <div class="rp-col">
        <UiErrorState
          v-if="loadError"
          :error="loadError"
          :title="tasksText('tasksPage.error')"
          retryable
          :retrying="list.query.isFetching.value"
          @retry="retry"
        />
        <UiEmptyState
          v-else-if="isEmpty && filtered"
          icon="search"
          :title="tasksText('tasksPage.empty.filteredTitle')"
          :text="tasksText('tasksPage.empty.filteredText')"
        >
          <template #action>
            <UiButton size="sm" @click="clearFilters">
              {{ tasksText('tasksPage.empty.clear') }}
            </UiButton>
          </template>
        </UiEmptyState>
        <UiEmptyState
          v-else-if="isEmpty"
          icon="tasks"
          :title="tasksText('tasksPage.empty.title')"
          :text="tasksText('tasksPage.empty.text')"
        >
          <template v-if="canCreate" #action>
            <UiButton size="sm" variant="primary" icon="plus" @click="creating = true">
              {{ tasksText('tasksPage.create') }}
            </UiButton>
          </template>
        </UiEmptyState>
        <TaskTable
          v-else
          :key="tableKey"
          :items="list.rows.value"
          :departments="list.departments.byId.value"
          :selected-id="state.open"
          :sort="state.sort"
          :today="today"
          :loading="loading"
          :href-for="(id) => url.href({ open: id })"
          @open="openTask"
          @sort="onSort"
        />
        <UiErrorState v-if="nextError" :error="nextError" retryable @retry="loadMore" />
        <TasksPager
          v-if="showPager"
          :loaded="list.items.value.length"
          :has-more="list.query.hasNextPage.value"
          :total="list.total.value"
          :loading-more="list.query.isFetchingNextPage.value"
          @more="loadMore"
        />
      </div>
      <div v-if="panelId" class="rp-aside">
        <WorkDetailPanel
          :key="panelId"
          :work-item-id="panelId"
          :initial-tab="panelTab"
          @close="url.update({ open: null }, 'push')"
        />
      </div>
    </div>
    <NewTaskDialog
      v-if="canCreate"
      v-model:open="creating"
      :department-id="newTaskDepartment"
      @created="entry.created"
    />
  </section>
</template>
