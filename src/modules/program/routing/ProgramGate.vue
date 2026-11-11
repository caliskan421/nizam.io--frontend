<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { HOME_ROUTE } from '@/modules/home/public'
import { i18n } from '@/shared/i18n'
import { useStanding } from '@/shared/scope/standing'
import { useToast } from '@/shared/ui'

import { canProgram, programFacts } from '../model/capabilities'

/**
 * Program yönetimi rotasının kapısı (E-00-25; P1). Kapı `company_admin` OLGUSUNA bağlıdır,
 * mercek girdi değildir: Koordinatör merceğindeki yönetici de girer. Yönetici olmayan doğrudan
 * URL'de ana sayfaya döner (`replace`). Standing gelene dek sayfa çizilmez (yönetici uçları erken
 * çağrılmaz). Gizleme güvenlik değildir: sunucu 403 `program.not_authorized` döndürür.
 */
const { standing } = useStanding()
const router = useRouter()
const toast = useToast()
let redirecting = false
const allowed = computed(() => canProgram('manage', programFacts(standing.value)))
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
