<script setup lang="ts">
import '../components/role-home.css'

import { computed, ref } from 'vue'

import { useMyProgramDepartments } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiEmptyState } from '@/shared/ui'
import { UiButton } from '@/shared/ui'

import { useRoleFacts } from '../api/role/use-facts'
import { openCount } from '../model/role/common'
import { useRoleLoad } from '../api/role/use-role-load'
import { useToday } from '../api/role/use-today'
import { useUnreadCount } from '../api/role/use-unread-count'
import { useUpcomingMeetings } from '../api/role/use-upcoming-meetings'
import MeetingsCard from '../components/k1/MeetingsCard.vue'
import DeadlineCalendar from '../components/u1/DeadlineCalendar.vue'
import NotificationsCard from '../components/u1/NotificationsCard.vue'
import NoteDialog from '../components/u1/NoteDialog.vue'
import QuickTiles from '../components/u1/QuickTiles.vue'
import SummaryStrip from '../components/u1/SummaryStrip.vue'
import TodayQueue from '../components/u1/TodayQueue.vue'
import UnitsCard from '../components/u1/UnitsCard.vue'
import UploadDialog from '../components/u1/UploadDialog.vue'
import { homeText } from '../model/messages'
import { lensAssignee } from '@/modules/work/public'
import { isOpen } from '../model/role/common'
import { unitBreakdown } from '../model/u1/departments'

/**
 * Ü1 · Üye ana sayfası (`Uye-Ana.dc.html`; E-Ü1-01…33; P53). `company_admin` olmayan hesabın
 * Üye merceğinde 01 rotasında açılır (`HomeRoute`). Pano uçları 403 → çağrılmaz. TEK yükleme
 * (`useRoleLoad`): `countProgramWorkItems` + `listProgramWorkItems` `assignee_account_id` = ben,
 * `department_id` YOK (program geneli; W135 varsayımı 2) — kart, kuyruk, takvim ve birim kırılımı
 * aynı kümeden (KESİN 21); ek: `listMeetings` (`from` = bugün) ve `countUnreadNotifications`.
 * Alt başlıktaki birim adı kapsam etiketidir. Her bölge bağımsız yüklenir. Rapor girişi YOKTUR
 * (E-Ü1-33; P47).
 */
const store = useScopeStore()
const { standing } = useStanding()
const facts = useRoleFacts()
const { today, timeZone } = useToday()

const me = computed(() => lensAssignee(store.lens, standing.value?.accountId))
const ready = computed(() => store.programId !== null && me.value !== null)

const load = useRoleLoad(() => null, me, ready)
const meetings = useUpcomingMeetings(() => null, ready)
const unread = useUnreadCount()
const myUnits = useMyProgramDepartments()

const unitNames = computed(
  () => new Map(myUnits.departments.value.map((d) => [d.departmentId, d.displayName])),
)
const unitName = computed(() =>
  store.departmentId === null ? '' : (unitNames.value.get(store.departmentId) ?? ''),
)
const subtitle = computed(() =>
  unitName.value
    ? homeText('home.u1.subtitle', { unit: unitName.value })
    : homeText('home.u1.subtitleNoUnit'),
)

const items = computed(() => load.items.value)
const countsError = computed(() =>
  load.counts.isError.value && !load.counts.data.value ? toApiError(load.counts.error.value) : null,
)
const listError = computed(() =>
  load.list.isError.value && items.value.length === 0 ? toApiError(load.list.error.value) : null,
)
const listLoading = computed(() => !load.list.data.value && !listError.value)
const meetingsError = computed(() =>
  meetings.query.isError.value ? toApiError(meetings.query.error.value) : null,
)
const units = computed(() => unitBreakdown(myUnits.departments.value, items.value))
// Kısmi küme (CX-F6-E-03): sunucu sayacı varsa kesin açık toplam o; yoksa türev "≥".
const openTotal = computed(() =>
  load.counts.data.value ? openCount(load.counts.data.value) : null,
)
const scope = computed(() => load.scope.value)
const loaded = computed(() => load.loaded.value)

const openItems = computed(() => items.value.filter(isOpen))
const uploadable = computed(() => openItems.value.filter((i) => facts.canUpload(i)))
const notable = computed(() => openItems.value.filter((i) => facts.canNote(i)))

const uploadOpen = ref(false)
const uploadPreset = ref<string | null>(null)
const noteOpen = ref(false)

function openUpload(preset: string | null = null): void {
  uploadPreset.value = preset
  uploadOpen.value = true
}
</script>

<template>
  <section class="role-home" data-testid="home-page" data-home="u1">
    <div class="rh-head">
      <div>
        <h1 v-if="standing" class="rh-greeting" data-testid="home-greeting">
          {{ homeText('home.greeting', { name: standing.fullName }) }}
        </h1>
        <span v-else class="rh-skel rh-skel--greet" aria-hidden="true" />
        <p class="rh-sub" data-testid="u1-subtitle">{{ subtitle }}</p>
      </div>
      <div class="rh-actions">
        <UiButton
          v-if="uploadable.length > 0"
          variant="primary"
          icon="file-upload"
          data-testid="u1-upload"
          @click="openUpload()"
        >
          {{ homeText('home.u1.upload') }}
        </UiButton>
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
      <SummaryStrip
        :counts="load.counts.data.value ?? null"
        :loading="!load.counts.data.value && !countsError"
        :error="countsError"
        :retrying="load.counts.isFetching.value"
        @retry="() => load.counts.refetch()"
      />
      <div class="rh-col">
        <TodayQueue
          :items="items"
          :today="today"
          :unit-names="unitNames"
          :loading="listLoading"
          :error="listError"
          :retrying="load.list.isFetching.value"
          :open-total="openTotal"
          :scope="scope"
          :loaded="loaded"
          @retry="() => load.list.refetch()"
          @more="load.loadMore()"
          @evidence="(item) => openUpload(item.work_item_id)"
        />
        <QuickTiles
          :next-meeting="meetings.views.value[0] ?? null"
          :can-upload="uploadable.length > 0"
          :can-note="notable.length > 0"
          @upload="openUpload()"
          @note="noteOpen = true"
        />
        <NotificationsCard :unread="unread.data.value ?? null" />
      </div>
      <aside class="rh-aside" :aria-label="homeText('home.u1.calendar.legendUpcoming', { n: 0 })">
        <DeadlineCalendar
          :items="items"
          :today="today"
          :time-zone="timeZone"
          :scope="scope"
          :loaded="loaded"
        />
        <MeetingsCard
          member
          :views="meetings.views.value"
          :total="meetings.total.value"
          :more="meetings.more.value"
          :loading="meetings.query.isLoading.value"
          :error="meetingsError"
          :retrying="meetings.query.isFetching.value"
          @retry="() => meetings.query.refetch()"
        />
        <UnitsCard
          :rows="units"
          :loading="listLoading || myUnits.query.isLoading.value"
          :scope="scope"
          :loaded="loaded"
        />
      </aside>
    </div>
    <UploadDialog v-model:open="uploadOpen" :items="uploadable" :preset="uploadPreset" />
    <NoteDialog v-model:open="noteOpen" :items="notable" />
  </section>
</template>
