<script setup lang="ts">
import '../components/deleted-records.css'

import { computed, nextTick, onScopeDispose, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { HOME_ROUTE } from '@/modules/home/public'
import { useStanding } from '@/shared/scope/standing'
import { DesignStub, UiEmptyState, UiIcon } from '@/shared/ui'

import {
  DetailPanel,
  FilterBar,
  KindSegment,
  ListState,
  NoticeBar,
  RecordsFooter,
  RecordsTable,
} from '../components'
import { useDeletedView } from '../components/use-deleted-view'
import { useRecordActions } from '../components/use-record-actions'
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

const column = ref<HTMLElement | null>(null)
let focusIndex = -1

const forbidden = computed(() => list.error.value?.status === 403)
const allowed = computed(() => caps.value.view && !forbidden.value)
const denied = computed(() => standing.value !== null && !allowed.value)

const kindName = computed(() => deletedText(`kindNames.${filters.value.kind}`))
const count = computed(() => (list.loading.value || list.error.value ? null : list.total.value))
const subtitle = computed(() =>
  count.value === null
    ? deletedText('page.sub.idle')
    : deletedText('page.sub.loaded', { n: count.value, kind: kindName.value }),
)
const listState = computed<'loading' | 'error' | 'empty' | 'filtered' | null>(() => {
  if (list.error.value) return 'error'
  if (list.loading.value) return 'loading'
  if (list.rows.value.length > 0) return null
  return view.filtered.value ? 'filtered' : 'empty'
})

async function focusAfterRemoval(): Promise<void> {
  await nextTick()
  const rows = [...(column.value?.querySelectorAll<HTMLElement>('[data-record-key]') ?? [])]
  const target =
    rows[Math.min(Math.max(focusIndex, 0), rows.length - 1)] ??
    column.value?.querySelector<HTMLElement>('[data-testid="dr-kinds"] [aria-pressed="true"]')
  target?.focus()
}

const actions = useRecordActions({
  refresh: () => list.refetch(),
  removed: (row) => {
    if (filters.value.selected === row.id) view.update({ selected: null })
    void focusAfterRemoval()
  },
})

function act(action: 'restore' | 'purge', row: DeletedRow): void {
  focusIndex = list.rows.value.findIndex((candidate) => candidate.key === row.key)
  void (action === 'restore' ? actions.restore(row) : actions.purge(row))
}
/** Bildirim kalkınca odak gövdeye düşmez: verilen (yoksa seçili) tür düğmesine döner (KESİN 27). */
async function focusKindButton(kind?: string): Promise<void> {
  await nextTick()
  const kinds = column.value?.querySelector('[data-testid="dr-kinds"]')
  const target = kind
    ? kinds?.querySelector<HTMLElement>(`[data-kind="${kind}"]`)
    : kinds?.querySelector<HTMLElement>('[aria-pressed="true"]')
  target?.focus()
}
function openDepartments(): void {
  actions.dismissNotice()
  view.setKind('koordinatorluk')
  void focusKindButton('koordinatorluk')
}
function dismissNotice(): void {
  actions.dismissNotice()
  void focusKindButton()
}
</script>

<template>
  <section v-if="allowed" ref="column" class="dr-page" data-testid="deleted-records-page">
    <div class="rp-head">
      <div>
        <h1 class="rp-h1">{{ deletedText('page.title') }}</h1>
        <p class="rp-sub" data-testid="dr-sub">{{ subtitle }}</p>
      </div>
      <div class="rp-actions">
        <DesignStub id="BE-116">
          <button
            type="button"
            class="t-btn t-btn--secondary"
            disabled
            data-testid="dr-csv"
            :title="deletedText('head.soonHint')"
          >
            <UiIcon name="download" size="sm" />{{ deletedText('head.csv') }}
          </button>
        </DesignStub>
        <DesignStub id="BE-115">
          <button
            type="button"
            class="t-btn t-btn--ghost dr-danger"
            disabled
            data-testid="dr-empty-trash"
            :title="deletedText('head.soonHint')"
          >
            <UiIcon name="trash" size="sm" />{{ deletedText('head.trash') }}
          </button>
        </DesignStub>
      </div>
    </div>
    <div class="rp-body">
      <div class="rp-col">
        <div class="dr-note" data-testid="dr-retention">
          <UiIcon name="clock" size="sm" />
          <span>{{ deletedText('page.retention') }}</span>
        </div>
        <div class="dr-toolbar">
          <KindSegment
            :model-value="filters.kind"
            :count="count === null ? null : String(count)"
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
          :busy="actions.pending.value"
          :timezone="list.timezone.value"
          :now="view.now.value"
          :can-restore="caps.restore"
          :can-purge="caps.purge"
          @select="(row) => view.update({ selected: row.id })"
          @sort="view.setSort"
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
          :busy="actions.pending.value"
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
