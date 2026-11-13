<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import { DesignStub } from '@/shared/ui'

import { percent, share } from '../../model/format'
import type { PaperContext } from '../../model/paper-context'
import {
  distribution,
  SEASON_PRIORITIES,
  SEASON_STATUSES,
  taskTotals,
  type DepartmentSection,
} from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperBand from './PaperBand.vue'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'
import PaperKpis, { type PaperKpi } from './PaperKpis.vue'

/**
 * Yönetici özeti (E-13-25…27): bant, 8 KPI, durum/öncelik dağılımı ve koordinatörlük
 * karşılaştırması. Zamanında/geç tamamlanan `tasks`'tan istemci sayımı; "gündem a/b" ve dosya
 * boyutu gizli; karşılaştırmada DOSYA sütunu "—" (alan yok, BE-136).
 */
const props = defineProps<{
  ctx: PaperContext
  season: SeasonReport
  sections: readonly DepartmentSection[]
}>()

const totals = computed(() => taskTotals(props.season.tasks))
const kpis = computed<PaperKpi[]>(() => {
  const { stats, date_change_stats: req } = props.season
  const open = stats.total_tasks - stats.completed_tasks
  const x = totals.value
  const kpi = (key: string) => t(`reports.season.paper.kpi.${key}`)
  const sub = (key: string, named: Record<string, unknown>) =>
    t(`reports.season.paper.sub.${key}`, named)
  return [
    { label: kpi('tasks'), value: String(stats.total_tasks), sub: sub('open', { n: open }) },
    {
      label: kpi('completion'),
      value: percent(stats.completed_tasks, stats.total_tasks),
      sub: sub('ratio', { a: stats.completed_tasks, b: stats.total_tasks }),
      tone: 'ok',
    },
    {
      label: kpi('overdue'),
      value: String(stats.overdue_tasks),
      sub: sub('openShare', { pct: percent(stats.overdue_tasks, open) }),
      tone: 'danger',
    },
    {
      label: kpi('onTime'),
      value: String(x.onTimeCompleted + x.earlyCompleted),
      sub: sub('early', { n: x.earlyCompleted }),
      tone: 'ok',
    },
    {
      label: kpi('lateDone'),
      value: String(x.lateCompleted),
      sub: sub('doneShare', { pct: percent(x.lateCompleted, x.completed) }),
      tone: 'danger',
    },
    { label: kpi('meetings'), value: String(stats.total_meetings) },
    { label: kpi('files'), value: String(stats.total_attachments) },
    {
      label: kpi('requests'),
      value: String(req.total),
      sub: sub('requests', { a: req.approved, r: req.rejected, p: req.pending }),
      tone: 'gold',
    },
  ]
})
const status = computed(() => distribution(SEASON_STATUSES, props.season.task_status_distribution))
const priority = computed(() => distribution(SEASON_PRIORITIES, props.season.priority_distribution))
</script>

