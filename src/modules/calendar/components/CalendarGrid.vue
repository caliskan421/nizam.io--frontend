<script setup lang="ts">
import { formatDay, WEEKDAYS, type CalendarEvent } from '../model/calendar'

defineProps<{
  title: string
  month: string
  weeks: string[][]
  today: string
  days: ReadonlyMap<string, CalendarEvent[]>
}>()
const emit = defineEmits<{ day: [string] }>()
const gridDayFormat = (day: string) =>
  formatDay(day, { day: 'numeric', month: 'long', weekday: 'long' })
</script>

<template>
  <table class="calendar-grid" :aria-label="title">
    <thead>
      <tr>
        <th v-for="weekday in WEEKDAYS" :key="weekday" scope="col">{{ weekday }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="week in weeks" :key="week[0]">
        <td v-for="entry in week" :key="entry">
          <button
            type="button"
            class="calendar-cell"
            :aria-current="entry === today ? 'date' : undefined"
            :data-out="entry.slice(0, 7) !== month.slice(0, 7)"
            :aria-label="gridDayFormat(entry) + ' · ' + (days.get(entry)?.length ?? 0) + ' kayıt'"
            @click="emit('day', entry)"
          >
            <span class="calendar-cell__day">{{ Number(entry.slice(-2)) }}</span>
            <span
              v-for="event in days.get(entry)?.slice(0, 4)"
              :key="event.kind + ':' + event.key"
              class="calendar-cell__event"
              :data-kind="event.kind"
              :data-late="event.late"
            >
              <i aria-hidden="true"></i
              ><span>{{ [event.label, event.title].filter(Boolean).join(' · ') }}</span>
            </span>
            <span v-if="(days.get(entry)?.length ?? 0) > 4" class="calendar-cell__more"
              >+{{ (days.get(entry)?.length ?? 0) - 4 }} <span>daha</span></span
            >
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
