<script setup lang="ts">
import type { ApiError } from '@/shared/errors/api-error'
import { UiEmptyState, UiErrorState } from '@/shared/ui'

import type { KpiCard as KpiCardModel } from '../model/kpi'
import { homeText } from '../model/messages'
import KpiCard from './KpiCard.vue'

/**
 * KPI şeridi bölgesi (E-01-03; `section[aria-label="Görev özeti"]`). Bölge bağımsız yüklenir:
 * yükleniyor → dört iskelet kart; hata → bölge içi hata + "Yeniden dene" (sayfa düşmez); kapsam
 * eksik → seçim notu. İmleç bitmemişse sayılar "yüklenen kayıtlar içinde" (ortak-kurallar §10).
 */
withDefaults(
  defineProps<{
    cards: KpiCardModel[] | null
    loading?: boolean
    error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
    retrying?: boolean
    partial?: boolean
    select?: boolean
  }>(),
  { loading: false, error: null, retrying: false, partial: false, select: false },
)
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="home-kpis" data-region="kpi">
    <UiErrorState
      v-if="error"
      :error="error"
      :title="homeText('home.kpi.error')"
      retryable
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <UiEmptyState
      v-else-if="select"
      icon="coords"
      :title="homeText('home.kpi.selectTitle')"
      :text="homeText('home.kpi.selectText')"
    />
    <section
      v-else
      class="home-kpi-grid"
      :aria-label="homeText('home.kpi.region')"
      :aria-busy="loading || !cards ? 'true' : undefined"
    >
      <template v-if="cards && !loading">
        <KpiCard v-for="card in cards" :key="card.key" :card="card" />
      </template>
      <template v-else>
        <div v-for="n in 4" :key="n" class="t-card home-kpi" data-kpi-skeleton>
          <span class="home-skel" />
          <span class="home-skel home-skel--num" />
        </div>
      </template>
    </section>
    <p v-if="partial && cards && !loading && !error" class="rp-cap" data-kpi-partial>
      {{ homeText('home.kpi.partial') }}
    </p>
  </div>
</template>
