<script setup lang="ts">
import './preview.css'
import './gantt.css'

import { computed } from 'vue'

import { formatDay, instantDay, monthLabel } from '../../model/format'
import { ganttModel, type GanttBar } from '../../model/gantt'
import { ganttEdges } from '../../model/gantt-edges'
import type { PaperContext } from '../../model/paper-context'
import type { DepartmentSection } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperBand from './PaperBand.vue'
import GanttEdges from './GanttEdges.vue'
import PaperFrame from './PaperFrame.vue'

/**
 * Gantt bölümü (E-13-28; BE-123, pin v0.23.0-api): `reportSeason.tasks` ile CANLI — her
 * koordinatörlük bir grup satırı, her görev bir çubuk (başlangıç → bitiş; geç bitişte kırmızı
 * kuyruk, açık gecikende kesik kırmızı kenar ve rapor gününe kadar kuyruk), "Rapor tarihi"
 * çizgisi. Bağımlılık okları sunucunun `gantt_edges`'inden, yalnız GÖRÜNEN iki çubuk arasında
 * çizilir (`GanttEdges`; ön görev → bağımlı); PDF yalnız aynı sayfadaki kenarları çizer. Önizlemede tasarım gibi
 * 10 görevle kısaltma YOK: bütün görevler çizilir (sunucu sınırı 5000, BE-132 uyarısı sayfada).
 * Çubuk bölgesi `role="img"` özetiyle erişilebilirdir; görev bilgisi sol tablodadır (metin).
 */
const props = defineProps<{
  ctx: PaperContext
  season: SeasonReport
  sections: readonly DepartmentSection[]
}>()

const reportDay = computed(() => instantDay(props.season.generated_at, props.ctx.timeZone))
const model = computed(() => ganttModel(props.sections, reportDay.value))
const edges = computed(() => ganttEdges(model.value.groups, props.season.gantt_edges))
const range = computed(() => {
  const r = model.value.range
  return r ? `${monthLabel(r.from, true)} – ${monthLabel(r.to, true)}` : ''
})
const sub = computed(() =>
  model.value.range
    ? t('reports.season.paper.gantt.sub', {
        n: model.value.taskCount,
        range: range.value,
        date: formatDay(reportDay.value) ?? '',
      })
    : undefined,
)
const label = computed(() =>
  t('reports.season.paper.gantt.label', { n: model.value.taskCount, range: range.value }),
)
const pct = (n: number): string => `${n}%`

function barTitle(row: { label: string; status: string; lateKind: string; lateDays: number }) {
  const state = t(`reports.season.paper.status.${row.status}`)
  const late =
    row.lateKind === 'none' || row.lateKind === 'ontime'
      ? row.lateKind === 'ontime'
        ? ` · ${t('reports.season.paper.dept.lateness.ontime')}`
        : ''
      : ` · ${t(`reports.season.paper.dept.lateness.${row.lateKind}`, { n: row.lateDays })}`
  return `${row.label} · ${state}${late}`
}
function headClass(bar: GanttBar): Record<string, boolean> {
  return {
    'report-gantt__bar--overdue': bar.kind === 'overdue',
    'report-gantt__bar--head-late': bar.tail !== null,
  }
}
</script>

