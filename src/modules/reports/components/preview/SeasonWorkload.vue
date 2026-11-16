<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import { workloadRows } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import PaperHeading from './PaperHeading.vue'

/**
 * İş yükü bölümü (01f, E-13-31; BE-134): `reportSeason.workload_summary` ile CANLI (ikinci ağır
 * `reportWorkload` okuması yok). Sütunlar KİŞİ · AKTİF · GECİKEN · TAMAMLANAN · TOPLAM · DAĞILIM;
 * dağılım çubuğu en büyük toplama göre (tamamlanan · aktif zamanında · geciken). Koordinatörlük
 * kodu satırı (kişi altı) JSON'da yok → çizilmez. Boşsa tek satır metin; seçilmeyen/kesilen satır
 * sunucuda belirlenir.
 */
const props = defineProps<{ season: SeasonReport }>()

const rows = computed(() => workloadRows(props.season))
</script>

<template>
  <section class="report-section" aria-labelledby="report-gen-workload" data-testid="workload">
    <PaperHeading
      id="report-gen-workload"
      :title="t('reports.season.paper.general.workload')"
      :aside="t('reports.season.paper.general.workloadCount', { n: rows.length })"
    />
    <p v-if="rows.length === 0" class="report-emptyline">
      {{ t('reports.season.paper.general.workloadEmpty') }}
    </p>
    <template v-else>
      <div class="report-scroll">
        <div
          class="report-table report-cols-workload"
          role="table"
          :aria-label="t('reports.season.paper.general.workloadLabel')"
        >
          <div class="report-tr report-tr--head" role="row">
            <span role="columnheader">{{
              t('reports.season.paper.general.workloadCols.person')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.general.workloadCols.active')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.general.workloadCols.overdue')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.general.workloadCols.completed')
            }}</span>
            <span class="report-c" role="columnheader">{{
              t('reports.season.paper.general.workloadCols.total')
            }}</span>
            <span role="columnheader">{{
              t('reports.season.paper.general.workloadCols.spread')
            }}</span>
          </div>
          <div
            v-for="(row, index) in rows"
            :key="row.id"
            class="report-tr"
            :class="{ 'report-tr--zebra': index % 2 === 1 }"
            role="row"
            data-testid="workload-row"
          >
            <strong role="cell">{{ row.name }}</strong>
            <span class="report-c" role="cell">{{ row.active }}</span>
            <span class="report-c" :class="{ 'report-danger': row.overdue > 0 }" role="cell">{{
              row.overdue
            }}</span>
            <span class="report-c" role="cell">{{ row.completed }}</span>
            <span class="report-c" role="cell">{{ row.total }}</span>
            <span
              role="cell"
              :title="
                t('reports.season.paper.general.workloadTip', {
                  done: row.completed,
                  ontime: row.active - row.overdue,
                  late: row.overdue,
                })
              "
            >
              <span class="report-track" aria-hidden="true">
                <span class="report-st-tamamlandi" :style="{ width: `${row.done}%` }" />
                <span class="report-st-devam_ediyor" :style="{ width: `${row.ontime}%` }" />
                <span class="report-wl-late" :style="{ width: `${row.late}%` }" />
              </span>
            </span>
          </div>
        </div>
      </div>
      <div
        class="report-legend"
        :aria-label="t('reports.season.paper.general.workloadLegend.label')"
      >
        <span class="report-st-tamamlandi"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.general.workloadLegend.done')
          }}</span
        >
        <span class="report-st-devam_ediyor"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.general.workloadLegend.ontime')
          }}</span
        >
        <span class="report-wl-late"
          ><i class="report-swatch" aria-hidden="true" />{{
            t('reports.season.paper.general.workloadLegend.late')
          }}</span
        >
      </div>
      <p class="report-fn">{{ t('reports.season.paper.general.workloadNote') }}</p>
    </template>
  </section>
</template>
