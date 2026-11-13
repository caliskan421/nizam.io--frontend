<script setup lang="ts">
import '../components/role-home.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import { invalidateStanding } from '@/shared/scope/standing'
import { UiErrorState } from '@/shared/ui'

import { canSeeAdminRegions } from '../model/capabilities'
import { homeText } from '../model/messages'
import { useHomeScope } from '../model/use-home-scope'
import AdminHomePage from './AdminHomePage.vue'
import CoordinatorHomePage from './CoordinatorHomePage.vue'
import MemberHomePage from './MemberHomePage.vue'

/**
 * 01 · Ana sayfa (`/`, S1) — sayfa seçici (P53; `01-ana-sayfa/README.md` K1/Ü1 "Sayfa seçimi").
 * `company_admin` olgusu olan hesap mercek ne olursa olsun yönetici sayfasını görür (mercek ≠
 * yetki, P1); yönetici olmayan hesapta Koordinatör merceği K1 (`CoordinatorHomePage`), Üye
 * merceği Ü1 (`MemberHomePage`) açar (W140). Olgu ya da mercek henüz yoksa (yükleniyor) iskelet,
 * olgu okunamazsa bölge içi hata + "Yeniden dene". Mercek/birim değişince gövde yeniden
 * kurulur (`key`): yerel durum sıfır, sorgular kapsamla düşer (K2).
 */
const { store, facts, standingError } = useHomeScope()
const queryClient = useQueryClient()
const admin = computed(() => canSeeAdminRegions(facts.value))
const variant = computed(() => {
  if (admin.value) return 'admin'
  if (facts.value === null) return 'pending'
  if (store.lens === 'coordinator') return 'coordinator'
  if (store.lens === 'member') return 'member'
  return 'pending'
})

function retry(): void {
  void invalidateStanding(queryClient)
}
</script>

<template>
  <AdminHomePage v-if="variant === 'admin'" />
  <CoordinatorHomePage v-else-if="variant === 'coordinator'" :key="`k1:${store.departmentId}`" />
  <MemberHomePage v-else-if="variant === 'member'" :key="`u1:${store.programId}`" />
  <section v-else class="role-home" data-testid="home-page" data-home="pending">
    <div class="rh-head">
      <UiErrorState
        v-if="standingError"
        :error="standingError"
        :title="homeText('home.k1.error')"
        retryable
        @retry="retry"
      />
      <span v-else class="rh-skel rh-skel--greet" aria-hidden="true" />
    </div>
  </section>
</template>
