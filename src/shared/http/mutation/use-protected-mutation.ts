/**
 * `useProtectedMutation` — bütün yazmaların tek kapısı (K5; `ortak-kurallar.md` §7).
 *
 * TanStack `useMutation` sarmalayıcısı:
 *  - `submit(vars)` = yeni kullanıcı eylemi → yeni `Idempotency-Key`, dondurulmuş gövde.
 *  - Ağ tekrarı (`unknown_outcome.retry`, `platform.conflict_retry`) aynı anahtar + aynı gövde.
 *  - Onay (`confirmation_required.confirm`) yeni eylem, `confirm=true`.
 *  - Sonuç asla fırlatılmaz; `MutationOutcome` döner (UI `kind` ile dallanır).
 *  - Yalnız başarıda §6 geçersizleme listesi yeniden okunur ve **bitmesi beklenir**; iyimser
 *    güncelleme yoktur (başarı yanıtı gelmeden ekran değişmez). Geçersizleme eylemin
 *    **yakalanmış** kapsamıyla yapılır (gönderim sırasında kapsam değişse de).
 *  - Eylem oluşturulurken kapsam ve oturum nesli anlık görüntüsü alınır; HER gönderimden önce
 *    (tekrar, onay, `conflict_retry` otomatik tekrarı) denetlenir: kapsam değiştiyse
 *    `scope_changed`, çıkış olduysa `failed` + `client.session_ended`; istek gönderilmez.
 *  - 403/404 yetki kaybı kodları (K6) sonuç olarak döner (fırlatılmaz) ve aynı QueryClient'ın
 *    yetki kaybı kanalına yayınlanır (`reportAuthorityLoss`): standing yenilenir, kapsam
 *    yeniden doğrulanır.
 *  - Bileşik işlemde ardıl adım `submit(vars, { context })` ile ilk eylemin bağlamını taşır
 *    (CX-F1-E-03): bağlam güncel değilse adım gönderilmez.
 *  - Sahip yaşamı (CX-F1-E-05): hook kurulduğu etki kapsamının sökülmesini izler (`ownerLife`).
 *    Sökülmeden sonra bu hook üzerinden YENİ HTTP yazması başlamaz — yeni `submit`, `retry`,
 *    `confirm` devamı ve `conflict_retry` otomatik tekrarı motor kapısında `owner_disposed` ile
 *    döner (istek yok, bildirim yok, söz asılı kalmaz). Uçuştaki istek iptal edilmez; başarı geçersizlemeleri beklenirken sökülme de aynı işaretlenir (CX-F3-Ö-08: `submit` dönüşünde yeniden denetim); sonucu
 *    sökülmeden sonra gelirse `markDetached` ile işaretlenir (CX-F1-Ö-07): ortak bildirim onu
 *    yok sayar, tüketici `reachesOwner(outcome)` ile yeniden okuma/UI akışını atlar. Etki
 *    kapsamı DIŞINDA kurulan hook (uygulama düzeyi) sahipsizdir: her zaman canlı sayılır.
 *  - Değişkenler motora verilmeden önce Vue vekillerinden derin açılır (`toPlainVars`):
 *    `reactive`/`ref` taşıyan form durumu doğrudan gönderilebilir; motor Vue'dan bağımsız kalır.
 * UI yoktur; diyaloglar (O3) bu sonucu tüketir.
 */
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { getActivePinia } from 'pinia'
import { isRef, toRaw, type Ref } from 'vue'

import { reportAuthorityLoss } from '@/shared/scope/authority-loss'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'

import { authSession } from '../index'
import { invalidationFilters, type InvalidationContext } from '../query-keys'
import { newAction, runAction, type EngineOptions, type MutationAction, type Rerun } from './engine'
import { markDetached, type ActionContext, type MutationOutcome } from './outcome'
import { ownerLife } from './owner'

export interface ProtectedMutationOptions<V, D, S> extends Omit<EngineOptions<V, D, S>, 'alive'> {
  /** Geçersizlemenin hedef kaydı (ör. görev kimliği); verilmezse kaynak geneli. */
  invalidation?: (vars: V, data: D) => InvalidationContext
  /** Yazma anındaki kapsam; varsayılan Pinia kapsam deposu. */
  scope?: () => ScopeSnapshot
  /** Varsayılan: bileşen bağlamındaki istemci (`useQueryClient`). */
  queryClient?: QueryClient
  /**
   * Bitmiş mutasyonun önbellekte kalma süresi (TanStack `gcTime`). Gizli sonuç (ör. indirme
   * bileti) için `0`; çağıran sonucu kullandıktan sonra `reset()` ile gözlemciden de düşürür.
   */
  gcTime?: number
}

export interface SubmitOptions {
  /**
   * Eylemin bağlamı (kapsam + oturum nesli). Verilmezse o anki değerler yakalanır. Bileşik
   * işlemin ardıl adımı ilk eylemin bağlamını verir (`MutationSuccess.context`): arada kapsam ya
   * da oturum değiştiyse motor isteği göndermez, geçersizleme de bu kapsamla yapılır.
   */
  context?: ActionContext
}

