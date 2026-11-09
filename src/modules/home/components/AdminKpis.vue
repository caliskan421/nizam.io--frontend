<script setup lang="ts">
import { computed } from 'vue'

import { toApiError } from '@/shared/errors/api-error'

import { useDashboard } from '../api'
import { countsFromDashboard, kpiCards } from '../model/kpi'
import KpiStrip from './KpiStrip.vue'

/**
 * Admin KPI (E-01-04…07): `reportDashboard` sunucu sayaçları (kesin; GAP-075 `pending_approvals`
 * sınanmaz). Yalnız şirket yöneticisi + Admin merceğinde çizilir (çağıran `canReadDashboard`).
 */
const query = useDashboard(true)

const cards = computed(() =>
  query.data.value ? kpiCards(countsFromDashboard(query.data.value)) : null,
)
const error = computed(() =>
  query.isError.value && !query.data.value ? toApiError(query.error.value) : null,
)

function retry(): void {
  void query.refetch()
}
</script>

<template>
  <KpiStrip
    :cards="cards"
    :loading="!cards && !error"
    :error="error"
    :retrying="query.isFetching.value"
    data-kpi-source="dashboard"
    @retry="retry"
  />
</template>
