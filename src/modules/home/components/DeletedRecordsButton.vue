<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { DELETED_RECORDS_ROUTE, deletedText } from '@/modules/deleted-records/public'
import { UiCount, UiIcon } from '@/shared/ui'

/**
 * "Silinen kayıtlar ‹n›" düğmesi (E-01-02; `Main.dc.html` `rp-actions`): 12 Silinen kayıtlar
 * ekranının tek girişi (kenar menüsünde giriş yoktur, P36). Sayaç `reportDashboard.deleted_records`
 * değeridir; programa bağlı görev/toplantı/departman ile şirket genelindeki hesapları toplar ve
 * ekrandaki listelerle eşit olmayabilir (BE-119) — `title` bunu söyler. Sayı yoksa (pano henüz
 * gelmedi ya da Admin merceği dışı) yalnız etiket çizilir; sahte sayı yok.
 */
defineProps<{ count: number | null }>()
</script>

<template>
  <RouterLink
    :to="{ name: DELETED_RECORDS_ROUTE.name }"
    class="t-btn t-btn--secondary"
    data-testid="home-deleted-records"
    :title="deletedText('mismatch.counter')"
  >
    <UiIcon name="trash" size="sm" />
    {{ deletedText('home.button') }}
    <UiCount v-if="count !== null" :value="count" />
  </RouterLink>
</template>
