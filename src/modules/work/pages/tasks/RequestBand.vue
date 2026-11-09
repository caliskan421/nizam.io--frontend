<script setup lang="ts">
import './tasks.css'

import { UiButton, UiIcon } from '@/shared/ui'

import { tasksText } from './messages'

/**
 * Bekleyen tarih talepleri bandı (E-03-13, okuma; P5/§5 F1'de canlı). Sayı ve koordinatörlük
 * adları yüklenen kümeden (`pending_date_request`; talep uçlarıyla birleştirme yok). Çağıran
 * yalnız sayı > 0 iken gösterir (boş içerik üretilmez, §4). "Talepleri incele" (E-03-14) yalnız
 * yöneticiye (s.152), F3'e kadar devre dışı + faz notu (stub yok, §3).
 */
defineProps<{ count: number; departments: readonly string[]; canReview: boolean }>()
</script>

<template>
  <div class="rp-reqbar" role="region" :aria-label="tasksText('tasksPage.requests.band')">
    <span class="rp-reqbar__icon"><UiIcon name="calendar-check" size="sm" /></span>
    <span class="rp-trunc rp-reqbar__text">
      <strong>{{ tasksText('tasksPage.requests.bandTitle', { n: count }) }}</strong>
      <span v-if="departments.length > 0" class="rp-muted"> · {{ departments.join(', ') }}</span>
    </span>
    <UiButton
      v-if="canReview"
      size="sm"
      class="rp-btn-ok"
      icon-end="arrow-right"
      disabled
      data-phase="F3"
      :title="tasksText('tasksPage.requests.reviewSoon')"
    >
      {{ tasksText('tasksPage.requests.review') }}
    </UiButton>
  </div>
</template>
