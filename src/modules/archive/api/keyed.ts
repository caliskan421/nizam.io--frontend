/**
 * Anahtarlı yazma + tek izinli tekrar (BE-050 kalıbı; `attachFile`): sonuç bilinmiyorsa
 * kullanıcıya AYNI `Idempotency-Key` ve gövdeyle EN FAZLA bir tekrar sunulur; tekrar da
 * belirsizse ortak yeniden okuma yapılır ve sonuçtaki `retry` düşürülür (üçüncü kör gönderim
 * yok). Sahip sökülmüş (geç) sonucun işareti korunur (CX-F1-Ö-07).
 */
import { useQueryClient } from '@tanstack/vue-query'

import {
  isDetached,
  markDetached,
  ownerLife,
  useProtectedMutation,
  type MutationOutcome,
  type ProtectedMutation,
  type ProtectedMutationOptions,
  type SubmitOptions,
} from '@/shared/http/mutation'
import { invalidationFilters } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

function keepDetached<T extends object>(from: object, to: T): T {
  return isDetached(from) ? markDetached(to) : to
}

export function useSingleRetryMutation<V, D>(
  options: ProtectedMutationOptions<V, D, unknown>,
): ProtectedMutation<V, D, unknown> {
  const queryClient = options.queryClient ?? useQueryClient()
  const store = useScopeStore()
  const mutation = useProtectedMutation<V, D, unknown>({ ...options, queryClient })
  const owner = ownerLife()

  async function submit(vars: V, opts?: SubmitOptions): Promise<MutationOutcome<V, D, unknown>> {
    const scope = { ...(opts?.context?.scope ?? store.snapshot) }
    const outcome = await mutation.submit(vars, opts)
    if (outcome.kind !== 'unknown_outcome' || !outcome.retry) {
      return owner.alive() ? outcome : markDetached(outcome)
    }
    const once = outcome.retry
    return keepDetached(outcome, {
      ...outcome,
      retry: async () => {
        const next = await once()
        if (next.kind !== 'unknown_outcome') return next
        const context = options.invalidation?.(vars, undefined as unknown as D) ?? {}
        const filters = invalidationFilters(options.operation, scope, context)
        await Promise.all(filters.map((filter) => queryClient.invalidateQueries(filter)))
        const closed = keepDetached(next, { ...next, retry: null })
        return owner.alive() ? closed : markDetached(closed)
      },
    })
  }

  return { ...mutation, submit }
}
