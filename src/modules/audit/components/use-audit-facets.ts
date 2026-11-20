import { computed, type Ref } from 'vue'

import type { AuditSelection } from '../model/filters'
import { actionLabel, categoryLabel } from '../model/format'
import { AUDIT_CATEGORIES, type AuditActionTypeList, type AuditSummary } from '../model/types'

function actionFacets(totals: AuditSummary | undefined, actions: AuditActionTypeList | undefined) {
  const counts = new Map<string, number | undefined>(
    (totals?.facets.action ?? []).map((row) => [row.key, row.count]),
  )
  for (const entry of actions?.items ?? []) {
    if (!entry.hidden_by_default && !counts.has(entry.code)) counts.set(entry.code, undefined)
  }
  return [...counts].map(([value, count]) => ({ value, label: actionLabel(value), count }))
}

export function useAuditFacets(
  totals: Readonly<Ref<AuditSummary | undefined>>,
  actions: Readonly<Ref<AuditActionTypeList | undefined>>,
  selected: Readonly<Ref<AuditSelection>>,
  departmentLabel: (id: string | null) => string,
) {
  const actorOptions = computed(() =>
    (totals.value?.facets.actor ?? []).map((row) => ({
      value: row.account_id ?? 'system',
      label: row.full_name ?? (row.account_id ? 'Adı bilinmeyen kişi' : 'Sistem'),
      count: row.count,
    })),
  )
  const departmentOptions = computed(() =>
    (totals.value?.facets.department ?? []).map((row) => ({
      value: row.department_id ?? 'none',
      label: departmentLabel(row.department_id),
      count: row.count,
    })),
  )
  const categoryOptions = computed(() =>
    AUDIT_CATEGORIES.map((value) => ({
      value,
      label: categoryLabel(value),
      count: totals.value?.facets.category.find((row) => row.key === value)?.count,
    })),
  )
  const actionOptions = computed(() => actionFacets(totals.value, actions.value))
  return computed(() => [
    {
      key: 'yapan' as const,
      name: 'Yapan',
      options: actorOptions.value,
      chosen: selected.value.actor,
    },
    {
      key: 'koord' as const,
      name: 'Koordinatörlük',
      options: departmentOptions.value,
      chosen: selected.value.department,
    },
    {
      key: 'tur' as const,
      name: 'Tür',
      options: categoryOptions.value,
      chosen: selected.value.category,
    },
    {
      key: 'islem' as const,
      name: 'İşlem',
      options: actionOptions.value,
      chosen: selected.value.action_code,
    },
  ])
}
