<script setup lang="ts">
import { computed } from 'vue'

import { UiAvatar } from '@/shared/ui'

import {
  actionLabel,
  actorLabel,
  auditDay,
  auditTime,
  categoryLabel,
  dayLabel,
} from '../model/format'
import type { AuditEntry } from '../model/types'

const props = defineProps<{
  rows: readonly AuditEntry[]
  zone: string
  department: (id: string | null) => string
  showClient: boolean
}>()
const groups = computed(() => {
  const days = new Map<string, AuditEntry[]>()
  for (const event of props.rows) {
    const day = auditDay(event.occurred_at, props.zone)
    if (!days.has(day)) days.set(day, [])
    days.get(day)?.push(event)
  }
  return days
})
</script>

<template>
  <div class="audit-ledger">
    <table aria-label="İşlem geçmişi">
      <thead>
        <tr>
          <th scope="col" class="audit-ledger__time">Saat</th>
          <th scope="col">Tür</th>
          <th scope="col">İşlem</th>
          <th scope="col">Yapan</th>
          <th scope="col">Koordinatörlük</th>
        </tr>
      </thead>
      <tbody v-for="[day, dayRows] in groups" :key="day">
        <tr class="audit-ledger__day">
          <th colspan="5" scope="rowgroup">
            {{ dayLabel(day) }} <span class="rp-cap">{{ dayRows.length }}</span>
          </th>
        </tr>
        <tr v-for="event in dayRows" :key="event.entry_id">
          <td class="audit-ledger__time">
            <time :datetime="event.occurred_at">{{ auditTime(event.occurred_at, zone) }}</time>
          </td>
          <td>
            <span class="audit-badge" :data-category="event.category">{{
              categoryLabel(event.category)
            }}</span>
          </td>
          <td>
            {{ actionLabel(event.action_code) }}
            <span v-if="event.outcome === 'failed'" class="rp-danger-text"> · Başarısız</span>
            <p v-if="event.target_name" class="rp-cap">{{ event.target_name }}</p>
            <p v-if="showClient && (event.client_agent || event.client_ip)" class="rp-cap">
              {{ [event.client_agent, event.client_ip].filter(Boolean).join(' · ') }}
            </p>
          </td>
          <td>
            <span class="audit-ledger__actor">
              <UiAvatar
                v-if="event.actor_full_name"
                :name="event.actor_full_name"
                size="sm"
                aria-hidden="true"
              />
              {{ actorLabel(event) }}
            </span>
          </td>
          <td>{{ department(event.department_id) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
