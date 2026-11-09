<script setup lang="ts">
import type { KpiCell } from './detail-model'
import { detailText } from './messages'

/**
 * KPI şeridi (E-08-64…69; tasarım `rp-kpistrip`): beş hücre, 1 px ayraçlı ızgara. Değerler
 * rapor satırından (`CoordinatorshipStat`), notlar tek birimin görev listesinden (yaklaşık
 * etiketiyle). Rapor yüklenirken/okunamazken değer "—" (sahte sayı yok, §4). Arşiv hücresi F5'e
 * dek devre dışı (`aria-disabled`, "F5'te").
 */
defineProps<{ cells: readonly KpiCell[]; loading: boolean; error: boolean }>()
</script>

<template>
  <section
    class="cd-kpistrip"
    :aria-label="detailText('coordinatorship.kpi.region')"
    :aria-busy="loading ? 'true' : undefined"
    data-region="kpi"
  >
    <div
      v-for="cell in cells"
      :key="cell.key"
      class="cd-kpi"
      :data-kpi="cell.key"
      :aria-disabled="cell.disabled ? 'true' : undefined"
    >
      <p class="rp-kicker rp-trunc">{{ cell.label }}</p>
      <p class="rp-num cd-kpi__value" :class="{ 'rp-danger-text': cell.danger }" data-kpi-value>
        {{ cell.value }}
      </p>
      <p class="rp-cap rp-trunc" data-kpi-note>{{ cell.note }}</p>
    </div>
  </section>
  <p v-if="error" class="rp-cap cd-strip-error" role="status" data-kpi-error>
    {{ detailText('coordinatorship.kpi.error') }}
  </p>
</template>
