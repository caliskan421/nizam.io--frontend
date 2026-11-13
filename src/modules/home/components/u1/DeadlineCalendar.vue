<script setup lang="ts">
import { computed, ref } from 'vue'

import { UiIconButton } from '@/shared/ui'

import type { WorkRow } from '../../model/role/common'
import { homeText } from '../../model/messages'
import { monthOf, shiftMonth } from '../../model/role/dates'
import { calendarLegend, monthGrid } from '../../model/u1/calendar'

/**
 * "Son tarihlerim · ‹Ay›" takvimi (E-Ü1-25…27): yüklenen kümedeki açık görevlerin `end_on`
 * günleri; ay gezinmesi AĞSIZ (küme tüm tarihleri kapsar; kapsam değişince sayfa yeniden
 * kurulur → ay bugüne döner). Hafta Pazartesi başlar; hücre `aria-label` "21 Ekim, bugün" /
 * ", geciken son tarih" / ", yaklaşan son tarih". Lejant: geciken = açık ve `is_overdue`;
 * yaklaşan = açık ve `end_on` ≥ bugün (küme geneli, ay değil).
 */
const props = defineProps<{ items: readonly WorkRow[]; today: string; timeZone: string }>()

const month = ref(monthOf(props.today))
const grid = computed(() => monthGrid(month.value, props.today, props.items))
const legend = computed(() => calendarLegend(props.items, props.today))
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const monthLabel = computed(() => {
  const [year, mon] = month.value.split('-').map(Number) as [number, number]
  const name = new Intl.DateTimeFormat('tr-TR', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, mon - 1, 1)),
  )
  return name.charAt(0).toLocaleUpperCase('tr-TR') + name.slice(1)
})

const dayLabel = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

function label(cell: { day: string; today: boolean; overdue: boolean; upcoming: boolean }): string {
  const [y, m, d] = cell.day.split('-').map(Number) as [number, number, number]
  return (
    dayLabel.format(new Date(Date.UTC(y, m - 1, d))) +
    (cell.today ? homeText('home.u1.calendar.today') : '') +
    (cell.overdue ? homeText('home.u1.calendar.overdue') : '') +
    (cell.upcoming ? homeText('home.u1.calendar.upcoming') : '')
  )
}
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="calendar" aria-labelledby="u1-cal">
    <div class="rh-cardhead">
      <h2 id="u1-cal" class="rh-cardtitle" data-testid="u1-cal-title">
        {{ homeText('home.u1.calendar.title', { month: monthLabel }) }}
      </h2>
      <span class="rh-cal__nav">
        <UiIconButton
          icon="chevron-left"
          :label="homeText('home.u1.calendar.prev')"
          data-action="prev"
          @click="month = shiftMonth(month, -1)"
        />
        <UiIconButton
          icon="chevron-right"
          :label="homeText('home.u1.calendar.next')"
          data-action="next"
          @click="month = shiftMonth(month, 1)"
        />
      </span>
    </div>
    <div class="rh-cal">
      <div class="rh-cal__grid" aria-hidden="true">
        <span v-for="d in DAYS" :key="d" class="rh-cal__dow">
          {{ homeText(`home.u1.calendar.weekdays.${d}`) }}
        </span>
      </div>
      <div class="rh-cal__grid" role="list" :aria-label="monthLabel">
        <span
          v-for="cell in grid"
          :key="cell.day"
          class="rh-cal__cell"
          role="listitem"
          :data-day="cell.day"
          :data-out="cell.inMonth ? undefined : 'true'"
          :data-today="cell.today ? 'true' : undefined"
          :aria-label="label(cell)"
        >
          {{ cell.dayNumber }}
          <i v-if="cell.overdue" class="rh-cal__dot rh-cal__dot--late" aria-hidden="true" />
          <i v-else-if="cell.upcoming" class="rh-cal__dot" aria-hidden="true" />
        </span>
      </div>
      <p class="rh-legend rh-cap" data-testid="u1-cal-legend">
        <span>
          <i class="rh-dot rh-dot--late" aria-hidden="true" />
          {{ homeText('home.u1.calendar.legendOverdue', { n: legend.overdue }) }}
        </span>
        <span>
          <i class="rh-dot rh-dot--doing" aria-hidden="true" />
          {{ homeText('home.u1.calendar.legendUpcoming', { n: legend.upcoming }) }}
        </span>
      </p>
    </div>
  </section>
</template>
