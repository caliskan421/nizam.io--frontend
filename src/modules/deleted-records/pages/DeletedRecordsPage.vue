<script setup lang="ts">
import '../components/deleted-records.css'

import { RouterLink } from 'vue-router'

import { HOME_ROUTE } from '@/modules/home/public'
import { UiEmptyState, UiIcon } from '@/shared/ui'

import {
  BatchSummary,
  BulkBar,
  DetailPanel,
  ExportCard,
  FilterBar,
  KindSegment,
  ListState,
  NoticeBar,
  PurgeAllPanel,
  RecordsFooter,
  RecordsHead,
  RecordsTable,
} from '../components'
import { useDeletedPage } from '../components/use-deleted-page'
import { deletedText } from '../model/messages'
import { isUnifiedView } from '../model/kinds'
import { supportsPurgeAll } from '../model/purge-all'

/**
 * 12 · Silinen kayıtlar (`/silinen-kayitlar`, S2; F5, F8, F10; P36, P41…P45). Yalnız şirket
 * yöneticisi (`me.company_admin` olgusu; mercek değil). Tek türlü görünümler tipli listesini,
 * `Tümü` ve `Not ve gündem` birleşik sunucu listesini okur (açık görünümün ucu çağrılır; arama/koordinatörlük/aralık/silen/sıra sunucu parametresidir (BE-117).
 * Kenar menüsünde giriş yoktur; giriş ana sayfa E-01-02 düğmesidir. Bileşim `use-deleted-page`.
 */
const {
  caps,
  view,
  filters,
  list,
  column,
  allowed,
  denied,
  counts,
  subtitle,
  listState,
  actions,
  selection,
  batch,
  purgeAll,
  exporter,
  busy,
  act,
  clearSelection,
  dismissBatchSummary,
  openDepartments,
  dismissNotice,
  closePurgeAll,
  dismissPurgeSummary,
} = useDeletedPage()
</script>

<template>
  <section v-if="allowed" ref="column" class="dr-page" data-testid="deleted-records-page">
    <RecordsHead
      :subtitle="subtitle"
      :purge-all-on="supportsPurgeAll(filters.kind)"
      :purge-all-open="purgeAll.panel.value || purgeAll.running.value"
      :busy="busy"
      :exporting="exporter.state.value.kind === 'running'"
      @purge-all="purgeAll.open"
      @export-csv="exporter.start"
    />
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
        <ExportCard
          v-if="exporter.state.value.kind !== 'idle'"
          :running="exporter.state.value.kind === 'running'"
          :failure="exporter.state.value.kind === 'failed' ? exporter.state.value.failure : null"
          @cancel="exporter.cancel"
          @retry="exporter.start"
          @dismiss="exporter.dismiss"
        />
        <PurgeAllPanel
          v-if="(purgeAll.panel.value || purgeAll.running.value) && supportsPurgeAll(filters.kind)"
          :kind="filters.kind"
          :count="counts?.[filters.kind] ?? null"
          :running="purgeAll.running.value"
          :progress="purgeAll.progress.value"
          @confirm="purgeAll.confirm"
          @cancel="closePurgeAll"
          @stop="purgeAll.stop"
        />
        <BatchSummary
          v-if="purgeAll.summary.value"
          :summary="purgeAll.summary.value"
          @dismiss="dismissPurgeSummary"
        />
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
          :sort-locked="isUnifiedView(filters.kind)"
          :busy="busy"
          :checked-ids="selection.ids.value"
          :all-checked="selection.allSelected.value"
          :some-checked="selection.some.value"
          :timezone="list.timezone.value"
          :now="view.now.value"
          :can-restore="caps.restore"
          :can-purge="caps.purge"
          @select="view.select"
          @sort="view.setSort"
          @open-parent="view.openParent"
          @toggle="(row) => selection.toggle(row.key)"
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
          @open-parent="view.selected.value && view.openParent(view.selected.value)"
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
