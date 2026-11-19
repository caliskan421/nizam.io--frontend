<script setup lang="ts">
import { computed } from 'vue'

import { categoryLabel, dayLabel } from '../model/format'
import { AUDIT_CATEGORIES, type AuditSummary } from '../model/types'

const props = defineProps<{ days: AuditSummary['activity_30d']; from: string; to: string }>()
const emit = defineEmits<{ day: [selected: string, extend: boolean] }>()
const max = computed(() => Math.max(1, ...props.days.map((day) => day.total)))
function describe(day: AuditSummary['activity_30d'][number]): string {
  const breakdown = AUDIT_CATEGORIES.filter((category) => day.by_category[category]).map(
    (category) => `${categoryLabel(category)} ${day.by_category[category]}`,
  )
  return [dayLabel(day.date), `${day.total} işlem`, ...breakdown].join(' · ')
}
function selected(day: string): boolean {
  return Boolean(
    (props.from || props.to) &&
    (!props.from || day >= props.from) &&
    (!props.to || day <= props.to),
  )
}
</script>

<template>
  <section class="t-card audit-strip" aria-label="Son 30 gün">
    <div class="audit-strip__head">
      <span class="rp-kicker">son 30 gün</span>
      <span class="rp-cap">Bir güne tıkla · aralık için Shift ile tıkla</span>
    </div>
    <div class="audit-strip__scroll">
      <div class="audit-strip__bars" aria-label="Günlük işlem sayısı">
        <button
          v-for="day in days"
          :key="day.date"
          type="button"
          :aria-pressed="selected(day.date)"
          :title="describe(day)"
          :aria-label="describe(day)"
          @click="emit('day', day.date, $event.shiftKey)"
        >
          <span
            class="audit-strip__stack"
            aria-hidden="true"
            :style="{ height: `${(day.total / max) * 100}%` }"
          >
            <span
              v-for="category in AUDIT_CATEGORIES"
              :key="category"
              :data-category="category"
              :style="{ flexGrow: day.by_category[category] ?? 0 }"
            />
          </span>
        </button>
      </div>
    </div>
    <div v-if="days.length" class="audit-strip__head rp-cap">
      <span>{{ dayLabel(days[0]!.date) }}</span
      ><span>Bugün</span>
    </div>
    <div class="audit-strip__legend">
      <span v-for="category in AUDIT_CATEGORIES" :key="category" :data-category="category">
        {{ categoryLabel(category) }}
      </span>
    </div>
  </section>
</template>
