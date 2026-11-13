<script setup lang="ts">
import './preview.css'

import type { PaperContext } from '../../model/paper-context'
import { SEASON_PRIORITIES, SEASON_STATUSES } from '../../model/season-view'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperBand from './PaperBand.vue'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'

/**
 * Ek: sözlük ve kurallar (E-13-37; sabit metin). Gecikme kuralı kurulum saat dilimine göredir
 * ("TRT" yazılmaz). "Birden çok koordinatörlüğe bağlı toplantı" ve görev "aktarım" maddeleri
 * pin'de doğrulanamadığından yok; dosya etiketi/bayrak kısaltmaları (ACİL·ENGEL·SORU·BİLGİ,
 * PAYLAŞILAN) JSON'da karşılığı olmadığından yok.
 */
defineProps<{ ctx: PaperContext }>()
const scopeProgram = (ctx: PaperContext): string =>
  ctx.year === null ? ctx.program : `${ctx.program} · ${ctx.year} sezonu`
</script>

<template>
  <PaperFrame
    :id="SEASON_IDS.appendix"
    :label="t('reports.season.paper.appendix.title')"
    :ctx="ctx"
    :strip="t('reports.season.paper.strip', { program: ctx.programUpper })"
  >
    <PaperBand
      :kicker="t('reports.season.paper.appendix.kicker')"
      :title="t('reports.season.paper.appendix.title')"
      :sub="t('reports.season.paper.appendix.sub')"
    />
    <section class="report-section" aria-labelledby="report-ap-status">
      <PaperHeading
        id="report-ap-status"
        :title="t('reports.season.paper.appendix.statuses')"
        :aside="t('reports.season.paper.appendix.values', { n: SEASON_STATUSES.length })"
      />
      <div class="report-table report-cols-gloss" role="table" aria-labelledby="report-ap-status">
        <div class="report-tr report-tr--head" role="row">
          <span role="columnheader">{{ t('reports.season.paper.appendix.value') }}</span>
          <span role="columnheader">{{ t('reports.season.paper.appendix.explanation') }}</span>
        </div>
        <div v-for="key in SEASON_STATUSES" :key="key" class="report-tr" role="row">
          <span role="cell"
            ><span class="report-pill" :class="`report-st-${key}`">{{
              t(`reports.season.paper.status.${key}`)
            }}</span></span
          >
          <span role="cell">{{ t(`reports.season.paper.appendix.statusText.${key}`) }}</span>
        </div>
      </div>
    </section>
    <section class="report-section" aria-labelledby="report-ap-priority">
      <PaperHeading
        id="report-ap-priority"
        :title="t('reports.season.paper.appendix.priorities')"
        :aside="t('reports.season.paper.appendix.values', { n: SEASON_PRIORITIES.length })"
      />
      <div class="report-table report-cols-gloss" role="table" aria-labelledby="report-ap-priority">
        <div class="report-tr report-tr--head" role="row">
          <span role="columnheader">{{ t('reports.season.paper.appendix.value') }}</span>
          <span role="columnheader">{{ t('reports.season.paper.appendix.explanation') }}</span>
        </div>
        <div v-for="key in SEASON_PRIORITIES" :key="key" class="report-tr" role="row">
          <span role="cell"
            ><span class="report-pill" :class="`report-pr-${key}`">{{
              t(`reports.season.paper.priority.${key}`)
            }}</span></span
          >
          <span role="cell">{{ t(`reports.season.paper.appendix.priorityText.${key}`) }}</span>
        </div>
      </div>
    </section>
    <section class="report-section" aria-labelledby="report-ap-late">
      <PaperHeading
        id="report-ap-late"
        :title="t('reports.season.paper.appendix.lateRule')"
        :aside="t('reports.season.paper.appendix.items', { n: 4 })"
      />
      <ol>
        <li v-for="n in 4" :key="n">{{ t(`reports.season.paper.appendix.lateItems.${n}`) }}</li>
      </ol>
    </section>
    <section class="report-section" aria-labelledby="report-ap-abbr">
      <PaperHeading id="report-ap-abbr" :title="t('reports.season.paper.appendix.abbreviations')" />
      <ul>
        <li v-for="n in 2" :key="n">{{ t(`reports.season.paper.appendix.abbrItems.${n}`) }}</li>
      </ul>
    </section>
    <section class="report-section" aria-labelledby="report-ap-scope">
      <PaperHeading
        id="report-ap-scope"
        :title="t('reports.season.paper.appendix.scope')"
        :aside="t('reports.season.paper.appendix.items', { n: 4 })"
      />
      <ol>
        <li v-for="n in 4" :key="n">
          {{ t(`reports.season.paper.appendix.scopeItems.${n}`, { program: scopeProgram(ctx) }) }}
        </li>
      </ol>
    </section>
  </PaperFrame>
</template>
