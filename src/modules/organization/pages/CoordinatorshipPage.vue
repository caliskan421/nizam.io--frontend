<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { CoordinatorshipTab } from '../components/index'
import CoordinatorshipDetail from '../components/detail/CoordinatorshipDetail.vue'
import { departmentFromParams, queryWithTab, tabFromQuery } from './coordinatorship/url-state'

/**
 * 08b · Koordinatörlük detayı (`/koordinatorlukler/:departmentId`, S2; W73). Rota kapısı
 * `routing/AdminGate.vue` (yalnız `company_admin`, P16). Sayfa yalnız URL'yi okur/yazar: birim
 * yol parametresinden, sekme `sekme`'den (E-08-57); sekme değişimi `replace` (geri tuşu sekme
 * geçmişinde dolaşmaz). Gövde `CoordinatorshipDetail`.
 */
const route = useRoute()
const router = useRouter()

const departmentId = computed(() => departmentFromParams(route.params))
const tab = computed(() => tabFromQuery(route.query))

function setTab(next: CoordinatorshipTab): void {
  if (next === tab.value) return
  void router.replace({ query: queryWithTab(route.query, next) })
}
</script>

<template>
  <CoordinatorshipDetail
    :key="departmentId"
    :department-id="departmentId"
    :tab="tab"
    @update:tab="setTab"
  />
</template>
