<script setup lang="ts">
import './home.css'

import { useQueryClient } from '@tanstack/vue-query'

import { invalidateStanding } from '@/shared/scope/standing'

import KpiStrip from '../components/KpiStrip.vue'
import QuickActions from '../components/QuickActions.vue'
import RecentActivity from '../components/RecentActivity.vue'
import TeamKpis from '../components/TeamKpis.vue'
import { homeText } from '../model/messages'
import { useHomeScope } from '../model/use-home-scope'

/**
 * TASLAK (W140 yerine geçer): yönetici olmayan hesabın 01 rotasındaki sayfası — F1 sade gövde
 * (selamlama, birim/üye KPI şeridi, hızlı işlemler, nötr "Son işlemler"). K1 (Koordinatör
 * merceği) ve Ü1 (Üye merceği) sayfa gövdeleri W140'ındır; `HomePage.vue` seçicisi bu bileşeni
 * W140 bileşenleriyle değiştirir (bağlama noktası: `HomePage.vue` `<RoleHomeDraft />`).
 * Yönetici olgusu olmayan hesapta pano, silinen kayıtlar ve F6 bölgeleri yoktur.
 */
const { store, fullName, kpiSource, standingError, assignee, actions } = useHomeScope()
const queryClient = useQueryClient()

function retryStanding(): void {
  void invalidateStanding(queryClient)
}
</script>

<template>
  <section class="home-page" data-testid="home-page" data-home="role-draft">
    <div class="rp-head">
      <div>
        <h1 v-if="fullName" class="home-greeting" data-testid="home-greeting">
          {{ homeText('home.greeting', { name: fullName }) }}
        </h1>
        <span v-else class="home-skel home-skel--greet" aria-hidden="true" />
      </div>
    </div>
    <div class="home-body">
      <TeamKpis
        v-if="kpiSource === 'team' && store.departmentId !== null"
        :department-id="store.departmentId"
        :assignee="assignee"
      />
      <KpiStrip
        v-else
        :cards="null"
        :loading="kpiSource === 'loading'"
        :error="standingError"
        :select="kpiSource === 'select'"
        @retry="retryStanding"
      />
      <div class="home-pair">
        <QuickActions v-if="actions.length > 0" :actions="actions" />
        <RecentActivity />
      </div>
    </div>
  </section>
</template>
