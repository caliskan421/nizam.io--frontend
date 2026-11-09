<script setup lang="ts">
import './home.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { invalidateStanding, useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import AdminKpis from '../components/AdminKpis.vue'
import KpiStrip from '../components/KpiStrip.vue'
import QuickActions from '../components/QuickActions.vue'
import RecentActivity from '../components/RecentActivity.vue'
import TeamKpis from '../components/TeamKpis.vue'
import { canReadDashboard } from '../model/capabilities'
import { homeText } from '../model/messages'
import { quickActions } from '../model/quick-actions'

/**
 * 01 · Ana sayfa — sade F1 (`/`, S1; P6): selamlama, KPI şeridi, hızlı işlemler, nötr "Son
 * işlemler". F6 bölgeleri (Silinen kayıtlar, Rapor oluştur, ekip şeridi, koordinatörlük kartları,
 * alt bilgi) F1 yapısında ÇİZİLMEZ. Rota S1'dir: kabuk kapsam beklerken de sayfayı çizer, bu
 * yüzden kapsamlı (S2) okumalar yalnız kapsam tamken bağlanır (kapsamsız istek yok).
 *
 * KPI veri kaynağı (01 backend.md "Mercek → veri kaynağı"): Admin merceği + şirket yöneticisi →
 * `reportDashboard`; Koordinatör → seçili birim listesi; Üye → aynı liste, "bana atananlar".
 * Eylem görünürlüğü yetkiden (P1), mercekten değil.
 */
type KpiSource = 'dashboard' | 'team' | 'select' | 'loading' | 'error'

const store = useScopeStore()
const standing = useStanding()
const queryClient = useQueryClient()

const facts = computed(() => standing.standing.value)
const fullName = computed(() => facts.value?.fullName ?? null)

const scopeComplete = computed(
  () =>
    store.programId !== null &&
    store.lens !== null &&
    (store.lens === 'admin' || store.departmentId !== null),
)

const kpiSource = computed<KpiSource>(() => {
  if (standing.status.value === 'error') return 'error'
  if (standing.status.value !== 'ready') return 'loading'
  if (!scopeComplete.value) return 'select'
  if (store.lens !== 'admin') return 'team'
  return canReadDashboard(facts.value, store.lens) ? 'dashboard' : 'select'
})

const standingError = computed(() =>
  kpiSource.value === 'error' ? toApiError(standing.error.value) : null,
)
/** Üye merceğinde "bana atananlar" (birleşik rolde zorunlu, salt üyede etkisiz). */
const assignee = computed(() => (store.lens === 'member' ? (facts.value?.accountId ?? null) : null))
const actions = computed(() => quickActions(facts.value, store.programId))

function retryStanding(): void {
  void invalidateStanding(queryClient)
}
</script>

<template>
  <section class="home-page" data-testid="home-page">
    <div class="rp-head">
      <div>
        <h1 v-if="fullName" class="home-greeting" data-testid="home-greeting">
          {{ homeText('home.greeting', { name: fullName }) }}
        </h1>
        <span v-else class="home-skel home-skel--greet" aria-hidden="true" />
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
    </div>
  </section>
</template>
