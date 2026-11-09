/**
 * Yazma sonucunun sınıflandırması (K5; istemci-akislari §8; ortak-kurallar §7).
 *
 * Katman fırlatmaz; her gönderim bu birleşimin tek bir üyesiyle biter. UI (O3 diyalogları)
 * `kind` üzerinden dallanır; kullanıcı metni `outcomeMessage()` anahtarından i18n ile üretilir
 * (sunucu `message` alanı gösterilmez).
 */
import type { ApiError } from '@/shared/errors/api-error'
import type { ScopeSnapshot } from '@/shared/scope/scope'

/**
 * Eylem bağlamı: eylemin oluşturulduğu kapsam + oturum nesli (`null` ≡ denetlenmez). Bileşik
 * işlemde ardıl adımlar ilk eylemin bağlamıyla gönderilir (`submit(vars, { context })`); motor
 * gönderim öncesi güncel değerle karşılaştırır (CX-F1-E-03).
 */
export interface ActionContext {
  readonly scope: ScopeSnapshot | null
  readonly generation: number | null
}

/** 201 yeni kaynak; 200 aynı anahtarın ilk kaynağı (tekrar) ya da olağan güncelleme. */
export interface MutationSuccess<D> {
  kind: 'success'
  data: D
  status: number
  /** Aynı anahtar daha önce gönderilmişti ve sunucu 200 döndü (ilk kaynağın bugünkü temsili). */
  replayed: boolean
  idempotencyKey: string
  /** Başarılı eylemin bağlamı (motor her zaman doldurur; ardıl adımlar bunu taşır). */
  context?: ActionContext
}

/** 409 `*.edit_conflict`: bayat sürüm grubu + sunucunun güncel değeri (alan alan seçim için). */
export interface MutationEditConflict<V, S> {
  kind: 'edit_conflict'
  error: ApiError
  /** `fields[].field`: `expected_revision` ve/veya `expected_dates_revision`. */
  groups: string[]
  /** Kullanıcının gönderdiği taslak (aynen). */
  draft: V
  /** `readCurrent` ile yeniden okunan güncel kayıt; okunamadıysa null. */
  server: S | null
}

/** 409 `*.idempotency_key_reused`: istemci hatası, otomatik tekrar yok. */
export interface MutationKeyReused {
  kind: 'idempotency_key_reused'
  error: ApiError
}

/** 409 `platform.conflict_retry`: aynı anahtarla tek otomatik tekrar da 409 döndü. */
export interface MutationConflictRetry {
  kind: 'conflict_retry'
  error: ApiError
}

export type UnknownReason = 'network' | 'timeout' | 'server'

/**
 * Sonuç bilinmiyor (ağ kopması, zaman aşımı, 5xx). Taslak ve anahtar korunur; `retry` aynı
 * anahtar + aynı gövdeyle yeniden gönderir. İlk gönderimden 24 saat sonra `retry` null'dır
 * (kullanıcı listeyi yenileyip karar verir). Yeni anahtarla kör gönderim yapılmaz.
 */
export interface MutationUnknown<V, D, S> {
  kind: 'unknown_outcome'
  error: ApiError
  reason: UnknownReason
  draft: V
  idempotencyKey: string
  firstSentAt: number
  retry: (() => Promise<MutationOutcome<V, D, S>>) | null
}

/** 429: `Retry-After` (saniye) metni gösterilir; otomatik tekrar yok. */
export interface MutationRateLimited {
  kind: 'rate_limited'
  error: ApiError
  retryAfter: number | null
}

/**
 * 409 `organization.confirmation_required` (yalnız organizasyon uçları). `taskTitles` atamadan
 * düşecek görevler; `confirm` kullanıcı onayıyla aynı isteği `confirm=true` ile yeni bir eylem
 * olarak gönderir.
 */
export interface MutationConfirmationRequired<V, D, S> {
  kind: 'confirmation_required'
  error: ApiError
  taskTitles: string[]
  confirm: () => Promise<MutationOutcome<V, D, S>>
}

/**
 * Eylem başka bir kapsamda (program / departman / mercek) oluşturulmuştu; kapsam o zamandan beri
 * değişti. Aynı anahtar başka kapsamla gönderilemez (istemci-akislari §8): istek **gönderilmedi**.
 * Kullanıcı özgün kapsama dönüp yeniden dener ya da kaydı denetler; taslak korunur.
 */
export interface MutationScopeChanged<V> {
  kind: 'scope_changed'
  draft: V
  idempotencyKey: string
  /** Eylemin yakalandığı (özgün) kapsam. */
  scope: ScopeSnapshot
}

/**
 * Yazmanın sahibi (hook'un kurulduğu bileşen / etki kapsamı) söküldü; istek **gönderilmedi**
 * (CX-F1-E-05). Yeni `submit`, `retry`, `confirm` devamı ve `platform.conflict_retry` otomatik
 * tekrarı bu kapıdan geçer. Dinleyen ekran yoktur: bildirim üretilmez (`outcomeToast` → null).
 * Başlamış (uçuştaki) istek geriye dönük iptal edilmez; bu sonuç yalnız YENİ gönderimi durdurur.
 */
