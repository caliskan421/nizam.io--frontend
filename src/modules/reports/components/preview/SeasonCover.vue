<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import { formatBytes, formatDay, percent } from '../../model/format'
import { coverHeading, periodSource, taskTotals } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'
import PaperKpis, { type PaperKpi } from './PaperKpis.vue'

/**
 * 01f kapak (E-13-20…23): kicker/başlık sabit; program adı `program_name`, yıl `program_year`
 * (yoksa `Program.year`), konum `program_location` (yalnız dolu ise; PDF kapağıyla aynı
 * "‹yıl› · ‹konum›"); "Oluşturulma" `generated_at`. "Dönemin özeti" yanında dönem aralığı `period`
 * (BE-136): dipnot `period.source`'a göre söyler (tasks: görev uçları, program: programın beyan
 * ettiği dönem, range: istenen aralık; bilinmeyen = tasks); aralık yoksa çizilmez. Gizli: "çalışma
 * grubu" alt notu. KPI'lar `stats`/`tasks`'tan; kullanıcı alt notu koordinatör
 * sayısı, dosya alt notu toplam boyut.
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
    {
      label: kpi('users'),
      value: String(stats.total_users),
      sub: sub('coordinators', stats.total_coordinators),
    },
    {
      label: kpi('files'),
      value: String(stats.total_attachments),
      sub: formatBytes(stats.total_attachment_bytes) ?? undefined,
    },
    {
      label: kpi('requests'),
      value: String(requests.total),
      sub: sub('pending', requests.pending),
      tone: 'gold',
    },
  ]
})
const year = computed(() => props.season.program_year ?? props.ctx.year)
const heading = computed(() =>
  coverHeading([props.ctx.programUpper, year.value, props.season.program_location]),
)
const periodNote = computed(() =>
  t(`reports.season.paper.cover.periodNote.${periodSource(props.season.period?.source)}`),
)
const period = computed(() => {
  const p = props.season.period
  const range = p ? [formatDay(p.start_on), formatDay(p.end_on)] : []
  return range[0] && range[1] ? `${range[0]} – ${range[1]}` : null
})
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
      <PaperHeading
        id="report-cover-summary"
        :title="t('reports.season.paper.cover.summary')"
        :aside="period ?? undefined"
      />
      <PaperKpis :items="kpis" :label="t('reports.season.paper.cover.kpis')" />
    </section>
    <div class="report-section">
      <p v-if="period" class="report-fn" data-testid="cover-period-note">
        {{ periodNote }}
      </p>
      <p class="report-fn">{{ t('reports.season.paper.cover.note1') }}</p>
      <p class="report-fn">{{ t('reports.season.paper.cover.note2') }}</p>
    </div>
  </PaperFrame>
</template>
