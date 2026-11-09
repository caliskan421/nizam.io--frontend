<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { PersonalTracking } from '../components'

/**
 * 05b · Kullanıcı › Kişisel takip (`/kullanicilar/:accountId`, S2; W76). Rota kapısı
 * `routing/AdminGate.vue` (`company_admin`, P1/P13). Gövde `PersonalTracking`; kişi değişince
 * bileşen yeniden kurulur (açık seçici, belge başlığı ve kişi sorguları eski kişiyle kalmaz).
 */
const route = useRoute()
const accountId = computed(() => {
  const raw = route.params.accountId
  return typeof raw === 'string' ? raw : ''
})
</script>

<template>
  <PersonalTracking v-if="accountId" :key="accountId" :account-id="accountId" />
</template>