export interface MutationOwnerDisposed<V> {
  kind: 'owner_disposed'
  draft: V
  idempotencyKey: string
}

/** Diğer bütün hatalar (403/404/422/diğer 409…): kod → i18n; karar kullanıcıda. */
export interface MutationFailed {
  kind: 'failed'
  error: ApiError
  /**
   * Sunucudan dönen hatada eylemin bağlamı (başarıdaki ile simetrik; CX-F1-E-02): hatanın
   * ardından gelen kullanıcı kararı (ör. `work.subtasks_open` onayı) İLK eylemin bağlamıyla
   * açılır ve gönderilir. İstemci kapısının ürettiği hatada (`client.session_ended`) yoktur.
   */
  context?: ActionContext
}

export type MutationOutcome<V, D, S = unknown> =
  | MutationSuccess<D>
  | MutationEditConflict<V, S>
  | MutationKeyReused
  | MutationConflictRetry
  | MutationUnknown<V, D, S>
  | MutationRateLimited
  | MutationConfirmationRequired<V, D, S>
  | MutationScopeChanged<V>
  | MutationOwnerDisposed<V>
  | MutationFailed

export type MutationKind = MutationOutcome<unknown, unknown>['kind']

/** i18n anahtarı + parametreler; metni UI üretir (`t(key, params)`). */
export interface OutcomeMessage {
  key: string
  params?: Record<string, number>
}

const SECONDS_PER_MINUTE = 60

/** Sonucun kullanıcı metni anahtarı (`src/shared/i18n/tr/mutation.ts`). */
export function outcomeMessage(outcome: MutationOutcome<unknown, unknown>): OutcomeMessage {
  switch (outcome.kind) {
    case 'success':
      return { key: 'mutation.outcome.success' }
    case 'edit_conflict':
      return { key: 'mutation.outcome.edit_conflict' }
    case 'idempotency_key_reused':
      return { key: 'mutation.outcome.idempotency_key_reused' }
    case 'conflict_retry':
      return { key: 'mutation.outcome.conflict_retry' }
    case 'unknown_outcome':
      return {
        key: outcome.retry ? 'mutation.outcome.unknown' : 'mutation.outcome.unknown_expired',
      }
    case 'rate_limited':
      return rateLimitMessage(outcome.retryAfter)
    case 'confirmation_required':
      return { key: 'mutation.outcome.confirmation_required' }
    case 'scope_changed':
      return { key: 'mutation.outcome.scope_changed' }
    case 'owner_disposed':
      // Gösterilmez (dinleyen ekran yok; `outcomeToast` null); anahtar yine eksiksizdir.
      return { key: 'mutation.outcome.owner_disposed' }
    case 'failed':
      return { key: outcome.error.messageKey }
  }
}

/** `Retry-After` metni: saniye < 60 → saniye; aksi hâlde yukarı yuvarlanmış dakika. */
export function rateLimitMessage(retryAfter: number | null): OutcomeMessage {
  if (retryAfter === null || retryAfter <= 0) return { key: 'mutation.outcome.rate_limited' }
  if (retryAfter < SECONDS_PER_MINUTE) {
    return { key: 'mutation.outcome.rate_limited_seconds', params: { seconds: retryAfter } }
  }
  return {
    key: 'mutation.outcome.rate_limited_minutes',
    params: { minutes: Math.ceil(retryAfter / SECONDS_PER_MINUTE) },
  }
}

/**
 * Sahibi sökülmüş sonuçlar (CX-F1-Ö-07). İstek sahip (ekran) yaşarken gönderildi ama sonucu
 * sahip SÖKÜLDÜKTEN sonra geldi: sunucu sonucu gerçektir (geçersizleme yapılır) fakat ekran onu
 * tüketmez — kullanıcıya bildirim ve yeniden okuma yok. `useProtectedMutation` işaretler;
 * ortak bildirim (`notifyOutcome`) bu sonuçları yok sayar.
 */
const DETACHED = new WeakSet<object>()

/** Sonucu "sahibi sökülmüş" diye işaretler (yalnız yazma katmanı). */
export function markDetached<T extends object>(outcome: T): T {
  DETACHED.add(outcome)
  return outcome
}

/** Sonuç sahibi söküldükten sonra mı geldi. */
export function isDetached(outcome: object): boolean {
  return DETACHED.has(outcome)
}

/**
 * Ekran bu sonucu tüketebilir mi (bildirim, yeniden okuma, ardıl UI akışı): sahip sökülmüşse
 * (`owner_disposed` ya da geç gelen sonuç) `false`.
 */
export function reachesOwner(outcome: MutationOutcome<unknown, unknown, unknown>): boolean {
  return outcome.kind !== 'owner_disposed' && !isDetached(outcome)
}
