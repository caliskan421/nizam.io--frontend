<script setup lang="ts">
import './tasks.css'

import { useRoute, useRouter } from 'vue-router'

import { UiButton, UiIcon } from '@/shared/ui'

import { TASKS_ROUTE } from '../../routes'

import { tasksText } from './messages'

/**
 * Bekleyen tarih talepleri bandı (E-03-13, okuma; P5/§5 F1'de canlı). Sayı ve koordinatörlük
 * adları yüklenen kümeden (`pending_date_request`; talep uçlarıyla birleştirme yok). Çağıran
 * yalnız sayı > 0 iken gösterir (boş içerik üretilmez, §4). "Talepleri incele" (E-03-14) yalnız
 * yöneticiye (s.152), canlı (P20, 2026-11-10): E-03-09 tarih talebi süzgecini (`talep=1`) açar. İmleç bitmediyse
 * (`complete` false) sayı kısmi kümedendir → yanında "yüklenen kayıtlar içinde" (§10, P4).
 */
defineProps<{
  count: number
  departments: readonly string[]
  canReview: boolean
  complete: boolean
}>()
const route = useRoute()
const router = useRouter()

function review(): void {
  void router.push({ name: TASKS_ROUTE.name, query: { ...route.query, talep: '1' } })
}
</script>

<template>
  <div class="rp-reqbar" role="region" :aria-label="tasksText('tasksPage.requests.band')">
    <span class="rp-reqbar__icon"><UiIcon name="calendar-check" size="sm" /></span>
    <span class="rp-trunc rp-reqbar__text">
      <strong>{{ tasksText('tasksPage.requests.bandTitle', { n: count }) }}</strong>
      <span v-if="!complete" class="rp-muted" data-testid="request-band-partial">
        · {{ tasksText('tasksPage.partial') }}</span
      >
      <span v-if="departments.length > 0" class="rp-muted"> · {{ departments.join(', ') }}</span>
    </span>
    <UiButton
      v-if="canReview"
      size="sm"
      class="rp-btn-ok"
      icon-end="arrow-right"
      data-testid="request-review"
      @click="review"
    >
      {{ tasksText('tasksPage.requests.review') }}
    </UiButton>
  </div>
</template>
