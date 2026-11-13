<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import { percent } from '../../model/format'
import type { PaperContext } from '../../model/paper-context'
import { lateness, taskDates, type DepartmentSection } from '../../model/season-view'
import { upper } from '../../model/format'
import { t } from '../text'
import { departmentAnchor } from './ids'
import PaperBand from './PaperBand.vue'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'
import PaperKpis, { type PaperKpi } from './PaperKpis.vue'
import PaperStub from './PaperStub.vue'

/**
 * Koordinatörlük bölümü (E-13-32…36): bant, künye, 5 KPI, durum şeridi ve görev tablosu CANLI
 * (`coordinatorship_performance` + `tasks`); "#" sıra numarası gizli (BE-005, satır sırası
 * `created_at`), dosya sayıları/boyutları, üye adları ve görev detay/toplantı/dosya kartları
 * gizli ya da STATİK yer tutucu (BE-136, BE-123). Boş bölüm "Bu koordinatörlükte görev yok.".
 */
const props = defineProps<{ ctx: PaperContext; section: DepartmentSection }>()

const kpis = computed<PaperKpi[]>(() => {
  const s = props.section
  const kpi = (key: string) => t(`reports.season.paper.kpi.${key}`)
  return [
    {
      label: kpi('tasks'),
      value: String(s.totals.total),
      sub: t('reports.season.paper.sub.completed', { n: s.totals.completed }),
    },
    {
      label: kpi('completion'),
      value: percent(s.totals.completed, s.totals.total),
      sub: t('reports.season.paper.sub.ratio', { a: s.totals.completed, b: s.totals.total }),
      tone: 'ok',
    },
    {
      label: kpi('overdueShort'),
      value: String(s.totals.overdue),
      sub: t('reports.season.paper.sub.openTask'),
      tone: 'danger',
    },
    {
      label: kpi('lateShort'),
      value: String(s.totals.lateCompleted),
      sub: t('reports.season.paper.sub.ofDone', { n: s.totals.completed }),
      tone: 'danger',
    },
    { label: kpi('meetings'), value: String(s.meetingCount) },
  ]
})
const stripLabel = computed(() =>
  t('reports.season.paper.dept.strip', {
    parts: props.section.strip
      .map((r) => `${r.count} ${t(`reports.season.paper.status.${r.key}`)}`)
      .join(', '),
  }),
)
const kicker = computed(() =>
  props.section.code
    ? t('reports.season.paper.dept.kicker', { code: props.section.code })
    : t('reports.season.paper.dept.kickerBare'),
)

function lateText(task: DepartmentSection['tasks'][number]): string {
  const { kind, days } = lateness(task)
  return kind === 'none' ? '—' : t(`reports.season.paper.dept.lateness.${kind}`, { n: days })
}
</script>

