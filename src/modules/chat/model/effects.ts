/**
 * Yazma sonrası YEREL uzlaştırma (yalnız önbellek): `useProtectedMutation` başarıda §6
 * geçersizlemesini yapar; pencereye (düz veri) yama ve `around` okuması burada, eylemin
 * YAKALANMIŞ kapsamıyla yapılır. İyimser güncelleme YOKTUR: yama yalnız sunucu cevabıyla gelir.
 * Sahibi sökülmüş yazmanın sonucu da önbelleğe işlenir (ortak uzlaştırma), ek okuma başlatılmaz.
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'

import {
  type MutationOutcome,
  isDetached,
  markDetached,
  type ProtectedMutation,
  type SubmitOptions,
  ownerLife,
  toPlainVars,
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
  /**
   * Bir sonucu işler: gerçek başarıda efekti UYGULAR, "sonuç bilinmiyor" `retry` ve onay `confirm`
   * devamlarını AYNI yakalanmış bağlamla (`vars`, `scope`, sahip) sarar. Devamlar alttaki
   * korumalı yazmayı doğrudan yeniden çalıştırır (anahtar/oturum/kapsam/sahip kapıları motorda
   * kalır); sarmalayıcı yalnız dönen sonuca aynı efekt yolunu uygular (zincirleme tekrar dahil;
   * ek HTTP, iyimser yama ya da çift efekt yok — her başarı sonucu bir kez işlenir).
   */
  async function settle(
    outcome: MutationOutcome<V, unknown, S>,
    vars: V,
    scope: ScopeSnapshot,
  ): Promise<MutationOutcome<V, D, S>> {
    const result = outcome as MutationOutcome<V, D, S>
    if (result.kind === 'success') {
      await effects.onSuccess?.({ client, scope, alive: owner.alive, vars, data: result.data })
      return result
    }
    if (result.kind === 'failed') {
      await effects.onFailure?.({
        client,
        scope,
        alive: owner.alive,
        vars,
        code: result.error.code,
      })
      return result
    }
    if (result.kind === 'unknown_outcome' && result.retry !== null) {
      const next = result.retry
      return carry(result, { retry: async () => settle(await next(), vars, scope) })
    }
    if (result.kind === 'confirmation_required') {
      const next = result.confirm
      return carry(result, { confirm: async () => settle(await next(), vars, scope) })
    }
    return result
  }
  return {
    ...mutation,
    async submit(vars: V, opts?: SubmitOptions): Promise<MutationOutcome<V, D, S>> {
      const scope = { ...(opts?.context?.scope ?? scopeStore.snapshot) }
      // Efektler motorla AYNI düz anlık görüntüyü kullanır (ilk/tekrar/onay başarısı): gönderim
      // sırasında giriş nesnesi değişse de yakalanmış değişkenler değişmez (File/Blob ham kalır).
      const captured = toPlainVars(vars)
      return settle(await mutation.submit(vars, opts), captured, scope)
    },
  }
}

/** Devamı sarılmış kopya; "sahipsiz geldi" işareti korunur (`reachesOwner`). */
function carry<T extends object>(outcome: T, patch: Partial<T>): T {
  const copy = { ...outcome, ...patch }
  return isDetached(outcome) ? markDetached(copy) : copy
}
