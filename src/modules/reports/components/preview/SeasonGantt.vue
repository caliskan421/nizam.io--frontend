<script setup lang="ts">
import './preview.css'

import type { PaperContext } from '../../model/paper-context'
import { t } from '../text'
import { SEASON_IDS } from './ids'
import PaperBand from './PaperBand.vue'
import PaperFrame from './PaperFrame.vue'
import PaperStub from './PaperStub.vue'

/**
 * Gantt bölümü (E-13-28): STATİK yer tutucu — sahte çubuk yok; canlı çizim ürün kararı bekliyor
 * (`reportSeason.tasks` ile çizilebilir, bağımlılık okları olmadan; BE-123).
 */
defineProps<{ ctx: PaperContext }>()
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
    />
    <PaperStub stub="123" :text="t('reports.season.paper.gantt.stub')" />
  </PaperFrame>
</template>
