<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { UiIcon } from '@/shared/ui'

import type { KpiCard } from '../model/kpi'

/**
 * KPI kartı (E-01-03…07; `Main.dc.html` `button.t-card.rp-cardbtn`): ikon çipi + etiket + çapraz
 * ok; büyük sayı, 4 px çubuk, alt not. Kartın tamamı 03 Görevler'e gider; `durum` süzgeci 03
 * katalog değerinden (`tamamlandi`, `geciken`, `onaya_sunuldu`; "Açık görev" süzgeçsiz).
 * Çubuk doluluğu veriden: tek dinamik değer `--home-kpi-fill` özel özelliğidir.
 */
const props = defineProps<{ card: KpiCard }>()

const to = computed(() => ({
  name: TASKS_ROUTE.name,
  query: props.card.status ? { durum: props.card.status } : {},
}))
const fill = computed(() => ({ '--home-kpi-fill': `${props.card.bar}%` }))
</script>

<template>
  <RouterLink
    :to="to"
    class="t-card rp-cardbtn home-kpi"
    :class="`home-kpi--${card.tone}`"
    :data-kpi="card.key"
  >
    <span class="home-kpi__top">
      <span class="home-kpi__name">
        <span class="rp-ichip"><UiIcon :name="card.icon" size="sm" /></span>
        <span class="rp-trunc home-kpi__label">{{ card.label }}</span>
      </span>
      <UiIcon class="home-kpi__go" name="arrow-up-right" size="sm" />
    </span>
    <span class="home-kpi__body">
      <span
        class="rp-num home-kpi__value"
        :class="{ 'home-kpi__value--danger': card.danger }"
        data-kpi-value
        >{{ card.value }}</span
      >
      <span class="rp-bar" aria-hidden="true">
        <span class="home-kpi__fill" :style="fill" data-kpi-bar />
      </span>
      <span v-if="card.note !== null" class="rp-cap rp-trunc" data-kpi-note>{{ card.note }}</span>
    </span>
  </RouterLink>
</template>
