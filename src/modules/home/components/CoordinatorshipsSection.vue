<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { COORDINATORSHIPS_ROUTE } from '@/modules/organization/public'
import type { ApiError } from '@/shared/errors/api-error'
import { useScopeStore } from '@/shared/scope/store'
import { UiErrorState, UiIcon } from '@/shared/ui'

import { filterCounts, visibleStats } from '../model/coordinatorships'
import { homeText } from '../model/messages'
import { useCoordControls } from '../model/use-coord-controls'
import type { DashboardReport } from '../model/types'
import CoordinatorshipCard from './CoordinatorshipCard.vue'
import CoordToolbar from './CoordToolbar.vue'

/**
 * "Koordinatörlükler" bölgesi (E-01-21…28): başlık + ipucu (seçili ölçüt açıklaması · süzgeç
 * sonrası kart sayısı), "Tümünü gör" → 08, araç çubuğu ve kart ızgarası. Kartlar yönetici için
 * program geneli ve mercekten bağımsızdır (P53); tek kaynak `coordinatorship_stats` (v0.15
 * kesmez, 200 satır uyarısı yok). Yerel durum bellekte; kapsam değişince sıfırlanır (K2).
 * Boş durumlar: süzgeç sonucu 0 → "Bu filtreyle eşleşen koordinatörlük yok."; hiç kayıt yok →
 * "Programa departman katılmamış". Bölge bağımsız yüklenir (iskelet) ve kendi hatasını gösterir.
 */
const props = withDefaults(
  defineProps<{
    report: DashboardReport | null
    error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
    retrying?: boolean
  }>(),
  { error: null, retrying: false },
)
const emit = defineEmits<{ retry: [] }>()

const store = useScopeStore()
const controls = useCoordControls(() => `${store.programId}|${store.lens}|${store.departmentId}`)

const all = computed(() => props.report?.coordinatorship_stats ?? [])
const counts = computed(() => filterCounts(all.value))
const shown = computed(() =>
  visibleStats(all.value, {
    filter: controls.filter.value,
    query: controls.query.value,
    key: controls.sortKey.value,
    reversed: controls.reversed.value,
  }),
)
const hint = computed(() =>
  homeText('home.coords.hint', {
    sort: homeText(`home.coords.sort.${controls.sortKey.value}.hint`),
    n: shown.value.length,
  }),
)
</script>

<template>
  <section class="home-coords" aria-labelledby="home-coords-title" data-region="coords">
    <div class="rp-cardhead home-coords__head">
      <div>
        <h2 id="home-coords-title" class="rp-cardtitle">{{ homeText('home.coords.title') }}</h2>
        <p v-if="report" class="rp-cap home-coords__hint" data-testid="coords-hint">{{ hint }}</p>
      </div>
      <RouterLink class="rp-link" :to="{ path: COORDINATORSHIPS_ROUTE.path }" data-coords-all>
        {{ homeText('home.coords.all') }}<UiIcon name="arrow-right" size="sm" />
      </RouterLink>
    </div>
    <UiErrorState
      v-if="error"
      :error="error"
      :title="homeText('home.coords.error')"
      retryable
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <div v-else-if="!report" class="home-ccards" aria-busy="true">
      <div v-for="n in 3" :key="n" class="t-card home-ccard home-ccard--skel" data-ccard-skeleton>
        <span class="home-skel" />
        <span class="home-skel home-skel--num" />
      </div>
    </div>
    <div v-else-if="all.length === 0" class="rp-empty" data-testid="coords-none">
      {{ homeText('home.coords.none') }}
    </div>
    <template v-else>
      <CoordToolbar
        v-model:text="controls.text.value"
        v-model:filter="controls.filter.value"
        :counts="counts"
        :sort-key="controls.sortKey.value"
        :reversed="controls.reversed.value"
        @pick="controls.pickSort"
        @flip="controls.flip"
      />
      <div v-if="shown.length === 0" class="rp-empty" data-testid="coords-empty">
        {{ homeText('home.coords.empty') }}
      </div>
      <div v-else class="home-ccards">
        <CoordinatorshipCard v-for="stat in shown" :key="stat.department_id" :stat="stat" />
      </div>
    </template>
  </section>
</template>
