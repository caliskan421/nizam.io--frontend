<script setup lang="ts">
import './tracking.css'

import { computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { useScopeStore } from '@/shared/scope/store'
import {
  DesignStub,
  UiButton,
  UiErrorState,
  UiPlaceholder,
  UiSegmented,
  UiTabs,
  type UiChoiceOption,
} from '@/shared/ui'

import { usePersonWorkItems, useProgramDepartmentIndex } from '../../api'
import { orderedRoles, programRoles } from '../../model/memberships'
import { USERS_ROUTE } from '../../routes'
import { UserPanel, type PersonalTrackingProps } from '../index'
import { personUnits } from './assign'
import { trackingText } from './messages'
import {
  cardItems,
  cardViews,
  groupRows,
  istanbulToday,
  monthOf,
  trackingCounts,
  type TrackingGrouping,
} from './model'
import TrackingAside from './TrackingAside.vue'
import TrackingCards from './TrackingCards.vue'
import TrackingHead from './TrackingHead.vue'
import TrackingTable from './TrackingTable.vue'
import { usePersonProfile } from './use-person-profile'
import { useTrackingUrl, type TrackingTab } from './use-tracking-url'

/**
 * W76 · 05b Kişisel takip (E-05-40…75). Görev kümesi TEK sorgu: `usePersonWorkItems` (program
 * geneli `listProgramWorkItems`, sonuna dek sayfalama, `assignedSubset` — KESİN 21; 05 yan panel
 * özetiyle AYNI anahtar). Departman fan-out'u yok (K3). Kartlar, sekme sayacı, liste başlığı,
 * tablo, takvim ve dağılım bu kümeden türetilir; imleç bitmediyse "yüklenen kayıtlar içinde"
 * (§10). Kümede çağıranın görebildiği görevler vardır (P13). URL: `sekme`, `kart`, `grupla`,
 * `ay`. "Dosyalar" (BE-046) ve "Etkinlik" (BE-015) nötr yer tutucu; "Hesap ve roller" 05 yan
 * paneli (`UserPanel`, gömülü). Belge başlığı "RoketPortal — ‹ad›" (P9).
 */
const props = defineProps<PersonalTrackingProps>()

const store = useScopeStore()
const router = useRouter()
const url = useTrackingUrl(() => props.accountId)
const state = url.state
const today = istanbulToday()

const work = usePersonWorkItems(() => props.accountId)
const items = work.items
const loading = computed(() => work.query.isPending.value)
const loadError = computed(() =>
  work.query.isError.value && work.query.data.value === undefined
    ? toApiError(work.query.error.value)
    : null,
)
const settled = computed(() => work.complete.value || work.query.isError.value)
const partial = computed(() => !loading.value && loadError.value === null && !work.complete.value)
const nextError = computed(() => work.query.isFetchNextPageError.value)

const profile = usePersonProfile(() => props.accountId, items, settled)
const departments = useProgramDepartmentIndex()
const units = computed(() =>
  personUnits(profile.user.value, store.programId, departments.byId.value),
)
const roles = computed(() =>
  profile.user.value ? orderedRoles(programRoles(profile.user.value, store.programId)) : [],
)
const codes = computed(() => {
  const map = new Map<string, string>()
  for (const d of departments.departments.value) if (d.code) map.set(d.department_id, d.code)
  return map
})
const personName = computed(
  () =>
    profile.name.value ??
    (profile.resolved.value ? trackingText('organization.tracking.unknownPerson') : null),
)

const cards = computed(() => (loading.value ? null : cardViews(trackingCounts(items.value))))
const selected = computed(() => cardItems(items.value, state.value.card))
const groups = computed(() => groupRows(selected.value, state.value.grouping, today))
const month = computed(() => state.value.month ?? monthOf(today))
const caption = computed(() =>
  trackingText('organization.tracking.toolbar.caption', {
    list: trackingText(`organization.tracking.toolbar.list.${state.value.card}`),
    n: selected.value.length,
  }),
)

const tabs = computed<UiChoiceOption<TrackingTab>[]>(() => [
  {
    value: 'gorevler',
    label: trackingText('organization.tracking.tabs.gorevler'),
    count: loading.value || loadError.value ? undefined : selected.value.length,
  },
  { value: 'dosyalar', label: trackingText('organization.tracking.tabs.dosyalar') },
  { value: 'etkinlik', label: trackingText('organization.tracking.tabs.etkinlik') },
  { value: 'hesap', label: trackingText('organization.tracking.tabs.hesap') },
])
const tab = computed({
  get: () => state.value.tab,
  set: (value: TrackingTab) => void url.update({ tab: value }),
})
const groupings = computed<UiChoiceOption<TrackingGrouping>[]>(() => [
  { value: 'son-tarih', label: trackingText('organization.tracking.toolbar.byDue') },
  { value: 'durum', label: trackingText('organization.tracking.toolbar.byStatus') },
])

function setGrouping(value: TrackingGrouping | null): void {
  if (value !== null) void url.update({ grouping: value })
}

function retry(): void {
  void work.query.refetch()
}

function retryNext(): void {
  void work.query.fetchNextPage()
}

function onDeleted(): void {
  void router.push({ name: USERS_ROUTE.name })
}

const previousTitle = document.title
watch(
  personName,
  (name) => {
    if (name) document.title = trackingText('organization.tracking.documentTitle', { name })
  },
  { immediate: true },
)
onBeforeUnmount(() => (document.title = previousTitle))
</script>

<template>
  <section class="pt-page" data-testid="personal-tracking">
    <TrackingHead
      :account-id="accountId"
      :name="profile.name.value"
      :resolved="profile.resolved.value"
      :roles="roles"
      :units="units"
    />
    <div class="pt-body">
      <UiErrorState
        v-if="loadError"
        :error="loadError"
        :title="trackingText('organization.tracking.cards.error')"
        retryable
        data-load-error
        @retry="retry"
      />
      <TrackingCards
        v-else
        :cards="cards"
        :selected="state.card"
        @select="(card) => void url.update({ card })"
      />
      <p v-if="partial" class="rp-cap pt-partial" role="status" data-partial>
        {{ trackingText('organization.tracking.cards.partial') }}
        <UiButton v-if="nextError" variant="ghost" size="sm" data-retry-next @click="retryNext">
          {{ trackingText('organization.tracking.retry') }}
        </UiButton>
      </p>
      <UiTabs
        v-model="tab"
        :options="tabs"
        :label="trackingText('organization.tracking.tabs.label')"
      >
        <template #default="{ value }">
          <div v-if="value === 'gorevler'" class="pt-panel" data-panel="gorevler">
            <template v-if="!loadError">
              <div class="rp-toolbar">
                <UiSegmented
                  :model-value="state.grouping"
                  :options="groupings"
                  :label="trackingText('organization.tracking.toolbar.grouping')"
                  @update:model-value="setGrouping"
                />
                <span class="rp-grow" />
                <span class="rp-cap" data-list-caption>{{ caption }}</span>
              </div>
              <div class="pt-split">
                <div class="rp-col">
                  <TrackingTable
                    :name="personName ?? ''"
                    :groups="groups"
                    :codes="codes"
                    :today="today"
                    :loading="loading"
                  />
                </div>
                <TrackingAside
                  :items="items"
                  :month="month"
                  :today="today"
                  @update:month="(ay) => void url.update({ month: ay })"
                />
              </div>
            </template>
          </div>
          <div v-else-if="value === 'dosyalar'" class="pt-panel" data-panel="dosyalar">
            <DesignStub id="BE-046" as="div">
              <UiPlaceholder
                kind="soon"
                :text="trackingText('organization.tracking.tabs.filesSoon')"
              />
            </DesignStub>
          </div>
          <div v-else-if="value === 'etkinlik'" class="pt-panel" data-panel="etkinlik">
            <DesignStub id="BE-015" as="div">
              <UiPlaceholder
                kind="soon"
                :text="trackingText('organization.tracking.tabs.activitySoon')"
              />
            </DesignStub>
          </div>
          <div v-else class="pt-panel" data-panel="hesap">
            <UserPanel :account-id="accountId" embedded @deleted="onDeleted" />
          </div>
        </template>
      </UiTabs>
    </div>
  </section>
</template>
