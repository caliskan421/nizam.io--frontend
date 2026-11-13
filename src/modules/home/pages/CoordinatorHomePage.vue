<script setup lang="ts">
import '../components/role-home.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useMyDateChangeRequests } from '@/modules/timeline/public'
import { canCreateWorkItem, TASKS_NEW_TASK_QUERY, TASKS_ROUTE } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiEmptyState } from '@/shared/ui'

import { useRoleLoad } from '../api/role/use-role-load'
import { useRoster } from '../api/role/use-roster'
import { useToday } from '../api/role/use-today'
import { useUpcomingMeetings } from '../api/role/use-upcoming-meetings'
import ActivityCard from '../components/k1/ActivityCard.vue'
import ApprovalsCard from '../components/k1/ApprovalsCard.vue'
import AttentionCard from '../components/k1/AttentionCard.vue'
import MeetingsCard from '../components/k1/MeetingsCard.vue'
import QuickCard from '../components/k1/QuickCard.vue'
import RequestsCard from '../components/k1/RequestsCard.vue'
import TeamLoadCard from '../components/k1/TeamLoadCard.vue'
import UnassignedCard from '../components/k1/UnassignedCard.vue'
import UnitStrip from '../components/k1/UnitStrip.vue'
import { canCreateMeeting, coordinatedUnitNames } from '../model/capabilities'
import { approvalsOf, attentionOf, requestRows, unassignedOf } from '../model/k1/queues'
import { unitSummary } from '../model/k1/summary'
import { assignedOpenCount, teamLoad } from '../model/k1/team'
import { homeText } from '../model/messages'
import { meetingsLocation } from '../model/role/links'

/**
 * K1 · Koordinatör ana sayfası (`Koord-Ana.dc.html`; E-K1-01…41; P53). `company_admin`
 * olmayan hesabın Koordinatör merceğinde 01 rotasında açılır (`HomeRoute`). Pano uçları K/Ü'ye
 * 403 → HİÇ çağrılmaz; bütün sayılar tek yüklemden (`useRoleLoad`: seçili birim sayaçları +
 * AYNI süzgeçli görev listesi, KESİN 21) ve `listMeetings` / `myDateChangeRequests` /
 * `listMembers` (tek istek) okumalarından. Her bölge bağımsız yüklenir (hata/boş bölge içinde).
 * K1'de rapor girişi YOKTUR (P53, E-K1-41): raporlar yalnız K7 (toplantı) ve K3 (görev).
 */
const store = useScopeStore()
const { standing } = useStanding()
const { today } = useToday()

const unitId = computed(() => store.departmentId)
const ready = computed(() => store.programId !== null && unitId.value !== null)
const facts = computed(() => standing.value)

const load = useRoleLoad(unitId, () => null, ready)
const roster = useRoster(unitId, ready)
const meetings = useUpcomingMeetings(unitId, ready)
const requestsQuery = useMyDateChangeRequests(
  () =>
    store.programId !== null && unitId.value !== null
      ? { programId: store.programId, departmentId: unitId.value }
      : null,
  ready,
)

const units = computed(() => coordinatedUnitNames(facts.value, store.programId))
const unitName = computed(
  () => facts.value?.rows.find((r) => r.departmentId === unitId.value)?.displayName ?? '',
)
const subtitle = computed(() =>
  [
    unitName.value
      ? homeText('home.k1.subtitle', { unit: unitName.value })
      : homeText('home.k1.subtitleNoUnit'),
    units.value.length > 1
      ? homeText('home.k1.multi', { n: units.value.length, names: units.value.join(', ') })
      : null,
  ]
    .filter(Boolean)
    .join(' · '),
)

const items = computed(() => load.items.value)
const countsError = computed(() =>
  load.counts.isError.value && !load.counts.data.value ? toApiError(load.counts.error.value) : null,
)
const listError = computed(() =>
  load.list.isError.value && load.items.value.length === 0
    ? toApiError(load.list.error.value)
    : null,
)
const listLoading = computed(() => !load.list.data.value && !listError.value)
const summary = computed(() =>
  load.counts.data.value
    ? unitSummary(load.counts.data.value, items.value, load.complete.value)
    : null,
)
const partial = computed(
  () => !load.complete.value && !load.loadingMore.value && !listLoading.value,
)
const approvals = computed(() => approvalsOf(items.value))
const unassigned = computed(() => unassignedOf(items.value))
const members = computed(() =>
  teamLoad(roster.members.value, items.value, facts.value?.accountId ?? null),
)
const requestData = computed(() =>
  requestRows(requestsQuery.data.value?.requests ?? [], items.value),
)
const attention = computed(() => attentionOf(items.value, requestsQuery.data.value?.requests ?? []))
const meetingsError = computed(() =>
  meetings.query.isError.value ? toApiError(meetings.query.error.value) : null,
)
const requestsError = computed(() =>
  requestsQuery.isError.value ? toApiError(requestsQuery.error.value) : null,
)
const rosterError = computed(() =>
  roster.query.isError.value ? toApiError(roster.query.error.value) : null,
)

