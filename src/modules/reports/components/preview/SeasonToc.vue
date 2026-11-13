<script setup lang="ts">
import './preview.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import type { DepartmentSection } from '../../model/season-view'
import { t } from '../text'
import { departmentAnchor, SEASON_IDS } from './ids'
import PaperFrame from './PaperFrame.vue'
import PaperHeading from './PaperHeading.vue'

/**
 * İçindekiler (E-13-24): satırlar sayfa içi bağlantıdır (bölüme kaydırır ve odağı bölüme taşır);
 * sayfa numaraları gizli (akış). Koordinatörlük satırı yalnız canlı bölüme ("Görevler") bağlanır;
 * görev detayları/toplantılar/dosyalar bağlantıları BE-136 kapanana dek yok.
 */
const props = defineProps<{ ctx: PaperContext; sections: readonly DepartmentSection[] }>()

const items = computed(() => [
  { key: 'summary', id: SEASON_IDS.summary },
  { key: 'gantt', id: SEASON_IDS.gantt },
  { key: 'general', id: SEASON_IDS.general },
  {
    key: 'departments',
    id: props.sections[0] ? departmentAnchor(props.sections[0].id) : SEASON_IDS.general,
  },
])

function go(event: Event, id: string): void {
  event.preventDefault()
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ block: 'start' })
  target.focus({ preventScroll: true })
}
</script>

<template>
  <PaperFrame
    :id="SEASON_IDS.toc"
    :label="t('reports.season.paper.toc.title')"
    :ctx="ctx"
    :strip="t('reports.season.paper.strip', { program: ctx.programUpper })"
  >
    <PaperHeading :title="t('reports.season.paper.toc.title')" :level="2" />
    <nav class="report-toc" :aria-label="t('reports.season.paper.toc.label')">
      <a
        v-for="item in items"
        :key="item.key"
        class="report-toc__l0"
        :href="`#${item.id}`"
        :data-toc="item.key"
        @click="go($event, item.id)"
      >
        <span class="report-toc__t">{{ t(`reports.season.paper.toc.${item.key}`) }}</span>
      </a>
      <div v-for="section in sections" :key="section.id" data-toc="department">
        <a
          class="report-toc__l1"
          :href="`#${departmentAnchor(section.id)}`"
          @click="go($event, departmentAnchor(section.id))"
        >
          <span class="report-toc__code">{{
            section.code ?? t('reports.season.paper.toc.kind')
          }}</span>
          <span class="report-toc__t rp-trunc">{{ section.name }}</span>
        </a>
        <p class="report-toc__sub">
          <a
            :href="`#${departmentAnchor(section.id)}`"
            @click="go($event, departmentAnchor(section.id))"
            >{{ t('reports.season.paper.toc.tasks') }}</a
          >
        </p>
      </div>
      <a
        class="report-toc__l0"
        :href="`#${SEASON_IDS.appendix}`"
        data-toc="appendix"
        @click="go($event, SEASON_IDS.appendix)"
      >
        <span class="report-toc__t">{{ t('reports.season.paper.toc.appendix') }}</span>
      </a>
    </nav>
    <p class="report-fn">{{ t('reports.season.paper.toc.note') }}</p>
  </PaperFrame>
</template>
