/**
 * Arşiv seçicilerinin koordinatörlük seçenekleri (E-10-54, E-10-103): ŞY programın tüm birimlerini,
 * koordinatör/üye yalnız seçili programdaki kendi satırlarını görür; tek seçenek varsa seçili gelir.
 * "Arşivden" (`ArchivePane`) ve "Görev arşivine de kaydet" (`ArchiveSaveFields`) aynı kuralı paylaşır.
 */
import { computed, ref, watch } from 'vue'

import { useProgramDepartments } from '@/shared/scope/program-departments'

import { useChatActor } from './use-actor'

export function useDepartmentOptions() {
  const { actor, standing } = useChatActor()
  const programDepartments = useProgramDepartments()
  const options = computed(() => {
    const current = actor.value.standing
    if (current === null) return []
    if (current.companyAdmin) {
      return (programDepartments.query.data.value?.departments ?? []).map((d) => ({
        value: d.department_id,
        label: d.display_name,
      }))
    }
    const seen = new Map<string, string>()
    for (const row of current.rows) {
      if (row.programId === actor.value.programId) seen.set(row.departmentId, row.displayName)
    }
    return [...seen].map(([value, label]) => ({ value, label }))
  })
  const departmentId = ref('')
  watch(
    options,
    (list) => {
      if (departmentId.value === '' && list.length === 1) departmentId.value = list[0]!.value
    },
    { immediate: true },
  )
  return { options, departmentId, standing }
}