<template>
  <PaperFrame
    :id="departmentAnchor(section.id)"
    :label="section.name"
    :ctx="ctx"
    :strip="t('reports.season.paper.strip', { program: ctx.programUpper })"
  >
    <PaperBand
      :kicker="kicker"
      :title="upper(section.name)"
      :sub="
        t('reports.season.paper.dept.sub', {
          t: section.totals.total,
          m: section.meetingCount,
          u: section.memberCount,
        })
      "
    />
    <dl class="report-kunye">
      <template v-if="section.description">
        <dt>{{ t('reports.season.paper.dept.description') }}</dt>
        <dd>{{ section.description }}</dd>
      </template>
      <template v-if="section.coordinators.length > 0">
        <dt>{{ t('reports.season.paper.dept.coordinators') }}</dt>
        <dd>{{ section.coordinators.join(', ') }}</dd>
      </template>
      <dt>{{ t('reports.season.paper.dept.members', { n: section.memberCount }) }}</dt>
      <dd />
    </dl>
    <PaperKpis five :items="kpis" :label="t('reports.season.paper.dept.kpis')" />
    <div class="report-section">
      <span class="report-track" role="img" :aria-label="stripLabel">
        <span
          v-for="row in section.strip"
          :key="row.key"
          :class="`report-st-${row.key}`"
          :style="{ width: `${row.width}%` }"
        />
      </span>
      <div class="report-legend">
        <span v-for="row in section.strip" :key="row.key" :class="`report-st-${row.key}`">
          <i class="report-swatch" aria-hidden="true" />{{
            t(`reports.season.paper.status.${row.key}`)
          }}
          <b class="report-mono">{{ row.count }}</b>
        </span>
      </div>
    </div>
    <section class="report-section" :aria-labelledby="`${departmentAnchor(section.id)}-tasks`">
      <PaperHeading
        :id="`${departmentAnchor(section.id)}-tasks`"
        :title="t('reports.season.paper.dept.tasks')"
        :aside="t('reports.season.paper.dept.taskCount', { n: section.tasks.length })"
      />
      <p v-if="section.tasks.length === 0" class="report-emptyline">
        {{ t('reports.season.paper.dept.empty') }}
      </p>
      <div v-else class="report-scroll">
        <div
          class="report-table report-cols-tasks"
          role="table"
          :aria-labelledby="`${departmentAnchor(section.id)}-tasks`"
        >
          <div class="report-tr report-tr--head" role="row">
            <span role="columnheader">{{ t('reports.season.paper.dept.cols.task') }}</span>
            <span role="columnheader">{{ t('reports.season.paper.dept.cols.status') }}</span>
            <span role="columnheader">{{ t('reports.season.paper.dept.cols.priority') }}</span>
            <span role="columnheader">{{ t('reports.season.paper.dept.cols.date') }}</span>
            <span role="columnheader">{{ t('reports.season.paper.dept.cols.assignees') }}</span>
            <span role="columnheader">{{ t('reports.season.paper.dept.cols.late') }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.dept.cols.notes')
            }}</span>
          </div>
          <div
            v-for="(task, index) in section.tasks"
            :key="task.work_item_id"
            class="report-tr"
            :class="{ 'report-tr--zebra': index % 2 === 1 }"
            role="row"
            :data-task="task.work_item_id"
          >
            <strong role="cell">{{ task.title }}</strong>
            <span role="cell">
              <span class="report-status" :class="`report-st-${task.status}`"
                ><i class="report-dot" aria-hidden="true" />{{
                  t(`reports.season.paper.status.${task.status}`)
                }}</span
              >
            </span>
            <span role="cell" :class="`report-pr-${task.priority}`">
              <template v-if="task.priority === 'acil'"
                ><span class="report-pill">{{
                  t('reports.season.paper.dept.urgent')
                }}</span></template
              ><template v-else>{{ t(`reports.season.paper.priority.${task.priority}`) }}</template>
            </span>
            <span class="report-mono" role="cell"
              >{{ taskDates(task).start }}<br />{{ taskDates(task).end
              }}<span v-if="taskDates(task).plan" class="report-n2">{{
                t('reports.season.paper.dept.plan', { d: taskDates(task).plan })
              }}</span></span
            >
            <span role="cell">{{
              task.assignees.length > 0
                ? task.assignees.map((a) => a.full_name).join(', ')
                : t('reports.season.paper.dept.unassigned')
            }}</span>
            <span
              role="cell"
              :class="{
                'report-danger':
                  lateness(task).kind === 'overdue' || lateness(task).kind === 'late',
              }"
              >{{ lateText(task) }}</span
            >
            <span class="report-c" role="cell">{{ task.note_count }}</span>
          </div>
        </div>
      </div>
      <p class="report-fn">{{ t('reports.season.paper.dept.note') }}</p>
    </section>
    <PaperStub
      stub="123"
      :text="`${t('reports.season.paper.dept.stubDetails')} · ${t('reports.season.paper.dept.stub')}`"
    />
    <PaperStub
      stub="136"
      :text="`${t('reports.season.paper.dept.stubMeetings')} · ${t('reports.season.paper.dept.stub')}`"
    />
    <PaperStub
      stub="136"
      :text="`${t('reports.season.paper.dept.stubFiles')} · ${t('reports.season.paper.dept.stub')}`"
    />
  </PaperFrame>
</template>
