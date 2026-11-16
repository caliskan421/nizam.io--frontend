<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import { monthLabel, percent } from '../../model/format'
import { shiftDays, topRequested, activityExtras } from '../../model/season-extras'
import type { PaperContext } from '../../model/paper-context'
import { activity } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperBand from './PaperBand.vue'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'
import PaperKpis, { type PaperKpi } from './PaperKpis.vue'
import SeasonWorkload from './SeasonWorkload.vue'

/**
 * Teknofest geneli (E-13-29…31): aylık aktivite (yalnız gerçek seri; tanım JSON'a göre:
 * oluşturulan + tamamlanan görev, toplantı, mesaj; not/dosya/tarih talebi dönem toplamları dipnotta),
 * tarih değişikliği talepleri (4 KPI + onaylananlarda "ortalama kayma" + "en çok talep alan
 * görevler" tablosu, BE-136) ve iş yükü bölümü CANLI
 * (`workload_summary`; ikinci ağır JSON okunmaz, BE-134; `SeasonWorkload`). Grafik `role="img"` ile metin özeti taşır.
 */
const props = defineProps<{ ctx: PaperContext; season: SeasonReport }>()

const series = computed(() => activity(props.season))
const chartLabel = computed(() => {
  const { rows, peak, total } = series.value
  const first = rows[0]
  const last = rows[rows.length - 1]
  if (!first || !last || !peak) return t('reports.season.paper.general.activityEmpty')
  return t('reports.season.paper.general.activityLabel', {
    from: monthLabel(first.month, true),
    to: monthLabel(last.month, true),
    peak: monthLabel(peak.month, true),
    n: peak.count,
    total,
  })
})
const shift = computed(() => shiftDays(props.season))
const top = computed(() => topRequested(props.season))
const extras = computed(() => activityExtras(props.season))
const requests = computed<PaperKpi[]>(() => {
  const r = props.season.date_change_stats
  const g = (key: string) => t(`reports.season.paper.general.${key}`)
  return [
    { label: g('reqTotal'), value: String(r.total), sub: g('reqPeriod') },
    {
      label: g('reqApproved'),
      value: String(r.approved),
      sub: shift.value
        ? `${percent(r.approved, r.total)} · ${t('reports.season.paper.general.avgShortShift', { n: shift.value })}`
        : percent(r.approved, r.total),
      tone: 'ok',
    },
    {
      label: g('reqRejected'),
      value: String(r.rejected),
      sub: percent(r.rejected, r.total),
      tone: 'danger',
    },
    {
      label: g('reqPending'),
      value: String(r.pending),
      sub: t('reports.season.paper.general.reqPendingSub', { pct: percent(r.pending, r.total) }),
      tone: 'gold',
    },
  ]
})
</script>

<template>
  <PaperFrame
    :id="SEASON_IDS.general"
    :label="t('reports.season.paper.general.title')"
    :ctx="ctx"
    :strip="t('reports.season.paper.strip', { program: ctx.programUpper })"
  >
    <PaperBand
      :kicker="t('reports.season.paper.general.kicker', { program: ctx.programUpper })"
      :title="t('reports.season.paper.general.title')"
      :sub="t('reports.season.paper.general.sub')"
    />
    <section class="report-section" aria-labelledby="report-gen-activity">
      <PaperHeading
        id="report-gen-activity"
        :title="t('reports.season.paper.general.activity')"
        :aside="t('reports.season.paper.general.activityTotal', { n: series.total })"
      />
      <p v-if="series.rows.length === 0" class="report-emptyline">
        {{ t('reports.season.paper.general.activityEmpty') }}
      </p>
      <div v-else role="img" :aria-label="chartLabel" data-testid="activity-chart">
        <div class="report-chart">
          <span class="report-chart__grid" aria-hidden="true" style="bottom: 100%">
            <span>{{ series.max }}</span>
          </span>
          <span class="report-chart__grid" aria-hidden="true" style="bottom: 50%">
            <span>{{ Math.round(series.max / 2) }}</span>
          </span>
          <div v-for="row in series.rows" :key="row.month" class="report-chart__col">
            <span class="report-chart__v">{{ row.count }}</span>
            <span class="report-chart__bar" :style="{ height: `${row.height}%` }" />
          </div>
        </div>
        <div class="report-chart__x">
          <span v-for="row in series.rows" :key="row.month">{{ monthLabel(row.month) }}</span>
        </div>
      </div>
      <p class="report-fn">{{ t('reports.season.paper.general.activityNote') }}</p>
      <p v-if="extras" class="report-fn" data-testid="activity-extras">
        {{ t('reports.season.paper.general.activityExtras', extras) }}
      </p>
    </section>
    <section class="report-section" aria-labelledby="report-gen-requests">
      <PaperHeading
        id="report-gen-requests"
        :title="t('reports.season.paper.general.requests')"
        :aside="shift ? t('reports.season.paper.general.avgShift', { n: shift }) : undefined"
      />
      <PaperKpis :items="requests" :label="t('reports.season.paper.general.requestsKpis')" />
      <template v-if="top.length > 0">
        <p class="report-label">{{ t('reports.season.paper.general.topRequested') }}</p>
        <div
          class="report-table report-cols-top"
          role="table"
          :aria-label="t('reports.season.paper.general.topRequested')"
          data-testid="top-requested"
        >
          <div
            v-for="(row, index) in top"
            :key="row.id"
            class="report-tr"
            :class="{ 'report-tr--zebra': index % 2 === 1 }"
            role="row"
          >
            <span class="report-mono" role="cell">{{ row.code ?? '—' }}</span>
            <strong class="rp-trunc" role="cell">{{ row.title }}</strong>
            <span class="report-r" role="cell">{{
              t('reports.season.paper.general.requestCount', { n: row.count })
            }}</span>
          </div>
        </div>
      </template>
    </section>
    <SeasonWorkload :season="season" />
  </PaperFrame>
</template>
