<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { HOME_ROUTE } from '@/modules/home/public'
import { i18n } from '@/shared/i18n'
import { useStanding } from '@/shared/scope/standing'
import { useToast } from '@/shared/ui'

import { administrationFacts, canSeeAdministration } from '../model/capabilities'

/**
 * Yönetim rotalarının kapısı (05, 05b, 08, 08b; satır dışı varsayımlar — P1, P13, P16;
 * E-00-23/24). Kapı `company_admin` OLGUSUNA bağlıdır, mercek girdi değildir: Koordinatör
 * merceğindeki yönetici de girer. Yönetici olmayan doğrudan URL'de ana sayfaya döner
 * (`replace`; geri tuşu kapıya dönmez). Standing gelene dek sayfa çizilmez (sayfanın yönetici
 * uçları erken çağrılmaz). Gizleme güvenlik değildir: sunucu 403 döndürür.
 */
const { standing } = useStanding()
const router = useRouter()
const toast = useToast()
let redirecting = false
const allowed = computed(() => canSeeAdministration(administrationFacts(standing.value)))
const denied = computed(() => standing.value !== null && !allowed.value)

watch(
  denied,
  (value) => {
    if (value && !redirecting) {
      redirecting = true
      toast.push({ message: i18n.global.t('organization.accessDenied') })
      void router.replace({ name: HOME_ROUTE.name })
    }
  },
  { immediate: true },
)
</script>

<template>
  <slot v-if="allowed" />
</template>
