import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { preferences } from '@/shared/preferences'

import type { ScopeSelection } from './resolve'
import { scopedKey, type ScopeLens, type ScopeSnapshot } from './scope'

export type ScopeChangeListener = (next: ScopeSnapshot, previous: ScopeSnapshot) => void

/**
 * Kapsam deposu: program → mercek → departman (K2). Varsayılan kapsam yoktur; seçimi
 * `useScopeLifecycle()` standing'den çözer. Kimlikler `shared/preferences` ile hatırlanır
 * (yalnız kimlik; K2 istisnası). Her değişiklik dinleyicilere bir kez bildirilir; yaşam
 * döngüsü bununla eski kapsamın sorgularını iptal edip önbellekten düşürür.
 */
export const useScopeStore = defineStore('scope', () => {
  const programId = ref<string | null>(null)
  const lens = ref<ScopeLens | null>(null)
  const departmentId = ref<string | null>(null)
  const listeners = new Set<ScopeChangeListener>()

  const snapshot = computed<ScopeSnapshot>(() => ({
    programId: programId.value,
    departmentId: departmentId.value,
    lens: lens.value,
  }))

  function update(next: ScopeSelection): void {
    const previous = snapshot.value
    if (
      previous.programId === next.programId &&
      previous.departmentId === next.departmentId &&
      (previous.lens ?? null) === next.lens
    ) {
      return
    }
    programId.value = next.programId
    lens.value = next.lens
    departmentId.value = next.departmentId
    const current = snapshot.value
    for (const listener of [...listeners]) listener(current, previous)
  }

  /** Program değişince departman seçimi geçersizdir (departman programa bağlıdır). */
  function setProgram(id: string | null): void {
    if (programId.value === id) return
    update({ programId: id, lens: lens.value, departmentId: null })
  }

  /** Mercek değişince departman yeniden çözülür (mekanizma §3 adım 4). */
  function setLens(next: ScopeLens | null): void {
    if (lens.value === next) return
    update({ programId: programId.value, lens: next, departmentId: null })
  }

  function setDepartment(id: string | null): void {
    if (id !== null && programId.value === null) {
      throw new Error('scope: departman seçmeden önce program seçilmelidir')
    }
    update({ programId: programId.value, lens: lens.value, departmentId: id })
  }

  /** Çözülmüş seçimi tek seferde uygular (tek bildirim). */
  function commit(next: ScopeSelection): void {
    update(next)
  }

  /** Bellekteki kapsamı boşaltır (hatırlananlara dokunmaz). */
  function reset(): void {
    update({ programId: null, lens: null, departmentId: null })
  }

  function remembered(): ScopeSelection {
    return {
      programId: preferences.read('scope.programId'),
      lens: preferences.read('scope.lens'),
      departmentId: preferences.read('scope.departmentId'),
    }
  }

  /** Geçerli seçimi hatırlananlara yansıtır (boş basamak hatırlanandan düşer). */
  function persist(): void {
    preferences.write('scope.programId', programId.value)
    preferences.write('scope.lens', lens.value)
    preferences.write('scope.departmentId', departmentId.value)
  }

  /** Çıkışta hatırlanan kapsam kimlikleri silinir (E-00-29; tema kalır). */
  function forgetRemembered(): void {
    preferences.clearScope()
  }

  function onChange(listener: ScopeChangeListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  /** Aktif kapsamla ayrışmış TanStack Query anahtarı. */
  function queryKey(
    ...parts: Parameters<typeof scopedKey> extends [unknown, ...infer R] ? R : never
  ) {
    return scopedKey(snapshot.value, ...parts)
  }

  return {
    programId,
    lens,
    departmentId,
    snapshot,
    setProgram,
    setLens,
    setDepartment,
    commit,
    reset,
    remembered,
    persist,
    forgetRemembered,
    onChange,
    queryKey,
  }
})