<template>
  <PaperFrame
    :id="SEASON_IDS.gantt"
    :label="t('reports.season.paper.gantt.title')"
    :ctx="ctx"
    :strip="t('reports.season.paper.strip', { program: ctx.programUpper })"
  >
    <PaperBand
      :kicker="t('reports.season.paper.gantt.kicker', { program: ctx.programUpper })"
      :title="t('reports.season.paper.gantt.title')"
      :sub="sub"
    />
    <p v-if="model.taskCount === 0" class="report-emptyline" data-testid="gantt-empty">
      {{ t('reports.season.paper.gantt.empty') }}
    </p>
    <template v-else>
      <div class="report-scroll">
        <div class="report-gantt" role="group" :aria-label="label" data-testid="gantt">
          <div class="report-gantt__left">
            <div class="report-gantt__head report-gantt__cols" aria-hidden="true">
              <span>#</span>
              <span>{{ t('reports.season.paper.gantt.cols.task') }}</span>
              <span>{{ t('reports.season.paper.gantt.cols.start') }}</span>
              <span>{{ t('reports.season.paper.gantt.cols.end') }}</span>
              <span>{{ t('reports.season.paper.gantt.cols.status') }}</span>
            </div>
            <template v-for="group in model.groups" :key="group.id">
              <div class="report-gantt__cols report-gantt__group">
                <span class="rp-trunc">{{
                  t('reports.season.paper.gantt.group', { name: group.name, n: group.count })
                }}</span>
                <span class="report-mono">{{ group.code ?? '' }}</span>
              </div>
              <div
                v-for="row in group.rows"
                :key="row.id"
                class="report-gantt__cols"
                :data-gantt-task="row.id"
              >
                <span class="report-mono rp-trunc">{{ row.label }}</span>
                <strong class="rp-trunc">{{ row.title }}</strong>
                <span class="report-mono">{{ formatDay(row.start) }}</span>
                <span
                  class="report-mono"
                  :class="{ 'report-danger': row.lateKind === 'overdue' }"
                  >{{ formatDay(row.end) }}</span
                >
                <span class="report-status" :class="`report-st-${row.status}`"
                  ><i class="report-dot" aria-hidden="true" /><span class="rp-trunc">{{
                    t(`reports.season.paper.status.${row.status}`)
                  }}</span></span
                >
              </div>
            </template>
            <div class="report-gantt__foot" />
          </div>
          <div class="report-gantt__right" role="img" :aria-label="label">
            <div class="report-gantt__head">
              <div class="report-gantt__months">
                <span
                  v-for="month in model.months"
                  :key="month.key"
                  class="report-gantt__month"
                  :style="{ width: pct(month.width) }"
                  >{{ monthLabel(month.key) }}</span
                >
              </div>
              <div class="report-gantt__ticks">
                <template v-for="month in model.months" :key="month.key">
                  <span
                    v-for="tick in month.ticks"
                    :key="tick.day"
                    :style="{ left: pct(tick.left) }"
                    >{{ tick.day }}</span
                  >
                </template>
              </div>
            </div>
            <template v-for="group in model.groups" :key="group.id">
              <div class="report-gantt__cell report-gantt__cell--group" />
              <div
                v-for="row in group.rows"
                :key="row.id"
                class="report-gantt__cell"
                :title="barTitle(row)"
              >
                <template v-if="row.bar">
                  <span
                    class="report-gantt__bar"
                    :class="[`report-st-${row.status}`, headClass(row.bar)]"
                    :style="{ left: pct(row.bar.left), width: pct(row.bar.width) }"
                  />
                  <span
                    v-if="row.bar.tail"
                    class="report-gantt__bar report-gantt__bar--tail"
                    :class="{ 'report-gantt__bar--tail-open': row.bar.tail.open }"
                    :style="{ left: pct(row.bar.tail.left), width: pct(row.bar.tail.width) }"
                  />
                </template>
              </div>
            </template>
            <div class="report-gantt__foot">
              <span
                v-if="model.today !== null"
                class="report-gantt__chip"
                :style="{ left: pct(model.today) }"
                >{{
                  t('reports.season.paper.gantt.today', { date: formatDay(reportDay) ?? '' })
                }}</span
              >
            </div>
            <GanttEdges :layout="edges" />
            <span
              v-if="model.today !== null"
              class="report-gantt__today"
              aria-hidden="true"
              :style="{ left: pct(model.today) }"
            />
          </div>
        </div>
      </div>
      <ul
        v-if="edges.edges.length > 0"
        class="report-gantt__edge-list"
        data-testid="gantt-edge-list"
      >
        <li v-for="edge in edges.edges" :key="edge.key">
          {{ t('reports.season.paper.gantt.edge', { from: edge.fromName, to: edge.toName }) }}
        </li>
      </ul>
      <div class="report-legend" :aria-label="t('reports.season.paper.gantt.legend.label')">
        <span class="report-st-baslanmadi"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.status.baslanmadi')
          }}</span
        >
        <span class="report-st-devam_ediyor"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.status.devam_ediyor')
          }}</span
        >
        <span class="report-st-onaya_sunuldu"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.status.onaya_sunuldu')
          }}</span
        >
        <span class="report-st-iade_edildi"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.status.iade_edildi')
          }}</span
        >
        <span class="report-st-tamamlandi"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.status.tamamlandi')
          }}</span
        >
        <span class="report-wl-late"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.gantt.legend.late')
          }}</span
        >
      </div>
      <p class="report-fn">{{ t('reports.season.paper.gantt.note') }}</p>
    </template>
  </PaperFrame>
</template>
