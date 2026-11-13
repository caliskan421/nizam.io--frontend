<script setup lang="ts">
import './home.css'
import './home-admin.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { invalidateStanding } from '@/shared/scope/standing'

import { useDashboard } from '../api'
import AdminKpis from '../components/AdminKpis.vue'
import CoordinatorshipsSection from '../components/CoordinatorshipsSection.vue'
import DeletedRecordsButton from '../components/DeletedRecordsButton.vue'
import HomeFooter from '../components/HomeFooter.vue'
import KpiStrip from '../components/KpiStrip.vue'
import QuickActions from '../components/QuickActions.vue'
import RecentActivity from '../components/RecentActivity.vue'
import TeamKpis from '../components/TeamKpis.vue'
import TeamStrip from '../components/TeamStrip.vue'
import { canSeeAdminRegions } from '../model/capabilities'
import { homeText } from '../model/messages'
import { useHomeScope } from '../model/use-home-scope'

/**
 * 01 · Ana sayfa — yönetici (`company_admin`) tam sayfası (F6; E-01-01…39, P53). Selamlama,
 * "Silinen kayıtlar", KPI şeridi (kaynak merceğe göre: Admin → pano, K/Ü → birim/üye sayaçları),
 * "Hızlı işlemler" (+ "Rapor oluştur" menüsü), "Son işlemler" ve program geneli yönetici
 * bölgeleri: ekip şeridi, koordinatörlük kartları, alt bilgi. Yönetici bölgeleri mercekten
 * bağımsızdır (P1/P53) ve tek `reportDashboard` okumasından beslenir (ikinci rapor isteği yok;
 * KPI şeridiyle aynı sorgu anahtarı). Eylem görünürlüğü yetkiden (P1), mercekten değil. Rota S1:
 * kapsamlı (S2) okumalar yalnız kapsam tamken bağlanır. K/Ü gövdeleri W140'ındır (`HomePage`).
 */
const { store, facts, fullName, kpiSource, standingError, assignee, actions } = useHomeScope()
const queryClient = useQueryClient()

const regions = computed(() => canSeeAdminRegions(facts.value))
const dashboard = useDashboard(() => regions.value)
const report = computed(() => dashboard.data.value ?? null)
const regionError = computed(() =>
  dashboard.isError.value && !dashboard.data.value ? toApiError(dashboard.error.value) : null,
)
const deletedCount = computed(() => report.value?.deleted_records ?? null)

function retryStanding(): void {
  void invalidateStanding(queryClient)
}

function retryRegions(): void {
  void dashboard.refetch()
}
</script>

<template>
  <section class="home-page" data-testid="home-page" data-home="admin">
    <div class="rp-head">
      <div>
        <h1 v-if="fullName" class="home-greeting" data-testid="home-greeting">
          {{ homeText('home.greeting', { name: fullName }) }}
        </h1>
        <span v-else class="home-skel home-skel--greet" aria-hidden="true" />
      </div>
      <div v-if="regions" class="rp-actions">
        <DeletedRecordsButton :count="deletedCount" />
      </div>
    </div>
    <div class="home-body">
      <AdminKpis v-if="kpiSource === 'dashboard'" />
      <TeamKpis
        v-else-if="kpiSource === 'team' && store.departmentId !== null"
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
      <template v-if="regions">
        <TeamStrip
          :report="report"
          :error="regionError"
          :retrying="dashboard.isFetching.value"
          @retry="retryRegions"
        />
        <CoordinatorshipsSection
          :report="report"
          :error="regionError"
          :retrying="dashboard.isFetching.value"
          @retry="retryRegions"
        />
        <HomeFooter :report="report" />
      </template>
    </div>
  </section>
</template>
