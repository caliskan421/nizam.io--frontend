<script setup lang="ts">
import './home.css'

import { useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'

import { lensAssignee } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { invalidateStanding, useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useDashboard } from '../api'
import AdminKpis from '../components/AdminKpis.vue'
import DeletedRecordsButton from '../components/DeletedRecordsButton.vue'
import KpiStrip from '../components/KpiStrip.vue'
import QuickActions from '../components/QuickActions.vue'
import RecentActivity from '../components/RecentActivity.vue'
import TeamKpis from '../components/TeamKpis.vue'
import { canOpenDeletedRecords, canReadDashboard } from '../model/capabilities'
import { homeText } from '../model/messages'
import { quickActions } from '../model/quick-actions'

/**
 * 01 · Ana sayfa — sade F1 (`/`, S1; P6): selamlama, KPI şeridi, hızlı işlemler, nötr "Son
 * işlemler". F6 bölgeleri (Rapor oluştur, ekip şeridi, koordinatörlük kartları,
 * alt bilgi) F1 yapısında ÇİZİLMEZ. Rota S1'dir: kabuk kapsam beklerken de sayfayı çizer, bu
 * yüzden kapsamlı (S2) okumalar yalnız kapsam tamken bağlanır (kapsamsız istek yok).
 *
 * KPI veri kaynağı (01 backend.md "Mercek → veri kaynağı"): Admin merceği + şirket yöneticisi →
 * `reportDashboard`; Koordinatör → seçili birim sayaçları (`countProgramWorkItems`); Üye → aynı sayaç, "bana atananlar" (sunucu süzgeci).
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
/** Üye merceğinde "bana atananlar" (sunucu `assignee_account_id`; birleşik rolde zorunlu). */
const assignee = computed(() => lensAssignee(store.lens, facts.value?.accountId))
const actions = computed(() => quickActions(facts.value, store.programId))

/** E-01-02 "Silinen kayıtlar" (F5, P36): yalnız yönetici; sayaç pano `deleted_records` (Admin merceği). */
const showDeleted = computed(() => canOpenDeletedRecords(facts.value))
const dashboard = useDashboard(() => kpiSource.value === 'dashboard')
const deletedCount = computed(() => dashboard.data.value?.deleted_records ?? null)

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
      <div v-if="showDeleted" class="rp-actions">
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
    </div>
  </section>
</template>
