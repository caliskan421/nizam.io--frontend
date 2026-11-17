<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { DELETED_RECORDS_ROUTE, deletedText } from '@/modules/deleted-records/public'
import { UiCount, UiIcon } from '@/shared/ui'

/**
 * "Silinen kayıtlar ‹n›" düğmesi (E-01-02; `Main.dc.html` `rp-actions`): 12 Silinen kayıtlar
 * ekranının tek girişi (kenar menüsünde giriş yoktur, P36). Sayaç `reportDashboard.deleted_records`
 * değeridir; seçili programdaki görev, alt görev, dosya, toplantı, not ve gündem ile programa bağlı
 * departmanları ve şirket genelindeki hesapları toplar (dokuz terim; `notes` ikinci kez girmez) ve
 * özetle (`reportDeletedSummary.total`) aynı hesaptır; ekrandaki listelerin sayısından farklı
 * olabilir — `title` bileşimi ve bunu söyler (BE-119). Sayı yoksa (pano henüz
 * gelmedi ya da Admin merceği dışı) yalnız etiket çizilir; sahte sayı yok. Hedef YOL ile verilir:
 * rota kaydı olmayan bir yönlendiricide (komşu sayfa testleri) ad çözümleme hatası vermez.
 */
defineProps<{ count: number | null }>()
</script>

<template>
  <RouterLink
    :to="{ path: DELETED_RECORDS_ROUTE.path }"
    class="t-btn t-btn--secondary"
    data-testid="home-deleted-records"
    :title="deletedText('home.counterHint')"
  >
    <UiIcon name="trash" size="sm" />
    {{ deletedText('home.button') }}
    <UiCount v-if="count !== null" :value="count" />
  </RouterLink>
</template>
