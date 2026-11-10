<script setup lang="ts">
import { computed } from 'vue'

import { useWorkItemCounts } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'

import { countsFromWorkCounts, kpiCards } from '../model/kpi'
import KpiStrip from './KpiStrip.vue'

/**
 * Koordinatör / Üye KPI (E-01-04…07): `countProgramWorkItems?department_id=<seçili>` — 03
 * görev listesiyle AYNI süzgeç ve görünürlük (`useWorkItemCounts`; BE-003, BE-009). Üye
 * merceğinde `assignee` = me → `assignee_account_id` (BE-038, "bana atananlar"). Sayılar kesin
 * sunucu sayaçlarıdır: satırlar çekilmez, "yüklenen kayıtlar içinde" etiketi yoktur.
 */
const props = defineProps<{ departmentId: string; assignee: string | null }>()

const counts = useWorkItemCounts(
  () => props.departmentId,
  () => (props.assignee === null ? [] : [props.assignee]),
)

const cards = computed(() =>
  counts.data.value ? kpiCards(countsFromWorkCounts(counts.data.value)) : null,
)
const error = computed(() =>
  counts.isError.value && !counts.data.value ? toApiError(counts.error.value) : null,
)

function retry(): void {
  void counts.refetch()
}
</script>

<template>
  <KpiStrip
    :cards="cards"
    :loading="!cards && !error"
    :error="error"
    :retrying="counts.isFetching.value"
    data-kpi-source="work-counts"
    @retry="retry"
  />
</template>
