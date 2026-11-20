<script setup lang="ts">
import { computed, ref } from 'vue'

import { UiButton, UiIconButton, UiModal } from '@/shared/ui'

import {
  formatDay,
  KINDS,
  KIND_COUNT_LABELS,
  relativeDay,
  shiftDay,
  WEEKDAYS,
  weekDays,
  type CalendarEvent,
  type Kind,
  type TaskMode,
} from '../model/calendar'

const props = defineProps<{
  day: string
  today: string
  days: ReadonlyMap<string, CalendarEvent[]>
  loading: boolean
  failed: boolean
  truncated: boolean
}>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ day: [string] }>()
const events = computed(() => props.days.get(props.day) ?? [])
const groups = computed(() =>
  (Object.keys(KINDS) as Kind[])
    .map((kind) => ({
      kind,
      label: KINDS[kind],
      countLabel: KIND_COUNT_LABELS[kind],
      events: events.value.filter((event) => event.kind === kind),
    }))
    .filter((group) => group.events.length),
)
const modes: Record<TaskMode, string> = {
  end: 'Bitecek',
  start: 'Başlayacak',
  ongoing: 'Devam eden',
}
const activeModes = ref<Record<TaskMode, boolean>>({ end: true, start: true, ongoing: false })
const dayName = (day: string) => formatDay(day, { day: 'numeric', month: 'long', weekday: 'long' })
const relative = computed(() => relativeDay(props.day, props.today))

function taskModeCount(mode: TaskMode) {
  return events.value.filter((event) => event.taskMode === mode).length
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="formatDay(day, { day: 'numeric', month: 'long', year: 'numeric' })"
    :description="[formatDay(day, { weekday: 'long' }), relative].filter(Boolean).join(' · ')"
  >
    <div class="calendar-day">
      <div class="calendar-controls">
        <UiIconButton
          icon="chevron-left"
          label="Önceki gün"
          @click="emit('day', shiftDay(day, -1))"
        />
        <UiIconButton
          icon="chevron-right"
          label="Sonraki gün"
          @click="emit('day', shiftDay(day, 1))"
        />
      </div>
      <div class="calendar-week-strip" role="group" aria-label="Haftanın günleri">
        <button
          v-for="(entry, index) in weekDays(day)"
          :key="entry"
          type="button"
          :aria-pressed="entry === day"
          :aria-current="entry === today ? 'date' : undefined"
          :aria-label="dayName(entry)"
          @click="emit('day', entry)"
        >
          <span>{{ WEEKDAYS[index] }}</span
          ><strong>{{ Number(entry.slice(-2)) }}</strong>
          <span
            class="calendar-week-dot"
            :data-active="!!days.get(entry)?.length"
            aria-hidden="true"
          ></span>
        </button>
      </div>
      <p v-if="loading" role="status">Gün yükleniyor…</p>
      <p v-else-if="failed" role="alert">Günün kayıtları alınamadı. Takvimden yeniden deneyin.</p>
      <template v-else>
        <p v-if="truncated" class="calendar-notice" role="status">Bazı kayıtlar gösterilmiyor.</p>
        <p v-if="!groups.length">Bu gün için gösterilecek kayıt yok.</p>
        <div v-else class="calendar-day__counts" aria-label="Günün kayıtları">
          <span
            v-for="group in groups"
            :key="group.kind"
            :data-kind="group.kind"
            class="calendar-kind"
            ><i aria-hidden="true"></i>{{ group.events.length }} {{ group.countLabel }}</span
          >
        </div>
        <section
          v-for="group in groups"
          :key="group.kind"
          :data-kind="group.kind"
          class="calendar-day__section"
        >
          <h3 class="calendar-kind"><i aria-hidden="true"></i>{{ group.label }}</h3>
          <template v-if="group.kind === 'task'">
            <div class="calendar-controls" role="group" aria-label="Görev grupları">
              <UiButton
                v-for="(label, mode) in modes"
                :key="mode"
                size="sm"
                :aria-pressed="activeModes[mode]"
                @click="activeModes[mode] = !activeModes[mode]"
              >
                {{ label }} {{ taskModeCount(mode) }}
              </UiButton>
            </div>
            <p v-if="!group.events.some((event) => event.taskMode && activeModes[event.taskMode])">
              Görevleri görmek için bir grup seçin.
            </p>
          </template>
          <ul class="calendar-event-list">
            <li
              v-for="event in group.events.filter(
                (event) => !event.taskMode || activeModes[event.taskMode],
              )"
              :key="event.key"
            >
              <component
                :is="event.to ? 'RouterLink' : 'div'"
                :to="event.to"
                class="calendar-event-row"
                @click="event.to && (open = false)"
              >
                <span v-if="event.label" class="calendar-event-row__label">{{ event.label }}</span>
                <span class="calendar-event-row__text">
                  <strong>{{ event.title }}</strong>
                  <span v-if="event.table">{{ event.table.name }} · {{ event.table.column }}</span>
                  <span v-if="event.detail">{{ event.detail }}</span>
                  <span v-if="event.navigationHint">{{ event.navigationHint }}</span>
                  <span v-if="event.table?.outsideUnit"
                    >Tabloyu açmak için ilgili koordinatörlüğü seçin.</span
                  >
                </span>
                <span v-if="event.live" class="calendar-event-row__live">Canlı</span>
              </component>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </UiModal>
</template>
