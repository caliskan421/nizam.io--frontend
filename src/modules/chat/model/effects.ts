/**
 * Yazma sonrası YEREL uzlaştırma (yalnız önbellek): `useProtectedMutation` başarıda §6
 * geçersizlemesini yapar; pencereye (düz veri) yama ve `around` okuması burada, eylemin
 * YAKALANMIŞ kapsamıyla yapılır. İyimser güncelleme YOKTUR: yama yalnız sunucu cevabıyla gelir.
 * Sahibi sökülmüş yazmanın sonucu da önbelleğe işlenir (ortak uzlaştırma), ek okuma başlatılmaz.
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'

import {
  type MutationOutcome,
  type ProtectedMutation,
  type SubmitOptions,
  ownerLife,
} from '@/shared/http/mutation'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'

export interface EffectBase<V> {
  client: QueryClient
  /** Eylemin YAKALANMIŞ kapsamı. */
  scope: ScopeSnapshot
  /** Sahip (bileşen) yaşıyor mu; sökülmüşse ek okuma başlatılmaz. */
  alive: () => boolean
  vars: V
}

export interface WriteEffects<V, D> extends EffectBase<V> {
  data: D
}

export interface FailureEffects<V> extends EffectBase<V> {
  code: string
}

export function withEffects<V, D, S = unknown>(
  mutation: ProtectedMutation<V, D, S>,
  effects: {
    onSuccess?: (fx: WriteEffects<V, D>) => void | Promise<void>
    onFailure?: (fx: FailureEffects<V>) => void | Promise<void>
  },
): ProtectedMutation<V, D, S> {
  const client = useQueryClient()
  const scopeStore = useScopeStore()
  const owner = ownerLife()
  return {
    ...mutation,
    async submit(vars: V, opts?: SubmitOptions): Promise<MutationOutcome<V, D, S>> {
      const scope = { ...(opts?.context?.scope ?? scopeStore.snapshot) }
      const outcome = await mutation.submit(vars, opts)
      if (outcome.kind === 'success') {
        await effects.onSuccess?.({ client, scope, alive: owner.alive, vars, data: outcome.data })
      } else if (outcome.kind === 'failed') {
        await effects.onFailure?.({
          client,
          scope,
          alive: owner.alive,
          vars,
          code: outcome.error.code,
        })
      }
      return outcome
    },
  }
}
