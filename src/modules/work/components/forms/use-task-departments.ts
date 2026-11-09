/**
 * Yeni görevin hedef departmanları ve atama yetkisi (E-03-06/57; `istemci-akislari` §4).
 *
 *  - Seçenek = seçili programın departmanlarından `canManageWorkItem` (s.139) olanlar: şirket
 *    yöneticisinde hepsi, koordinatörde yalnız kendi departmanları. Mercek girdi değildir (P1).
 *  - Ad `listProgramDepartments` (G13), okunamadıysa ekip satırındaki programdaki ad.
 *  - Ek atananlar (`addAssignments`) yalnız seçili departmanın koordinatörüne (s.140);
 *    yalnız yönetici olan çağıranda formda tek atama alanı vardır.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import type { UiSelectOption } from '@/shared/ui'

import { useProgramDepartments } from '../../api'
import { canManageAssignments, canManageWorkItem, workActorFacts } from '../../model/capabilities'

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

export function useTaskDepartments(selected: MaybeRefOrGetter<string>) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const { query } = useProgramDepartments()

  const facts = (departmentId: string) =>
    workActorFacts(standing.value, store.programId, {
      department_id: departmentId,
      assignee_account_ids: [],
    })

  const options = computed<UiSelectOption[]>(() => {
    const names = new Map<string, string>()
    for (const row of standing.value?.rows ?? []) {
      if (row.programId === store.programId) names.set(row.departmentId, row.displayName)
    }
    for (const d of query.data.value?.departments ?? []) names.set(d.department_id, d.display_name)
    return [...names]
      .filter(([id]) => canManageWorkItem(facts(id)))
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => collator.compare(a.label, b.label))
  })

  const canAssignExtra = computed(() => {
    const id = toValue(selected)
    return id !== '' && canManageAssignments(facts(id))
  })

  return { options, canAssignExtra }
}
