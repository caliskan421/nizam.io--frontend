import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { scopedKey, type ScopeSnapshot } from './scope'

/**
 * Kapsam deposu: aktif program + departman (F06 kapsam 6). Kalıcı depolama yok; sayfa
 * yenilemede kapsam yeniden seçilir (seçici UI program sonrası istemci geliştirmesindedir).
 */
export const useScopeStore = defineStore('scope', () => {
  const programId = ref<string | null>(null)
  const departmentId = ref<string | null>(null)

  const snapshot = computed<ScopeSnapshot>(() => ({
    programId: programId.value,
    departmentId: departmentId.value,
  }))

  /** Program değişince departman seçimi geçersizdir (departman programa bağlıdır). */
  function setProgram(id: string | null): void {
    if (programId.value === id) return
    programId.value = id
    departmentId.value = null
  }

  function setDepartment(id: string | null): void {
    if (id !== null && programId.value === null) {
      throw new Error('scope: departman seçmeden önce program seçilmelidir')
    }
    departmentId.value = id
  }

  function reset(): void {
    programId.value = null
    departmentId.value = null
  }

  /** Aktif kapsamla ayrışmış TanStack Query anahtarı. */
  function queryKey(
    ...parts: Parameters<typeof scopedKey> extends [unknown, ...infer R] ? R : never
  ) {
    return scopedKey(snapshot.value, ...parts)
  }

  return { programId, departmentId, snapshot, setProgram, setDepartment, reset, queryKey }
})
