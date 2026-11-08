/**
 * Kapsam kartlarının görünüm modeli (E-00-04…09, E-00-40). Seçim deposundan
 * (`useScopeStore`), seçenekler ve olgular sağlanmış yaşam döngüsünden okunur; burada yeni
 * kural yoktur, yalnız türetim. Kartlar standing gelmeden görünmez (E-00-11: görünüp kaybolma
 * yok); K7 açık durumlarında (`empty`) hiçbir kart gösterilmez.
 */
import { computed } from 'vue'

import type { ScopeLens } from '@/shared/scope/scope'
import type { ScopeStep } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { programAvatar } from './program-avatar'
import { injectScopeLifecycle } from './scope-key'

/** Açık kapsam menüsü; `focus` = menü açılınca ilk/seçili satıra odaklan (kullanıcı eylemi). */
export interface SwitcherState {
  which: ScopeStep
  focus: boolean
}

export function useSideScope() {
  const lifecycle = injectScopeLifecycle()
  const store = useScopeStore()

  const program = computed(
    () => lifecycle.programs.value.find((p) => p.programId === store.programId) ?? null,
  )
  const lens = computed<ScopeLens | null>(() => store.lens)
  const department = computed(
    () => lifecycle.departments.value.find((d) => d.departmentId === store.departmentId) ?? null,
  )
  const visible = computed(
    () => lifecycle.status.value === 'ready' || lifecycle.status.value === 'selecting',
  )
  const showLens = computed(
    () => visible.value && store.programId !== null && lifecycle.lenses.value.length > 0,
  )
  // E-00-06: Admin merceğinde kart yok; Koordinatör/Üye + en az bir birimde görünür.
  const showDepartment = computed(
    () =>
      showLens.value &&
      lens.value !== null &&
      lens.value !== 'admin' &&
      lifecycle.departments.value.length > 0,
  )

  return {
    lifecycle,
    store,
    program,
    avatar: computed(() =>
      program.value ? programAvatar(program.value, lifecycle.programs.value) : null,
    ),
    lens,
    department,
    visible,
    showLens,
    showDepartment,
    /** P11: tek mercekli kullanıcıda Rol kartı salt gösterimdir. */
    lensFixed: lifecycle.lensFixed,
  }
}

export type SideScope = ReturnType<typeof useSideScope>
