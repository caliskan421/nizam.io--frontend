/**
 * 08 kart eylemlerinin görünürlüğü (K1; `capabilities.ts` + work `canCreateWorkItem`). Girdi
 * yalnız sunucu olguları ve seçili programdır; mercek yetki değildir (P1). Izgara bir kez hesaplar
 * ve kartlara `provide` eder; ızgara dışında bağlanan kart kendi hesaplar.
 */
import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue'

import { canCreateWorkItem } from '@/modules/work/public'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { can, organizationFacts } from '../../model/capabilities'

export interface CardActions {
  /** E-08-33 (yalnız koordinatörsüz kartta). */
  assignCoordinator: boolean
  /** E-08-38 "Ayarları düzenle". */
  editDepartment: boolean
  /** E-08-38 "Görev ata" (work görünürlüğü). */
  createTask: boolean
}

const CARD_ACTIONS: InjectionKey<ComputedRef<CardActions>> = Symbol('coordinatorship-card-actions')

export function useCardActions(): ComputedRef<CardActions> {
  const store = useScopeStore()
  const { standing } = useStanding()
  return computed(() => {
    const facts = organizationFacts(standing.value, store.programId)
    return {
      assignCoordinator: can('assignCoordinator', facts),
      editDepartment: can('editDepartment', facts),
      createTask: canCreateWorkItem(standing.value, store.programId),
    }
  })
}

/** Izgara: tek hesap, kartlara paylaşılır. */
export function provideCardActions(): ComputedRef<CardActions> {
  const actions = useCardActions()
  provide(CARD_ACTIONS, actions)
  return actions
}

/** Kart: ızgaranın hesabı varsa onu, yoksa kendi hesabını kullanır. */
export function injectCardActions(): ComputedRef<CardActions> {
  return inject(CARD_ACTIONS, null) ?? useCardActions()
}
