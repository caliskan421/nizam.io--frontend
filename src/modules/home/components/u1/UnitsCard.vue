<script setup lang="ts">
import { UiCount } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { shortName } from '../../model/role/meetings'
import { unitWidths, type UnitRow } from '../../model/u1/departments'
import BarSeg from '../k1/BarSeg.vue'
import RegionBody from '../k1/RegionBody.vue'

/**
 * "Koordinatörlüklerim ‹n›" (E-Ü1-30…32): `myDepartments` üyelik satırları + AYNI yükleme
 * kümesinin birim kırılımı (tek istek). "‹n› görev" = o birimdeki açık görevlerim; dilimler
 * başlamadı/devam/onayda/iade; ikinci satır durum özeti. "Koordinatör: ‹ad›" gizli (BE-141:
 * üyeye okunamaz); kod yerine ad kısaltması. Altnot sözleşme bilgisidir.
 */
defineProps<{ rows: readonly UnitRow[]; loading?: boolean }>()
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="units" aria-labelledby="u1-units">
    <div class="rh-cardhead">
      <h2 id="u1-units" class="rh-cardtitle">
        {{ homeText('home.u1.depts.title') }}
        <UiCount :value="rows.length" />
      </h2>
    </div>
    <RegionBody
      :loading="loading"
      :empty="rows.length === 0 ? homeText('home.u1.depts.empty') : null"
      :rows="2"
    >
      <div v-for="row in rows" :key="row.departmentId" class="rh-unit" data-row>
        <span class="rh-line">
          <span class="rh-code" :title="row.name">{{ shortName(row.name) }}</span>
          <span class="rh-title">{{ row.name }}</span>
          <span class="rh-cap">{{ homeText('home.u1.depts.tasks', { n: row.open }) }}</span>
          <span v-if="row.overdue > 0" class="rh-cap rh-danger rh-link">
            {{ homeText('home.u1.depts.late', { n: row.overdue }) }}
          </span>
        </span>
        <span class="rh-bar rh-bar--thick" aria-hidden="true">
          <BarSeg tone="todo" :width="unitWidths(row).todo" />
          <BarSeg tone="doing" :width="unitWidths(row).doing" />
          <BarSeg tone="review" :width="unitWidths(row).review" />
          <BarSeg tone="back" :width="unitWidths(row).back" />
        </span>
        <span class="rh-cap">
          {{
            row.open === 0
              ? homeText('home.u1.depts.none')
              : homeText('home.u1.depts.segments', {
                  doing: row.doing,
                  review: row.review,
                  back: row.back,
                  todo: row.notStarted,
                })
          }}
        </span>
      </div>
    </RegionBody>
    <p class="rh-foot">{{ homeText('home.u1.depts.foot') }}</p>
  </section>
</template>
