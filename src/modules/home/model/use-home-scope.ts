/**
 * Ana sayfa kapsam/yetki olguları ve KPI kaynağı seçimi — yönetici sayfası ve rol taslağı ortak
 * kullanır (tek yerde; 01 backend.md "Mercek → veri kaynağı"). Mercek yetki DEĞİLDİR (P1):
 * eylem görünürlüğü olgudan, yalnız KPI içeriği merceğe göre seçilir.
 */
import { computed } from 'vue'

import { lensAssignee } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { canReadDashboard } from './capabilities'
import { quickActions } from './quick-actions'

export type KpiSource = 'dashboard' | 'team' | 'select' | 'loading' | 'error'

export function useHomeScope() {
  const store = useScopeStore()
  const standing = useStanding()

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

  return { store, facts, fullName, kpiSource, standingError, assignee, actions }
}
