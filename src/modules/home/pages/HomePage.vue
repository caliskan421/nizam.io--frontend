<script setup lang="ts">
import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'

import { canSeeAdminRegions } from '../model/capabilities'
import AdminHomePage from './AdminHomePage.vue'
import RoleHomeDraft from './RoleHomeDraft.vue'

/**
 * 01 · Ana sayfa (`/`, S1) — sayfa seçici (P53; `01-ana-sayfa/README.md` K1/Ü1 "Sayfa seçimi").
 * `company_admin` olgusu olan hesap mercek ne olursa olsun yönetici sayfasını görür (mercek ≠
 * yetki, P1); yönetici olmayan hesap K1/Ü1 gövdelerine düşer. Olgu gelene dek (yükleniyor) ve
 * hata durumunda rol gövdesi (selamlama iskeleti + KPI iskeleti/hata) çizilir.
 *
 * BAĞLAMA NOKTASI (KESİN 28, W140): `<RoleHomeDraft />` TASLAKTIR — W140 yönetici olmayan
 * dalı K1 (Koordinatör merceği) / Ü1 (Üye merceği) sayfa bileşenleriyle değiştirir; yönetici
 * dalı (`AdminHomePage`) W137'dir.
 */
const standing = useStanding()
const admin = computed(() => canSeeAdminRegions(standing.standing.value))
</script>

<template>
  <AdminHomePage v-if="admin" />
  <RoleHomeDraft v-else />
</template>
