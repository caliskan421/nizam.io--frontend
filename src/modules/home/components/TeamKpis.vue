<script setup lang="ts">
import { computed } from 'vue'

import { useWorkItemList } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'

import { countsFromItems, kpiCards } from '../model/kpi'
import KpiStrip from './KpiStrip.vue'

/**
 * Koordinatör / Üye KPI (E-01-04…07): `listProgramWorkItems?department_id=<seçili>` — 03 ile
 * AYNI sonsuz sorgu ve anahtar (`useWorkItemList`; ortak-kurallar §6). Sayım yüklenen satırlarda
 * (BE-003, BE-009); Üye merceğinde `assignee` = me ("bana atananlar"). İmleç bitmemişse
 * "yüklenen kayıtlar içinde" (§10); sayfalar burada kendiliğinden çekilmez (P4).
 */
const props = defineProps<{ departmentId: string; assignee: string | null }>()

const list = useWorkItemList(() => props.departmentId)

const cards = computed(() =>
  list.query.data.value ? kpiCards(countsFromItems(list.items.value, props.assignee)) : null,
)
const error = computed(() =>
  list.query.isError.value && !list.query.data.value ? toApiError(list.query.error.value) : null,
)

function retry(): void {
  void list.query.refetch()
}
</script>

<template>
  <KpiStrip
    :cards="cards"
    :loading="!cards && !error"
    :error="error"
    :retrying="list.query.isFetching.value"
    :partial="!list.complete.value"
    data-kpi-source="work-items"
    @retry="retry"
  />
</template>
