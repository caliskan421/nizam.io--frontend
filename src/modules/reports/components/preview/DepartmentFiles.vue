<script setup lang="ts">
import './preview.css'
import './detail.css'

import { computed } from 'vue'

import type { PaperContext } from '../../model/paper-context'
import { fileGroups } from '../../model/season-detail'
import type { DepartmentSection } from '../../model/season-view'
import type { SeasonReport } from '../../model/types'
import { t } from '../text'
import { departmentAnchor } from './ids'
import PaperHeading from './PaperHeading.vue'

/**
 * Dosyalar (01f, E-13-36; BE-136): `reportSeason.files[]` — bölümün dosyaları etikete göre gruplu
 * (etiketsiz sonda); DOSYA · GÖREV (kod + başlık) · YÜKLEYEN · BOYUT · TARİH. Başlık yanında
 * koordinatörlüğün toplam dosya sayısı ve boyutu (`file_count`/`file_bytes`); sunucu kesmesinde
 * (2000) tablo eksik olabilir — sayfa düzeyindeki kesme uyarısı (BE-132) geçerlidir.
 */
const props = defineProps<{
  ctx: PaperContext
  section: DepartmentSection
  season: SeasonReport
  total: string
}>()

const groups = computed(() => fileGroups(props.section.id, props.season, props.ctx.timeZone))
const heading = computed(() => `${departmentAnchor(props.section.id)}-files`)
const p = (key: string, params?: Record<string, unknown>) =>
  t(`reports.season.paper.dept.files.${key}`, params)
</script>

<template>
  <section class="report-section" :aria-labelledby="heading" data-testid="dept-files">
    <PaperHeading
      :id="heading"
      :title="p('title')"
      :aside="p('count', { n: section.fileCount, size: total })"
    />
    <p v-if="groups.length === 0" class="report-emptyline">{{ p('empty') }}</p>
    <div v-else class="report-scroll">
      <div class="report-table report-cols-files" role="table" :aria-labelledby="heading">
        <div class="report-tr report-tr--head" role="row">
          <span role="columnheader">{{ p('cols.file') }}</span>
          <span role="columnheader">{{ p('cols.task') }}</span>
          <span role="columnheader">{{ p('cols.by') }}</span>
          <span class="report-r" role="columnheader">{{ p('cols.size') }}</span>
          <span class="report-r" role="columnheader">{{ p('cols.date') }}</span>
        </div>
        <template v-for="group in groups" :key="group.tag ?? ''">
          <div class="report-tr report-tr--group" role="row" data-testid="file-group">
            <span role="cell"
              ><span class="report-pill">{{ group.tag ?? p('untagged') }}</span></span
            >
            <span class="report-mono" role="cell">{{
              p('groupMeta', { n: group.count, size: group.size })
            }}</span>
          </div>
          <div
            v-for="(row, index) in group.rows"
            :key="row.id"
            class="report-tr"
            :class="{ 'report-tr--zebra': index % 2 === 1 }"
            role="row"
            data-testid="file-row"
          >
            <span class="report-mono rp-trunc" role="cell">{{ row.name }}</span>
            <span class="rp-trunc" role="cell"
              ><span class="report-mono">{{ row.taskLabel }}</span> {{ row.taskTitle }}</span
            >
            <span class="rp-trunc" role="cell">{{ row.by }}</span>
            <span class="report-r" role="cell">{{ row.size }}</span>
            <span class="report-r" role="cell">{{ row.date }}</span>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
