<script setup lang="ts">
import { computed } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { UiErrorState, UiIcon, type IconName } from '@/shared/ui'

import {
  eventIndex,
  formatDay,
  KIND_COUNT_LABELS,
  shiftDay,
  type Calendar,
  type CalendarEvent,
  type Kind,
} from '../model/calendar'

const props = defineProps<{
  result: Calendar | undefined
  today: string
  scope: ScopeSnapshot
  kinds: Kind[]
  loading: boolean
  fetching: boolean
  truncated: boolean
  error: ApiError | null
}>()
const emit = defineEmits<{ day: [string]; retry: [] }>()
const dayFormat = (day: string) => formatDay(day, { day: 'numeric', month: 'short' })
const gridDayFormat = (day: string) =>
  formatDay(day, { day: 'numeric', month: 'long', weekday: 'long' })

const quick = computed(() => {
  const index = eventIndex(props.result, props.scope)
  const cards = [
    { label: 'Geçen hafta', from: -7, to: -1, kind: 'past', icon: 'chevron-left' },
    { label: 'Bugün', from: 0, to: 0, kind: 'today', icon: 'calendar' },
    { label: 'Gelecek hafta', from: 1, to: 7, kind: 'next', icon: 'chevron-right' },
  ] satisfies Array<{ label: string; from: number; to: number; kind: string; icon: IconName }>
  return cards.map((card) => {
    const first = shiftDay(props.today, card.from)
    const last = shiftDay(props.today, card.to)
    const entries: CalendarEvent[] = []
    for (let current = first; current <= last; current = shiftDay(current, 1)) {
      entries.push(
        ...(index.get(current) ?? []).filter(
          (event) =>
            props.kinds.includes(event.kind) &&
            (!event.taskMode ||
              (event.taskMode === 'end' && (card.from < 0 || !event.done)) ||
              (event.taskMode === 'start' && card.from >= 0 && !event.done)),
        ),
      )
    }
    return {
      ...card,
      dateLabel: first === last ? gridDayFormat(first) : dayFormat(first) + ' – ' + dayFormat(last),
      day: entries[0]?.day ?? first,
      count: entries.length,
      counts: props.kinds
        .map((kind) => ({
          kind,
          label: KIND_COUNT_LABELS[kind],
          count: entries.filter((entry) => entry.kind === kind).length,
        }))
        .filter((entry) => entry.count),
    }
  })
})
</script>

<template>
  <div>
    <section class="calendar-quick" aria-label="Hızlı bakış" :aria-busy="loading">
      <UiErrorState
        v-if="error"
        title="Hızlı bakış yüklenemedi"
        :error="error"
        retryable
        :retrying="fetching"
        @retry="emit('retry')"
      />
      <p v-else-if="loading" role="status">Hızlı bakış yükleniyor…</p>
      <button
        v-for="card in result ? quick : []"
        :key="card.kind"
        type="button"
        class="t-card calendar-quick__card"
        @click="emit('day', card.day)"
      >
        <span class="calendar-quick__head">
          <strong class="calendar-kind">
            <UiIcon :name="card.icon" size="sm" class="calendar-quick__icon" />
            {{ card.label }}
          </strong>
          <span>{{ card.dateLabel }}</span>
        </span>
        <span class="calendar-quick__number"
          ><strong>{{ truncated ? '≥ ' : '' }}{{ card.count }}</strong> kayıt</span
        >
        <span v-if="card.count" class="calendar-quick__bar" aria-hidden="true"
          ><i
            v-for="entry in card.counts"
            :key="entry.kind"
            :data-kind="entry.kind"
            :style="{ flexGrow: entry.count }"
          ></i
        ></span>
        <span v-else class="calendar-quick__empty">Gösterilecek kayıt yok.</span>
        <span class="calendar-quick__tags"
          ><span
            v-for="entry in card.counts"
            :key="entry.kind"
            class="calendar-kind"
            :data-kind="entry.kind"
            ><i aria-hidden="true"></i>{{ entry.count }} {{ entry.label }}</span
          ></span
        >
      </button>
    </section>
    <p v-if="truncated" class="calendar-notice" role="status">
      Hızlı bakış yalnız yüklenen kayıtları sayıyor.
    </p>
  </div>
</template>
