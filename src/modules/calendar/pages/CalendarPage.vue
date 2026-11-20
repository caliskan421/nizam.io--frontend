<script setup lang="ts">
import './calendar.css'

import { computed, ref, watch } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { useInstanceStore } from '@/shared/instance/store'
import { UiButton, UiErrorState, UiIconButton } from '@/shared/ui'

import { useCalendarRange } from '../api/queries'
import CalendarGrid from '../components/CalendarGrid.vue'
import CalendarQuick from '../components/CalendarQuick.vue'
import CalendarDay from '../components/CalendarDay.vue'
import MilestoneManager from '../components/MilestoneManager.vue'
import {
  eventIndex,
  formatDay,
  installationDay,
  KINDS,
  monthDays,
  resultTruncated,
  shiftDay,
  shiftMonth,
  type CalendarEvent,
  type Kind,
} from '../model/calendar'
import { useCalendarScope } from '../model/capabilities'

const scope = useCalendarScope()
const instance = useInstanceStore()
const now = ref(new Date())
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const today = computed(() => installationDay(now.value, timezone.value))
const month = ref(shiftMonth(today.value, 0))
const day = ref(today.value)
const dayOpen = ref(false)
const manageOpen = ref(false)
const hidden = ref<Kind[]>([])
const kindOptions = computed(() =>
  (Object.keys(KINDS) as Kind[]).filter(
    (key) => key !== 'date_request' || scope.canSeeRequests.value,
  ),
)
const weeks = computed(() => monthDays(month.value))
const monthRead = useCalendarRange(scope, () => ({
  from: weeks.value[0]![0]!,
  to: weeks.value.at(-1)![6]!,
}))
const quickRead = useCalendarRange(scope, () => ({
  from: shiftDay(today.value, -7),
  to: shiftDay(today.value, 7),
}))
const quickError = computed(() =>
  quickRead.error.value instanceof ApiError ? quickRead.error.value : null,
)
const monthError = computed(() =>
  monthRead.error.value instanceof ApiError ? monthRead.error.value : null,
)
const accessError = computed(
  () =>
    [monthError.value, quickError.value].find(
      (error) => error && [401, 403, 404].includes(error.status ?? 0),
    ) ?? null,
)
const monthResult = computed(() =>
  scope.program.value && !accessError.value && !monthRead.isError.value
    ? monthRead.data.value
    : undefined,
)
const quickResult = computed(() =>
  scope.program.value && !accessError.value && !quickRead.isError.value
    ? quickRead.data.value
    : undefined,
)
const clippedMonth = computed(() =>
  Boolean(monthResult.value?.truncated || resultTruncated(monthResult.value)),
)
const clippedQuick = computed(() =>
  Boolean(quickResult.value?.truncated || resultTruncated(quickResult.value)),
)
const monthTitle = computed(() => formatDay(month.value, { month: 'long', year: 'numeric' }))
const dayEvents = computed(() => {
  const index = eventIndex(monthResult.value, scope.store.snapshot)
  for (const [key, events] of index) {
    index.set(
      key,
      events.filter(
        (event) => kindOptions.value.includes(event.kind) && !hidden.value.includes(event.kind),
      ),
    )
  }
  return index
})
const gridEvents = computed(() => {
  const index = new Map<string, CalendarEvent[]>()
  for (const [key, events] of dayEvents.value) {
    index.set(
      key,
      events.filter((event) => !event.taskMode || (event.taskMode === 'end' && !event.done)),
    )
  }
  return index
})

function moveTo(selected: string) {
  day.value = selected
  if (selected.slice(0, 7) !== month.value.slice(0, 7)) month.value = shiftMonth(selected, 0)
}
function openDay(selected: string) {
  moveTo(selected)
  dayOpen.value = true
}
function goToday() {
  now.value = new Date()
  moveTo(today.value)
}
const retryCalendar = () => Promise.all([monthRead.refetch(), quickRead.refetch()])

function toggleKind(kind: Kind) {
  hidden.value = hidden.value.includes(kind)
    ? hidden.value.filter((value) => value !== kind)
    : [...hidden.value, kind]
}

