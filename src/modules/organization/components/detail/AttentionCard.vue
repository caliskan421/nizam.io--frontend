<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'

import { attentionRows, type WorkSet } from './detail-model'
import { detailText } from './messages'

/**
 * Dikkat gerektirenler (E-08-82/83): tek birimin görev listesinden (`department_id`, sonuna dek)
 * geciken görevler `days_overdue` azalan, ilk 3; alt satır "‹KOD›-— · atananlar" (görev
 * numarası yok, BE-005) + "tarih talebi var". "Tümü" → 03 geciken süzgeci; satır → 03 görev
 * paneli. Liste sürerken "yüklenen kayıtlar içinde".
 */
const props = defineProps<{
  departmentId: string
  code: string
  work: WorkSet
  loading: boolean
  error: boolean
}>()

const rows = computed(() => attentionRows(props.work.items, props.code))
const all = computed(() => ({
  name: TASKS_ROUTE.name,
  query: { koordinatorluk: props.departmentId, durum: 'geciken' },
}))
const open = (workItemId: string) => ({
  name: TASKS_ROUTE.name,
  query: { koordinatorluk: props.departmentId, gorev: workItemId },
})
</script>

<template>
  <section
    class="t-card cd-card cd-card--aside"
    aria-labelledby="cd-attn-title"
    data-card="attention"
  >
    <div class="rp-cardhead cd-cardhead">
      <h2 id="cd-attn-title" class="rp-cardtitle">
        {{ detailText('organization.coordinatorship.attention.title') }}
      </h2>
      <RouterLink class="rp-link" :to="all" data-action="attention-all">
        {{ detailText('organization.coordinatorship.attention.all') }}
      </RouterLink>
    </div>
    <p v-if="error" class="rp-cap" role="status">
      {{ detailText('organization.coordinatorship.attention.error') }}
    </p>
    <template v-else>
      <div v-for="row in rows" :key="row.workItemId" class="cd-attn" data-attention>
        <span class="cd-dot" :class="`cd-dot--${row.status}`" aria-hidden="true" />
        <span class="cd-attn__text">
          <RouterLink class="rp-title rp-trunc cd-attn__title" :to="open(row.workItemId)">
            {{ row.title }}
          </RouterLink>
          <span class="rp-cap rp-trunc">{{ row.who }}</span>
        </span>
        <span class="rp-mono rp-nowrap rp-danger-text cd-attn__late">{{ row.late }}</span>
      </div>
      <p v-if="!loading && work.complete && rows.length === 0" class="rp-cap" data-attention-empty>
        {{ detailText('organization.coordinatorship.attention.empty') }}
      </p>
      <p v-if="!work.complete && rows.length > 0" class="rp-cap" data-attention-partial>
        {{ detailText('organization.coordinatorship.attention.loaded') }}
      </p>
    </template>
  </section>
</template>
