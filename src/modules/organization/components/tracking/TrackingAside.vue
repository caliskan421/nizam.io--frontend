<script setup lang="ts">
import { computed } from 'vue'

import { UiIconButton } from '@/shared/ui'

import { trackingText } from './messages'
import {
  calendarWeeks,
  distribution,
  monthName,
  shiftMonth,
  STATUS_DOT,
  type TrackingItem,
} from './model'

/**
 * E-05-68…75 — "Takvim ve özet" yan sütunu. Takvim: `end_on` ayına düşen AÇIK görevler, tek
 * nokta (kaçırılan = `is_overdue` öncelikli, yoksa yaklaşan); bugün kurulum saat dilimi; gün
 * tıklaması yok; ay URL `ay` (çağıran yazar). Durum dağılımı: açık görevlerin 4 durumu
 * (`iade_edildi` ayrı dilim, P5); dilim genişliği tek dinamik değer `--pt-share`.
 */
const props = defineProps<{ items: readonly TrackingItem[]; month: string; today: string }>()
const emit = defineEmits<{ 'update:month': [month: string] }>()

const DOW = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'] as const
const SEGMENT = {
  baslanmadi: 'todo',
  devam_ediyor: 'doing',
  onaya_sunuldu: 'review',
  iade_edildi: 'back',
} as const

const name = computed(() => monthName(props.month))
const weeks = computed(() => calendarWeeks(props.month, props.items, props.today))
const dist = computed(() => distribution(props.items))
const shown = computed(() => dist.value.slices.filter((s) => s.count > 0))
</script>

<template>
  <aside class="rp-aside" :aria-label="trackingText('userTracking.aside')">
    <section class="t-card pt-card-box" data-calendar>
      <div class="rp-cardhead">
        <h2 class="rp-cardtitle" data-calendar-title>
          {{ trackingText('userTracking.calendar.title', { month: name }) }}
        </h2>
        <div class="rp-actions">
          <UiIconButton
            class="pt-calnav"
            icon="chevron-left"
            :label="trackingText('userTracking.calendar.prev')"
            data-month-prev
            @click="emit('update:month', shiftMonth(month, -1))"
          />
          <UiIconButton
            class="pt-calnav"
            icon="chevron-right"
            :label="trackingText('userTracking.calendar.next')"
            data-month-next
            @click="emit('update:month', shiftMonth(month, 1))"
          />
        </div>
      </div>
      <div
        role="grid"
        class="pt-cal"
        :aria-label="
          trackingText('userTracking.calendar.grid', { month: name, year: month.slice(0, 4) })
        "
      >
        <div role="row" class="pt-cal__row">
          <span v-for="d in DOW" :key="d" role="columnheader" class="rp-kicker pt-cal__dow">{{
            trackingText(`userTracking.calendar.dow.${d}`)
          }}</span>
        </div>
        <div v-for="(week, w) in weeks" :key="w" role="row" class="pt-cal__row">
          <span
            v-for="(cell, c) in week"
            :key="c"
            role="gridcell"
            class="pt-cal__cell"
            :class="{
              'pt-cal__cell--today': cell.today,
              'pt-cal__cell--due': cell.kind !== null && !cell.today,
              'pt-cal__cell--past': cell.past,
            }"
            :aria-label="cell.label || undefined"
            :data-day="cell.day ?? undefined"
            :data-kind="cell.kind ?? undefined"
            >{{ cell.day ?? ''
            }}<span
              v-if="cell.kind"
              class="pt-cal__mark"
              :class="`pt-cal__mark--${cell.kind}`"
              aria-hidden="true"
          /></span>
        </div>
      </div>
      <div class="pt-legend rp-cap">
        <span class="rp-status"
          ><span class="rp-dot rp-dot--late pt-dot-sm" />{{
            trackingText('userTracking.calendar.legendLate')
          }}</span
        >
        <span class="rp-status"
          ><span class="rp-dot rp-dot--soon pt-dot-sm" />{{
            trackingText('userTracking.calendar.legendSoon')
          }}</span
        >
      </div>
    </section>

    <section class="t-card pt-card-box" data-distribution>
      <h2 class="rp-cardtitle pt-dist-title">
        {{ trackingText('userTracking.distribution.title') }}
      </h2>
      <div class="rp-bar pt-dist" role="img" :aria-label="dist.label" data-dist-bar>
        <span
          v-for="slice in shown"
          :key="slice.status"
          :class="`rp-seg-${SEGMENT[slice.status]}`"
          :style="{ '--pt-share': `${slice.share}%` }"
          :data-slice="slice.status"
        />
      </div>
      <dl class="rp-dl">
        <template v-for="slice in dist.slices" :key="slice.status">
          <dt>
            <span class="rp-status"
              ><span class="rp-dot" :class="`rp-dot--${STATUS_DOT[slice.status]}`" />{{
                trackingText(`userTracking.distribution.label.${slice.status}`)
              }}</span
            >
          </dt>
          <dd class="rp-mono" :data-count="slice.status">{{ slice.count }}</dd>
        </template>
      </dl>
    </section>
  </aside>
</template>