watch(
  scope.audience,
  () => {
    dayOpen.value = false
    manageOpen.value = false
    hidden.value = []
    goToday()
  },
  { flush: 'sync' },
)
watch(accessError, (error) => {
  if (!error) return
  dayOpen.value = false
  manageOpen.value = false
})
watch(timezone, goToday)
</script>

<template>
  <section class="calendar-page" data-testid="calendar-page">
    <header class="calendar-head">
      <div>
        <h1>Takvim</h1>
        <p>
          Seçili programda erişebildiğiniz toplantılar, görevler ve sezon tarihleri. Ayrıntılar için
          bir gün seçin.
        </p>
      </div>
      <UiButton v-if="scope.admin.value && !accessError" size="sm" @click="manageOpen = true"
        >Kilometre taşlarını yönet</UiButton
      >
    </header>
    <div class="calendar-content">
      <p v-if="!scope.program.value" role="status">
        {{
          scope.status.value === 'loading'
            ? 'Erişim kontrol ediliyor…'
            : 'Takvimi görüntülemek için erişebildiğiniz bir program seçin.'
        }}
      </p>
      <UiErrorState
        v-else-if="accessError"
        title="Takvim açılamadı"
        :error="accessError"
        retryable
        :retrying="monthRead.isFetching.value || quickRead.isFetching.value"
        @retry="retryCalendar"
      />
      <template v-else>
        <CalendarQuick
          :result="quickResult"
          :today="today"
          :scope="scope.store.snapshot"
          :kinds="kindOptions"
          :truncated="clippedQuick"
          :loading="quickRead.isPending.value"
          :fetching="quickRead.isFetching.value"
          :error="quickError"
          @retry="quickRead.refetch()"
          @day="openDay"
        />
        <div class="calendar-toolbar">
          <div class="calendar-controls" aria-label="Ay seçimi" role="group">
            <UiIconButton
              icon="chevron-left"
              label="Önceki ay"
              @click="month = shiftMonth(month, -1)"
            />
            <strong class="calendar-month-title" aria-live="polite">{{ monthTitle }}</strong>
            <UiIconButton
              icon="chevron-right"
              label="Sonraki ay"
              @click="month = shiftMonth(month, 1)"
            />
            <UiButton size="sm" @click="goToday">Bugün</UiButton>
          </div>
          <div class="calendar-controls" aria-label="Gösterilenler" role="group">
            <UiButton
              v-for="kind in kindOptions"
              :key="kind"
              size="sm"
              :aria-pressed="!hidden.includes(kind)"
              class="calendar-kind"
              :data-kind="kind"
              @click="toggleKind(kind)"
              ><i aria-hidden="true"></i>{{ KINDS[kind] }}</UiButton
            >
          </div>
        </div>
        <p v-if="monthRead.isPending.value" role="status">Takvim yükleniyor…</p>
        <UiErrorState
          v-else-if="monthError"
          title="Takvim yüklenemedi"
          :error="monthError"
          retryable
          :retrying="monthRead.isFetching.value"
          @retry="monthRead.refetch()"
        />
        <template v-else-if="monthResult">
          <p v-if="clippedMonth" class="calendar-notice" role="status">
            Takvimde bazı kayıtlar gösterilmiyor. Günlük sayılar yalnız yüklenen kayıtları içerir.
          </p>
          <CalendarGrid
            :title="monthTitle"
            :month="month"
            :weeks="weeks"
            :today="today"
            :days="gridEvents"
            @day="openDay"
          />
        </template>
      </template>
    </div>
    <CalendarDay
      v-model:open="dayOpen"
      :day="day"
      :today="today"
      :days="dayEvents"
      :loading="monthRead.isPending.value"
      :failed="monthRead.isError.value"
      :truncated="clippedMonth"
      @day="moveTo"
    />
    <MilestoneManager v-if="manageOpen && scope.admin.value" v-model:open="manageOpen" :day="day" />
  </section>
</template>
