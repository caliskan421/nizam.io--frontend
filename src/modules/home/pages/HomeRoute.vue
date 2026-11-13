<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { homeVariant } from '../model/capabilities'
import HomePage from './HomePage.vue'

/**
 * 01 rotasının sayfa seçicisi (P53; geçici kabul, W135 varsayımı 1): `company_admin` her
 * mercekte YÖNETİCİ sayfası (`HomePage`; P1, E-01-28 kartları program geneli); yönetici
 * olmayan hesapta Koordinatör merceği K1, Üye merceği Ü1. Seçim yalnız olgudan
 * (`homeVariant`); olgu/mercek henüz yoksa yönetici sayfası kendi yükleniyor durumunu gösterir.
 * Mercek değişince gövde yeniden kurulur (`key`): yerel durum sıfır, sorgular kapsamla düşer (K2).
 * K1/Ü1 ayrı parçalardır (yönetici bunları indirmez).
 */
const CoordinatorHomePage = defineAsyncComponent(() => import('./CoordinatorHomePage.vue'))
const MemberHomePage = defineAsyncComponent(() => import('./MemberHomePage.vue'))

const store = useScopeStore()
const { standing } = useStanding()

const variant = computed(() => homeVariant(standing.value, store.lens))
</script>

<template>
  <CoordinatorHomePage v-if="variant === 'coordinator'" :key="'k1:' + store.departmentId" />
  <MemberHomePage v-else-if="variant === 'member'" :key="'u1:' + store.programId" />
  <HomePage v-else />
</template>
