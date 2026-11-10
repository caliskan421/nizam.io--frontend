/**
 * Aktarım teklifi yaşamı (CX-P-Ö-02, BE-107: "aynı gövde"): 409 `organization.transfer_available`
 * teklifi ilk eylemin normalize gövdesine ve bağlamına (`failed.context`: kapsam + oturum nesli)
 * bağlanır. Aktarım bu gövdeyle ve bağlamla gider (güncel form değil); gövde (e-posta, ad,
 * departman, rol) ya da kapsam (program, departman merceği) değişince teklif düşer.
 */
import { shallowRef, watch, type ComputedRef } from 'vue'

import type { ActionContext } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'

import type { CreateUserInput, TransferOffer } from '../../model/types'
import type { UserValues } from './user-schema'

export interface BoundOffer {
  offer: TransferOffer
  body: CreateUserInput
  context: ActionContext | undefined
}

/** Karşılaştırma anahtarı (gövdenin normalize hâli). */
function bodyKey(body: CreateUserInput): string {
  return JSON.stringify([
    body.email,
    body.programId,
    body.departmentId,
    body.role,
    body.fullName ?? '',
  ])
}

/** Formdaki değerlerden normalize gövde (aktarım alanı olmadan). */
export function userBody(
  values: UserValues,
  programId: string,
  chooseRole: boolean,
): CreateUserInput {
  const name = values.fullName.trim()
  return {
    email: values.email.trim(),
    programId,
    departmentId: values.departmentId,
    role: chooseRole ? values.role : 'member',
    ...(name ? { fullName: name } : {}),
  }
}

export function useTransferOffer(values: () => UserValues, roleChoice: ComputedRef<boolean>) {
  const store = useScopeStore()
  const bound = shallowRef<BoundOffer | null>(null)

  function stillValid(current: BoundOffer): boolean {
    const { programId, departmentId } = store.snapshot
    const scope = current.context?.scope
    if (!programId) return false
    if (scope && (scope.programId !== programId || scope.departmentId !== departmentId)) {
      return false
    }
    return bodyKey(current.body) === bodyKey(userBody(values(), programId, roleChoice.value))
  }

  watch(
    [
      () => values().email,
      () => values().fullName,
      () => values().departmentId,
      () => values().role,
      roleChoice,
      () => store.snapshot.programId,
      () => store.snapshot.departmentId,
    ],
    () => {
      if (bound.value && !stillValid(bound.value)) bound.value = null
    },
  )

  return bound
}