export interface ProtectedMutation<V, D, S> {
  /** Yeni kullanıcı eylemi (gönder düğmesi). */
  submit: (vars: V, opts?: SubmitOptions) => Promise<MutationOutcome<V, D, S>>
  isPending: Ref<boolean>
  /** Son eylemin sonucu. */
  outcome: Ref<MutationOutcome<V, D, S> | undefined>
  reset: () => void
}

/** Olduğu gibi taşınan değerler (değişmez ya da yapılandırılmış kopya bunları bilir). */
function isOpaque(value: object): boolean {
  return (
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof Date ||
    ArrayBuffer.isView(value) ||
    value instanceof ArrayBuffer
  )
}

function isPlainObject(value: object): boolean {
  const proto: unknown = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Vue vekillerini derin açar: `ref` → değeri, `reactive` → ham nesne; düz nesne ve diziler
 * özyinelemeli kopyalanır, `File`/`Blob`/`FormData`/`Date`/ikili veri AYNEN korunur, diğer
 * sınıf örnekleri ham hâliyle bırakılır (dondurmayı motor `structuredClone` ile yapar).
 * Döngü korumalı: aynı ham nesne aynı kopyaya eşlenir.
 */
export function toPlainVars<V>(vars: V): V {
  const seen = new WeakMap<object, unknown>()
  const visit = (input: unknown): unknown => {
    const value: unknown = toRaw(isRef(input) ? input.value : input)
    if (typeof value !== 'object' || value === null || isOpaque(value)) return value
    if (seen.has(value)) return seen.get(value)
    if (Array.isArray(value)) {
      const out: unknown[] = []
      seen.set(value, out)
      for (const item of value as unknown[]) out.push(visit(item))
      return out
    }
    if (!isPlainObject(value)) return value
    const out: Record<string, unknown> = {}
    seen.set(value, out)
    for (const [key, item] of Object.entries(value)) out[key] = visit(item)
    return out
  }
  return visit(vars) as V
}

const NO_SCOPE: ScopeSnapshot = { programId: null, departmentId: null }

function activeScope(): ScopeSnapshot {
  return getActivePinia() ? useScopeStore().snapshot : NO_SCOPE
}

export function useProtectedMutation<V, D, S = unknown>(
  options: ProtectedMutationOptions<V, D, S>,
): ProtectedMutation<V, D, S> {
  const queryClient = options.queryClient ?? useQueryClient()
  const readScope = options.scope ?? activeScope
  const readGeneration = options.generation ?? (() => authSession.generation)
  // Kurulduğu etki kapsamının yaşamı; kapsam dışında kurulduysa sahipsiz (her zaman canlı).
  const owner = ownerLife()
  const engine: EngineOptions<V, D, S> = {
    ...options,
    scope: readScope,
    generation: readGeneration,
    alive: owner.alive,
    onAuthorityLoss: (error) => {
      options.onAuthorityLoss?.(error)
      reportAuthorityLoss(queryClient, error)
    },
  }

  const mutation = useMutation<MutationOutcome<V, D, S>, never, MutationAction<V>>(
    {
      // Sahip uçuş sırasında söküldüyse sonuç "sahipsiz" işaretlenir (CX-F1-Ö-07): geçersizleme
      // yine yapılır, ekran bildirim/yeniden okuma üretmez (`reachesOwner`, `notifyOutcome`).
      mutationFn: async (action) => {
        const outcome = await runAction(action, engine, rerun)
        return owner.alive() ? outcome : markDetached(outcome)
      },
      // Otomatik tekrar yalnız motorun içinde (conflict_retry, bir kez).
      retry: false,
      ...(options.gcTime !== undefined ? { gcTime: options.gcTime } : {}),
      onSuccess: async (outcome, action) => {
        if (outcome.kind !== 'success') return
        const ctx = options.invalidation?.(action.vars, outcome.data) ?? {}
        const filters = invalidationFilters(options.operation, action.scope ?? readScope(), ctx)
        await Promise.all(filters.map((filter) => queryClient.invalidateQueries(filter)))
      },
    },
    queryClient,
  )

  const rerun: Rerun<V, D, S> = (action) => mutation.mutateAsync(action)

  return {
    submit: async (vars, opts) => {
      const outcome = await mutation.mutateAsync(
        newAction(toPlainVars(vars), {
          now: options.now,
          scope: opts?.context ? opts.context.scope : readScope(),
          generation: opts?.context ? opts.context.generation : readGeneration(),
        }),
      )
      // CX-F3-Ö-08: `onSuccess` geçersizlemeyi beklerken sahip sökülmüş olabilir (`mutationFn`
      // işaretlemesi bundan önce). Sonuç tüketiciye verilmeden sahip yaşamı yeniden denetlenir.
      return owner.alive() ? outcome : markDetached(outcome)
    },
    isPending: mutation.isPending,
    outcome: mutation.data,
    reset: mutation.reset,
  }
}
