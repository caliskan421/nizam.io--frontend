<script setup lang="ts">
import { computed } from 'vue'

import { routeLocation } from '@/app/routes.catalog'
import { useDashboard } from '@/modules/home/public'
import { toApiError } from '@/shared/errors/api-error'
import { UiErrorState } from '@/shared/ui'

const report = useDashboard(true)
const units = computed(() =>
  [...(report.data.value?.coordinatorship_stats ?? [])].sort(
    (a, b) => b.overdue_tasks - a.overdue_tasks || a.name.localeCompare(b.name, 'tr'),
  ),
)
</script>

<template>
  <UiErrorState
    v-if="report.isError.value"
    :error="toApiError(report.error.value)"
    retryable
    @retry="report.refetch()"
  />
  <p v-else-if="report.isPending.value" role="status">Yönetim özeti yükleniyor…</p>
  <template v-else-if="report.data.value">
    <dl class="profile-stats">
      <div>
        <dt>Açık görev</dt>
        <dd>{{ report.data.value.active_tasks }}</dd>
      </div>
      <div>
        <dt>Geciken görev</dt>
        <dd>{{ report.data.value.overdue_tasks }}</dd>
      </div>
      <div>
        <dt>Onay bekleyen görev</dt>
        <dd>{{ report.data.value.pending_approvals }}</dd>
      </div>
      <div>
        <dt>Bekleyen tarih talebi</dt>
        <dd>{{ report.data.value.pending_date_changes }}</dd>
      </div>
    </dl>
    <ul v-if="units.length" class="profile-list" aria-label="Koordinatörlüklerin durumu">
      <li v-for="unit in units" :key="unit.department_id">
        <RouterLink
          :to="routeLocation('organization.coordinatorship', { departmentId: unit.department_id })"
        >
          {{ unit.name }}
        </RouterLink>
        <span class="rp-cap"
          >{{ unit.overdue_tasks }} geciken · %{{
            Math.round(unit.completion_rate)
          }}
          tamamlandı</span
        >
      </li>
    </ul>
    <p v-else class="rp-cap">Bu programa bağlı koordinatörlük yok.</p>
  </template>
</template>
