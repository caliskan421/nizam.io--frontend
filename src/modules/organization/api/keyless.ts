/**
 * Anahtarsız organizasyon yazmaları (05/08 `backend.md` §2; ortak-kurallar §7, KESİN 8).
 *
 * Kullanıcı, hesap, üyelik, koordinatör ve departman uçları `Idempotency-Key` ya da
 * `expected_revision` ALMAZ: son yazan kazanır. Bu yüzden:
 *  - İstek `Idempotency-Key` taşımaz (sarmalayıcının `send`'i motorun başlıklarını eklemez;
 *    `X-Requested-With` HTTP ara katmanından gelir).
 *  - **Sonuç bilinmiyor** (ağ, zaman aşımı, 5xx) → kör tekrar YOK: sonuçtaki `retry` düşürülür
 *    (`null`) ve işlemin geçersizleme listesi yeniden okunur; kullanıcı yeni listeye bakıp karar
 *    verir. Onay devamının (`confirmation_required.confirm`) sonucu da aynı kuraldan geçer.
 *  - 409 `organization.membership_exists` / `identity.account_exists` "zaten uygulanmış olabilir"
 *    diye yorumlanır (05 satır dışı): sonuç `failed` kalır, liste yeniden okunur.
 *  - `owner_disposed` (sahip söküldü) olduğu gibi döner: bildirim de yeniden okuma da yok
 *    (KESİN 20).
 * Bileşik işlemde ardıl adım `submit(vars, { context })` ile ilk eylemin bağlamını taşır;
 * yeniden okuma o bağlamın kapsamıyla yapılır.
 */
import { useQueryClient } from '@tanstack/vue-query'
import { getActivePinia } from 'pinia'

import type { ApiError } from '@/shared/errors/api-error'
import {
  useProtectedMutation,
  type MutationOutcome,
  type ProtectedMutation,
  type ProtectedMutationOptions,
  type SubmitOptions,
} from '@/shared/http/mutation'
import { invalidationFilters } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'

/** "Zaten uygulanmış olabilir" kodları (05/08 satır dışı varsayımlar). */
export const ALREADY_APPLIED_CODES: ReadonlySet<string> = new Set([
  'organization.membership_exists',
  'identity.account_exists',
])

export function isAlreadyApplied(error: ApiError): boolean {
  return ALREADY_APPLIED_CODES.has(error.code)
}

const NO_SCOPE: ScopeSnapshot = { programId: null, departmentId: null }

export function useKeylessMutation<V, D>(
  options: ProtectedMutationOptions<V, D, unknown>,
): ProtectedMutation<V, D, unknown> {
  const queryClient = options.queryClient ?? useQueryClient()
  const readScope =
    options.scope ?? (() => (getActivePinia() ? useScopeStore().snapshot : NO_SCOPE))
  const mutation = useProtectedMutation<V, D, unknown>({ ...options, queryClient })

  async function reread(scope: ScopeSnapshot): Promise<void> {
    const filters = invalidationFilters(options.operation, scope)
    await Promise.all(filters.map((filter) => queryClient.invalidateQueries(filter)))
  }

  async function harden(
    outcome: MutationOutcome<V, D, unknown>,
    scope: ScopeSnapshot,
  ): Promise<MutationOutcome<V, D, unknown>> {
    if (outcome.kind === 'unknown_outcome') {
      await reread(scope)
      return { ...outcome, retry: null }
    }
    if (outcome.kind === 'failed' && isAlreadyApplied(outcome.error)) {
      await reread(scope)
      return outcome
    }
    if (outcome.kind === 'confirmation_required') {
      return { ...outcome, confirm: async () => harden(await outcome.confirm(), scope) }
    }
    return outcome
  }

  async function submit(vars: V, opts?: SubmitOptions) {
    const scope = { ...(opts?.context?.scope ?? readScope()) }
    return harden(await mutation.submit(vars, opts), scope)
  }

  return { ...mutation, submit }
}
