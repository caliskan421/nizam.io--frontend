<script setup lang="ts">
import '../components/deleted-records.css'

import { computed, onScopeDispose } from 'vue'
import { RouterLink } from 'vue-router'

import { HOME_ROUTE } from '@/modules/home/public'
import { useStanding } from '@/shared/scope/standing'
import { UiEmptyState, UiIcon } from '@/shared/ui'

import {
  BatchSummary,
  BulkBar,
  DetailPanel,
  FilterBar,
  KindSegment,
  ListState,
  NoticeBar,
  RecordsFooter,
  RecordsHead,
  RecordsTable,
} from '../components'
import { useBatchActions } from '../components/use-batch-actions'
import { useDeletedView } from '../components/use-deleted-view'
import { usePageCounts } from '../components/use-page-counts'
import { usePageFocus } from '../components/use-page-focus'
import { useRecordActions } from '../components/use-record-actions'
import { useSelection } from '../components/use-selection'
import { deletedRecordsCapabilities } from '../model/capabilities'
import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'

/**
 * 12 · Silinen kayıtlar (`/silinen-kayitlar`, S2; F5, F8; P36, P41…P45). Yalnız şirket
 * yöneticisi (`me.company_admin` olgusu; mercek değil). Dört canlı tür ayrı imleçli uçtur, açık
 * sekmenin ucu çağrılır; arama/koordinatörlük/aralık/silen/sıra sunucu parametresidir (BE-117).
 * Kenar menüsünde giriş yoktur; giriş ana sayfa E-01-02 düğmesidir.
 */
const { standing } = useStanding()
const caps = computed(() => deletedRecordsCapabilities(standing.value))
const view = useDeletedView(() => caps.value.view)
const { filters, list } = view
onScopeDispose(view.dispose)

const focus = usePageFocus()
const column = focus.column

const forbidden = computed(() => list.error.value?.status === 403)
const allowed = computed(() => caps.value.view && !forbidden.value)
const denied = computed(() => standing.value !== null && !allowed.value)

const { counts, subtitle } = usePageCounts(
  () => caps.value.view,
  () => filters.value.kind,
)
const listState = computed<'loading' | 'error' | 'empty' | 'filtered' | null>(() => {
  if (list.error.value) return 'error'
  if (list.loading.value) return 'loading'
  if (list.rows.value.length > 0) return null
  return view.filtered.value ? 'filtered' : 'empty'
})

const actions = useRecordActions({
  refresh: () => list.refetch(),
  removed: (row) => {
    if (filters.value.selected === row.id) view.update({ selected: null })
    void focus.afterRemoval()
  },
})

const selection = useSelection(
  () => list.rows.value,
  // Dize anahtarı: yalnız tür/süzgeç/sıra gerçekten değişince sıfırlanır (kimlik değil değer).
  () => `${filters.value.kind}|${JSON.stringify(view.query.value)}`,
)
onScopeDispose(selection.dispose)
const batch = useBatchActions({
  kind: () => filters.value.kind,
  refresh: () => list.refetch(),
  finished: (failedIds) => {
    selection.keepOnly(failedIds)
    void focus.afterRemoval()
  },
})
const busy = computed(() => actions.pending.value || batch.pending.value)

function act(action: 'restore' | 'purge', row: DeletedRow): void {
  focus.remember(list.rows.value.findIndex((candidate) => candidate.key === row.key))
  void (action === 'restore' ? actions.restore(row) : actions.purge(row))
}
function clearSelection(): void {
  selection.clear()
  void focus.toSelectAll()
}
function dismissBatchSummary(): void {
  batch.dismissSummary()
  void focus.toKindButton()
}
function openDepartments(): void {
  actions.dismissNotice()
  view.setKind('koordinatorluk')
  void focus.toKindButton('koordinatorluk')
}
function dismissNotice(): void {
  actions.dismissNotice()
  void focus.toKindButton()
}
</script>

<template>
  <section v-if="allowed" ref="column" class="dr-page" data-testid="deleted-records-page">
    <RecordsHead :subtitle="subtitle" />
    <div class="rp-body">
      <div class="rp-col">
        <div class="dr-note" data-testid="dr-retention">
          <UiIcon name="clock" size="sm" />
          <span>{{ deletedText('page.retention') }}</span>
        </div>
        <div class="dr-toolbar">
          <KindSegment
            :model-value="filters.kind"
            :counts="counts"
            @update:model-value="view.setKind"
          />
          <FilterBar
            :filters="filters"
            :actors="view.candidates.actors.value"
            :departments="view.candidates.departments.value"
            :department-name="list.departmentName"
            @update="view.update"
          />
        </div>
        <BulkBar
          v-if="selection.count.value > 0"
          :count="selection.count.value"
          :busy="busy"
          :can-restore="caps.restore"
          :can-purge="caps.purge"
          @restore="batch.restore(selection.selectedRows.value)"
          @purge="batch.purge(selection.selectedRows.value)"
          @clear="clearSelection"
        />
        <BatchSummary
          v-if="batch.summary.value"
          :summary="batch.summary.value"
          @dismiss="dismissBatchSummary"
        />
        <NoticeBar
          v-if="actions.notice.value"
          :message="actions.notice.value.message"
          :departments-link="actions.notice.value.departmentsLink"
          @departments="openDepartments"
          @dismiss="dismissNotice"
        />
        <ListState
          v-if="listState"
          :state="listState"
          :kind="filters.kind"
          :error="list.error.value"
          :retrying="false"
          @retry="list.refetch()"
          @clear="view.clear()"
        />
        <RecordsTable
          v-else
          :rows="list.rows.value"
          :selected-key="view.selected.value?.key ?? null"
          :sort="view.sort.value"
          :busy="busy"
          :checked-ids="selection.ids.value"
          :all-checked="selection.allSelected.value"
          :some-checked="selection.some.value"
          :timezone="list.timezone.value"
          :now="view.now.value"
          :can-restore="caps.restore"
          :can-purge="caps.purge"
          @select="(row) => view.update({ selected: row.id })"
          @sort="view.setSort"
          @toggle="(row) => selection.toggle(row.id)"
          @toggle-all="selection.toggleAll"
          @restore="(row) => act('restore', row)"
          @purge="(row) => act('purge', row)"
        />
        <RecordsFooter
          v-if="listState !== 'loading' && listState !== 'error'"
          :loaded="list.rows.value.length"
          :total="list.total.value"
          :has-more="list.hasMore.value"
          :loading-more="list.loadingMore.value"
          @more="list.fetchMore()"
        />
        <p class="rp-cap" data-testid="dr-trace">{{ deletedText('page.trace') }}</p>
      </div>
      <aside class="rp-aside">
        <DetailPanel
          :row="view.selected.value"
          :missing="filters.selected !== null && view.selected.value === null"
          :busy="busy"
          :timezone="list.timezone.value"
          :can-restore="caps.restore"
          :can-purge="caps.purge"
          @restore="view.selected.value && act('restore', view.selected.value)"
          @purge="view.selected.value && act('purge', view.selected.value)"
        />
      </aside>
    </div>
  </section>
  <section v-else-if="denied" class="dr-page" data-testid="deleted-records-denied">
    <div class="dr-denied">
      <UiEmptyState icon="lock" :title="deletedText('page.noAccess')">
        <template #action>
          <RouterLink class="t-btn t-btn--secondary t-btn--sm" :to="{ name: HOME_ROUTE.name }">
            {{ deletedText('page.noAccessHome') }}
          </RouterLink>
        </template>
      </UiEmptyState>
    </div>
  </section>
</template>
