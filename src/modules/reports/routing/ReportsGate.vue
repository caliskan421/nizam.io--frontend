<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { HOME_ROUTE } from '@/modules/home/public'
import { i18n } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { useToast } from '@/shared/ui'

import { reportCapabilities } from '../model/capabilities'

/**
 * Rapor önizleme rotalarının kapısı (01f `/arsiv/donem-raporu`, 01g `/toplantilar/:id/rapor`;
 * 13 `mekanizma.md` §1–§2). Kapı `company_admin` OLGUSUNA bağlıdır, mercek girdi değildir (P1):
 * yönetici K/Ü merceğinde de girer. Yönetici olmayan (koordinatör dahil: 01g `reportMeetingDetail`
 * K için 403) doğrudan URL'de ana sayfaya döner (`replace`) ve ortak "erişim yok" bildirimini
 * görür. Standing gelene dek sayfa çizilmez. Gizleme güvenlik değildir: sunucu 403
 * `reporting.not_authorized` döndürür.
 */
const { standing } = useStanding()
const store = useScopeStore()
const router = useRouter()
const toast = useToast()
let redirecting = false
const allowed = computed(() => {
  const caps = reportCapabilities(standing.value, store.programId)
  return caps.canPreviewSeason() && caps.canPreviewMeeting()
})
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