<template>
  <PaperFrame
    :id="SEASON_IDS.summary"
    :label="t('reports.season.paper.summary.title')"
    :ctx="ctx"
    :strip="t('reports.season.paper.strip', { program: ctx.programUpper })"
  >
    <PaperBand
      :kicker="t('reports.season.paper.summary.kicker', { program: ctx.programUpper })"
      :title="t('reports.season.paper.summary.title')"
      :sub="
        t('reports.season.paper.summary.sub', {
          c: season.stats.total_coordinatorships,
          t: season.stats.total_tasks,
          m: season.stats.total_meetings,
        })
      "
    />
    <PaperKpis :items="kpis" :label="t('reports.season.paper.summary.kpis')" />
    <div class="report-split">
      <section class="report-section" aria-labelledby="report-sum-status">
        <PaperHeading
          id="report-sum-status"
          :title="t('reports.season.paper.summary.statusHeading')"
          :aside="t('reports.season.paper.summary.taskCount', { n: status.total })"
        />
        <div class="report-bars">
          <div v-for="row in status.rows" :key="row.key" class="report-bar" :data-status="row.key">
            <span class="rp-trunc">{{ t(`reports.season.paper.status.${row.key}`) }}</span>
            <span class="report-track" aria-hidden="true" :class="`report-st-${row.key}`"
              ><span :style="{ width: `${row.width}%` }"
            /></span>
            <span class="report-bar__n"
              ><span>{{ row.count }}</span
              ><span>{{ percent(row.count, status.total) }}</span></span
            >
          </div>
        </div>
      </section>
      <section class="report-section" aria-labelledby="report-sum-priority">
        <PaperHeading
          id="report-sum-priority"
          :title="t('reports.season.paper.summary.priorityHeading')"
          :aside="t('reports.season.paper.summary.taskCount', { n: priority.total })"
        />
        <div class="report-bars">
          <div
            v-for="row in priority.rows"
            :key="row.key"
            class="report-bar"
            :data-priority="row.key"
          >
            <span class="rp-trunc">{{ t(`reports.season.paper.priority.${row.key}`) }}</span>
            <span class="report-track" aria-hidden="true" :class="`report-pr-${row.key}`"
              ><span :style="{ width: `${row.width}%` }"
            /></span>
            <span class="report-bar__n"
              ><span>{{ row.count }}</span
              ><span>{{ percent(row.count, priority.total) }}</span></span
            >
          </div>
        </div>
      </section>
    </div>
    <section class="report-section" aria-labelledby="report-sum-compare">
      <PaperHeading
        id="report-sum-compare"
        :title="t('reports.season.paper.summary.compare')"
        :aside="t('reports.season.paper.summary.sections', { n: sections.length })"
      />
      <p v-if="sections.length === 0" class="report-emptyline">
        {{ t('reports.season.paper.summary.empty') }}
      </p>
      <div v-else class="report-scroll">
        <div
          class="report-table report-cols-compare"
          role="table"
          aria-labelledby="report-sum-compare"
        >
          <div class="report-tr report-tr--head" role="row">
            <span role="columnheader">{{ t('reports.season.paper.summary.cols.name') }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.summary.cols.tasks')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.summary.cols.done')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.summary.cols.late')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.summary.cols.meetings')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.summary.cols.files')
            }}</span>
            <span role="columnheader">{{ t('reports.season.paper.summary.progress') }}</span>
          </div>
          <div
            v-for="(section, index) in sections"
            :key="section.id"
            class="report-tr"
            :class="{ 'report-tr--zebra': index % 2 === 1 }"
            role="row"
          >
            <span role="cell"
              ><strong>{{ section.name }}</strong
              ><span class="report-n2"
                >{{ t('reports.season.paper.toc.kind')
                }}{{ section.code ? ` · ${section.code}` : '' }}</span
              ></span
            >
            <span class="report-c" role="cell">{{ section.totals.total }}</span>
            <span class="report-c" role="cell">{{ section.totals.completed }}</span>
            <span
              class="report-c"
              :class="{ 'report-danger': section.totals.overdue > 0 }"
              role="cell"
              >{{ section.totals.overdue }}</span
            >
            <span class="report-c" role="cell">{{ section.meetingCount }}</span>
            <span class="report-c" role="cell"><DesignStub id="BE-136">—</DesignStub></span>
            <span class="report-prog" role="cell"
              ><span class="report-track" aria-hidden="true"
                ><span
                  :style="{
                    width: `${share(section.totals.completed, section.totals.total)}%`,
                  }" /></span
              ><span class="report-r">{{
                percent(section.totals.completed, section.totals.total)
              }}</span></span
            >
          </div>
          <div class="report-tr report-tr--total" role="row">
            <span role="cell">{{ t('reports.season.paper.summary.total') }}</span>
            <span class="report-c" role="cell">{{ season.stats.total_tasks }}</span>
            <span class="report-c" role="cell">{{ season.stats.completed_tasks }}</span>
            <span class="report-c report-danger" role="cell">{{ season.stats.overdue_tasks }}</span>
            <span class="report-c" role="cell">{{ season.stats.total_meetings }}</span>
            <span class="report-c" role="cell">{{ season.stats.total_attachments }}</span>
            <span class="report-prog" role="cell"
              ><span class="report-track" aria-hidden="true"
                ><span
                  :style="{
                    width: `${share(season.stats.completed_tasks, season.stats.total_tasks)}%`,
                  }" /></span
              ><span class="report-r">{{
                percent(season.stats.completed_tasks, season.stats.total_tasks)
              }}</span></span
            >
          </div>
        </div>
      </div>
      <p class="report-fn">{{ t('reports.season.paper.summary.note') }}</p>
    </section>
  </PaperFrame>
</template>