const showTask = computed(() => canCreateWorkItem(facts.value, store.programId))
const showMeeting = computed(() => canCreateMeeting(facts.value, store.programId))
const retryList = () => void load.list.refetch()
const retryCounts = () => void load.counts.refetch()
</script>

<template>
  <section class="role-home" data-testid="home-page" data-home="k1">
    <div class="rh-head">
      <div>
        <h1 v-if="facts" class="rh-greeting" data-testid="home-greeting">
          {{ homeText('home.greeting', { name: facts.fullName }) }}
        </h1>
        <span v-else class="rh-skel rh-skel--greet" aria-hidden="true" />
        <p v-if="subtitle" class="rh-sub" data-testid="k1-subtitle">{{ subtitle }}</p>
      </div>
      <div class="rh-actions">
        <RouterLink
          v-if="showMeeting"
          class="t-btn t-btn--secondary"
          :to="meetingsLocation()"
          data-testid="k1-meeting"
        >
          {{ homeText('home.k1.actions.meeting') }}
        </RouterLink>
        <RouterLink
          v-if="showTask"
          class="t-btn t-btn--primary"
          :to="{ name: TASKS_ROUTE.name, query: TASKS_NEW_TASK_QUERY }"
          data-testid="k1-task"
        >
          {{ homeText('home.k1.actions.task') }}
        </RouterLink>
      </div>
    </div>
    <div v-if="!ready" class="rh-body">
      <UiEmptyState
        icon="coords"
        :title="homeText('home.kpi.selectTitle')"
        :text="homeText('home.kpi.selectText')"
        data-testid="role-select"
      />
    </div>
    <div v-else class="rh-body">
      <UnitStrip
        :unit="unitName"
        :summary="summary"
        :loading="!summary && !countsError"
        :error="countsError"
        :retrying="load.counts.isFetching.value"
        @retry="retryCounts"
      />
      <div class="rh-col">
        <ApprovalsCard
          :items="approvals"
          :count="summary?.pending ?? approvals.length"
          :today="today"
          :loading="listLoading"
          :error="listError"
          :retrying="load.list.isFetching.value"
          @retry="retryList"
        />
        <UnassignedCard
          :items="unassigned"
          :today="today"
          :partial="partial"
          :loading="listLoading"
          :error="listError"
          :retrying="load.list.isFetching.value"
          @retry="retryList"
        />
        <AttentionCard
          :rows="attention"
          :loading="listLoading"
          :error="listError"
          :retrying="load.list.isFetching.value"
          @retry="retryList"
        />
        <TeamLoadCard
          :rows="members"
          :assigned="assignedOpenCount(items)"
          :partial="partial"
          :loading="roster.query.isLoading.value || listLoading"
          :error="rosterError ?? listError"
          :retrying="roster.query.isFetching.value || load.list.isFetching.value"
          @retry="() => (rosterError ? roster.query.refetch() : retryList())"
        />
      </div>
      <aside class="rh-aside" :aria-label="homeText('home.k1.quick.title')">
        <QuickCard :show-task="showTask" :show-meeting="showMeeting" />
        <MeetingsCard
          :views="meetings.views.value"
          :total="meetings.total.value"
          :more="meetings.more.value"
          :loading="meetings.query.isLoading.value"
          :error="meetingsError"
          :retrying="meetings.query.isFetching.value"
          @retry="() => meetings.query.refetch()"
        />
        <RequestsCard
          :rows="requestData.rows"
          :pending="requestData.pending"
          :decided="requestData.decided"
          :loading="requestsQuery.isLoading.value"
          :error="requestsError"
          :retrying="requestsQuery.isFetching.value"
          @retry="() => requestsQuery.refetch()"
        />
        <ActivityCard />
      </aside>
    </div>
  </section>
</template>
