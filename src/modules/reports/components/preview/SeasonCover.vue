<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import { percent } from '../../model/format'
import { taskTotals } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'
import PaperKpis, { type PaperKpi } from './PaperKpis.vue'

/**
 * 01f kapak (E-13-20…23): kicker/başlık sabit; program adı `program_name`, yıl `Program.year`;
 * "Oluşturulma" `generated_at`. Gizli (alan yok): konum, dönem tarih aralığı, dosya boyutu,
 * "çalışma grubu" ve "koordinatör" alt notları (BE-136, P39). KPI'lar `stats`/`tasks`'tan.
 */
const props = defineProps<{ ctx: PaperContext; season: SeasonReport }>()

const kpis = computed<PaperKpi[]>(() => {
  const { stats, date_change_stats: requests, meeting_stats: meetings } = props.season
  const totals = taskTotals(props.season.tasks)
  const sub = (key: string, n: number) => t(`reports.season.paper.sub.${key}`, { n })
  const kpi = (key: string) => t(`reports.season.paper.kpi.${key}`)
  return [
    {
      label: kpi('tasks'),
      value: String(stats.total_tasks),
      sub: sub('completed', stats.completed_tasks),
    },
    {
      label: kpi('completion'),
      value: percent(stats.completed_tasks, stats.total_tasks),
      sub: sub('lateDone', totals.lateCompleted),
      tone: 'ok',
    },
    {
      label: kpi('overdue'),
      value: String(stats.overdue_tasks),
      sub: sub('ofOpen', stats.total_tasks - stats.completed_tasks),
      tone: 'danger',
    },
    {
      label: kpi('meetings'),
      value: String(stats.total_meetings),
      sub: sub('notes', meetings.total_notes),
    },
    { label: kpi('coordinatorships'), value: String(stats.total_coordinatorships) },
    { label: kpi('users'), value: String(stats.total_users) },
    { label: kpi('files'), value: String(stats.total_attachments) },
    {
      label: kpi('requests'),
      value: String(requests.total),
      sub: sub('pending', requests.pending),
      tone: 'gold',
    },
  ]
})
const heading = computed(() =>
  props.ctx.year === null
    ? props.ctx.programUpper
    : `${props.ctx.programUpper} · ${props.ctx.year}`,
)
</script>

<template>
  <PaperFrame
    :id="SEASON_IDS.cover"
    :label="t('reports.season.paper.cover.title1') + ' ' + t('reports.season.paper.cover.title2')"
    :ctx="ctx"
    :strip="null"
  >
    <header class="report-band report-band--cover" data-theme="dark">
      <div class="report-band__text">
        <p class="report-kicker">{{ t('reports.season.paper.cover.kicker') }}</p>
        <h2 class="report-band__title report-band__title--cover">
          {{ t('reports.season.paper.cover.title1') }}<br />{{
            t('reports.season.paper.cover.title2')
          }}
        </h2>
        <span class="report-accent" aria-hidden="true" />
        <div class="report-band__text">
          <p class="report-band__sub">{{ heading }}</p>
          <p v-if="ctx.generatedAt" class="report-kicker">
            {{ t('reports.season.paper.cover.created', { at: ctx.generatedAt }) }}
          </p>
        </div>
      </div>
      <span
        class="report-logo report-logo--lg"
        role="img"
        :aria-label="t('reports.season.paper.cover.logo')"
        >{{ ctx.mark }}</span
      >
    </header>
    <section class="report-section" aria-labelledby="report-cover-summary">
      <PaperHeading id="report-cover-summary" :title="t('reports.season.paper.cover.summary')" />
      <PaperKpis :items="kpis" :label="t('reports.season.paper.cover.kpis')" />
    </section>
    <div class="report-section">
      <p class="report-fn">{{ t('reports.season.paper.cover.note1') }}</p>
      <p class="report-fn">{{ t('reports.season.paper.cover.note2') }}</p>
    </div>
  </PaperFrame>
</template>
