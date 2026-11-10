<script setup lang="ts">
import './gantt.css'

import { computed } from 'vue'

import { buildLinkIndex, laneFor, linkPath, linksInWindow, type LinkRef } from '../../model/links'
import type { GanttLayout, RowWindow, TaskRow } from '../../model/rows'
import { GEOMETRY, planEdges, rangeWidth } from '../../model/timeline'
import type { GanttLinksProps } from '../index'

/**
 * Bağımlılık okları (E-03C-37; P19, WORK-K36): ön görevin planlanan bitişinden bağımlı görevin
 * başlangıcına, yalnız İKİ UCU DA GÖRÜNÜR (satırı olan ve çubuğu çizilebilen) görevler arasında;
 * kapalı grubun ya da süzgeç dışı görevin ucuna ok, saplama bile çizilmez. Departmanlar arası ok
 * kesiklidir. Ok dizini satır numaralarıyla kurulur: kaydırmada yalnız pencereye değen oklar
 * hesaplanır. Üye yüzünde de gösterilir (ekle/kaldır eylemi W94'te, burada yok).
 */
const props = defineProps<GanttLinksProps & { layout: GanttLayout; window: RowWindow }>()

const MARKER_ID = 'gantt-link-head'
const MARKER_SIZE = 8

const index = computed(() => buildLinkIndex(props.links, props.layout))
const width = computed(() => rangeWidth(props.range, props.scale))

interface DrawnLink {
  ref: LinkRef
  d: string
}

const drawn = computed<DrawnLink[]>(() => {
  const out: DrawnLink[] = []
  for (const ref of linksInWindow(index.value, props.window.first, props.window.last)) {
    const source = props.layout.rows[ref.sourceRow] as TaskRow
    const target = props.layout.rows[ref.targetRow] as TaskRow
    const from = planEdges(source.task, props.range, props.scale)
    const to = planEdges(target.task, props.range, props.scale)
    if (!from || !to) continue
    const d = linkPath(
      {
        sx: from.planRight,
        sy: source.y + source.height / 2,
        tx: to.left,
        ty: target.y + target.height / 2,
        laneY: laneFor(source, target),
      },
      GEOMETRY.barPad,
    )
    out.push({ ref, d })
  }
  return out
})
</script>

<template>
  <svg
    class="gantt__layer gantt__layer--static gantt__layer--links"
    :width="width"
    :height="layout.height"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <marker
        :id="MARKER_ID"
        :viewBox="`0 0 ${MARKER_SIZE} ${MARKER_SIZE}`"
        :refX="MARKER_SIZE - 1"
        :refY="MARKER_SIZE / 2"
        :markerWidth="MARKER_SIZE"
        :markerHeight="MARKER_SIZE"
        orient="auto"
      >
        <path
          class="gantt-link__head"
          :d="`M0,0 L${MARKER_SIZE},${MARKER_SIZE / 2} L0,${MARKER_SIZE} z`"
        />
      </marker>
    </defs>
    <path
      v-for="link in drawn"
      :key="link.ref.id"
      class="gantt-link"
      :class="{ 'gantt-link--cross': link.ref.crossDepartment }"
      :d="link.d"
      :marker-end="`url(#${MARKER_ID})`"
      :data-link="link.ref.id"
      :data-from="link.ref.sourceId"
      :data-to="link.ref.targetId"
    />
  </svg>
</template>
