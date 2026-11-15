<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { TIMELINE_ROUTE } from '@/modules/timeline/public'
import type { ApiError } from '@/shared/errors/api-error'
import { UiCount } from '@/shared/ui'

import { homeText } from '../../model/messages'
import type { RequestRow } from '../../model/k1/queues'
import { requestParts } from '../../model/k1/request-parts'
import { formatDayShort } from '../../model/role/dates'
import RegionBody from './RegionBody.vue'

/**
 * "Tarih taleplerim ‹n›" (E-K1-38/39): `myDateChangeRequests`. Başlık yüklenen görev
 * kümesinden (bulunamazsa nötr "Görev"; başlık uydurulmaz). "gönderildi" tarihi ve "Yönetici
 * notu" satır alanından (BE-140: `created_at`, `reviewed_at`, `review_reason`); kod yüklenen görev kümesinden (BE-005). Metin P18: plan tarihini yönetici değiştirir.
 */
const props = defineProps<{
  rows: readonly RequestRow[]
  /** Kurulum saat dilimi: gönderim/karar günü (WORK-K37). */
  timeZone: string
  pending: number
  decided: number
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

const view = computed(() =>
  props.rows.map((r) => ({ r, parts: requestParts(r.request, props.timeZone) })),
)

const PILL = { pending: 'rh-pill--gold', approved: 'rh-pill--ok', rejected: 'rh-pill--no' } as const
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="requests" aria-labelledby="k1-req">
    <div class="rh-cardhead">
      <h2 id="k1-req" class="rh-cardtitle">
        {{ homeText('home.k1.requests.title') }}
        <UiCount :value="rows.length" />
      </h2>
      <RouterLink class="rh-link" :to="{ path: TIMELINE_ROUTE.path }">
        {{ homeText('home.k1.requests.all') }}
      </RouterLink>
    </div>
    <p class="rh-cap">{{ homeText('home.k1.requests.note', { pending, decided }) }}</p>
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="rows.length === 0 ? homeText('home.k1.requests.empty') : null"
      :rows="2"
      @retry="emit('retry')"
    >
      <RouterLink
        v-for="{ r, parts } in view"
        :key="r.request.request_id"
        class="rh-req"
        :class="{ 'rh-req--wait': r.request.status === 'pending' }"
        :to="{ path: TIMELINE_ROUTE.path }"
        data-row
      >
        <span class="rh-stack">
          <span class="rh-line">
            <span class="rh-title">{{ r.title ?? homeText('home.k1.requests.untitled') }}</span>
            <span v-if="r.code" class="rh-kicker" data-task-code>{{ r.code }}</span>
          </span>
          <span class="rh-cap">
            {{
              homeText('home.k1.requests.dates', {
                from: formatDayShort(r.request.old_end_on),
                to: formatDayShort(r.request.new_end_on),
              })
            }}
          </span>
          <span v-if="parts.sent || parts.decided" class="rh-cap" data-parts="times">
            {{ [parts.sent, parts.decided].filter(Boolean).join(' · ') }}
          </span>
          <span v-if="r.request.reason" class="rh-cap rh-clamp2">{{ r.request.reason }}</span>
          <span v-if="parts.note" class="rh-cap rh-clamp2" data-parts="note">{{ parts.note }}</span>
        </span>
        <span class="rh-pill" :class="PILL[r.request.status]">
          {{ homeText(`home.k1.requests.status.${r.request.status}`) }}
        </span>
      </RouterLink>
    </RegionBody>
  </section>
</template>
