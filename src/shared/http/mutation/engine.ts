/**
 * Yazma protokolünün Vue'dan bağımsız çekirdeği (K5). `useProtectedMutation` bunu TanStack
 * `useMutation` içinde koşturur; testler doğrudan da koşturabilir.
 *
 * Bir **eylem** (`MutationAction`) = kullanıcının bir gönderimi: dondurulmuş gövde + tek
 * `Idempotency-Key`. Ağ tekrarı (sonuç bilinmiyor → `retry`, `platform.conflict_retry`) aynı
 * eylemi yeniden gönderir; düzeltip yeniden gönderme ve onay (`confirm`) yeni eylemdir.
 *
 * Eylem, oluşturulduğu andaki kapsamı (program / departman / mercek) taşır. Aynı anahtarın
 * başka kapsamla tekrarı sunucuda istemci hatasıdır (istemci-akislari §8): kapsam değiştiyse
 * eylem gönderilmez, `scope_changed` döner. Başarı geçersizlemesi de bu kapsamla yapılır.
 * Eylem oturum neslini de taşır: arada çıkış olduysa (nesil değişti) eylem gönderilmez.
 * Kapsam ve nesil **her gönderimden önce** denetlenir — `platform.conflict_retry` otomatik
 * tekrarı dahil (CX-F0-E-06).
 */
import {
  ApiError,
  clientError,
  normalizeErrorResponse,
  toApiError,
} from '@/shared/errors/api-error'
import { CONFIRMATION_REQUIRED_CODE, extractTaskTitles } from '@/shared/errors/confirmation'
import { isAuthorityLoss } from '@/shared/scope/authority-loss'
import type { ScopeSnapshot } from '@/shared/scope/scope'

import { CSRF_HEADER_VALUE } from '../client'
import type { OperationId } from '../query-keys'
import { generateIdempotencyKey } from './idempotency-key'
import type { ActionContext, MutationOutcome, MutationUnknown, UnknownReason } from './outcome'

/** Sözleşmenin `confirmation_required` döndürdüğü yegâne uçlar (ortak-kurallar §7, sentez G7). */
export const CONFIRMATION_OPERATIONS: ReadonlySet<OperationId> = new Set<OperationId>([
  'removeCoordinator',
  'removeMember',
  'updateMembershipRole',
])

/** "Sonuç bilinmiyor" tekrarının ilk gönderimden itibaren süresi (istemci-akislari §8). */
export const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000
export const DEFAULT_TIMEOUT_MS = 30_000

export const CONFLICT_RETRY_CODE = 'platform.conflict_retry'

export interface MutationAction<V> {
  /** Dondurulmuş gövde: ağ tekrarında aynen gönderilir. */
  readonly vars: V
  readonly idempotencyKey: string
  /** Organizasyon uçlarında kullanıcı onayı verildi (`confirm=true`). */
  readonly confirm: boolean
  readonly firstSentAt: number
  /** Bu anahtarla daha önce yapılmış gönderim sayısı (tekrar tespiti). */
  readonly priorAttempts: number
  /** Eylemin oluşturulduğu kapsam; `null` ise motor kapsam denetlemez (kapsamsız çağıran). */
  readonly scope: ScopeSnapshot | null
  /** Eylemin oluşturulduğu oturum nesli; `null` ise motor nesil denetlemez. */
  readonly generation: number | null
}

/** `send`'e verilen bağlam. Çağıran başlıkları ve `confirm`'ü isteğe yerleştirir. */
export interface SendContext {
  idempotencyKey: string
  /** `Idempotency-Key` + `X-Requested-With` (istisnasız; ara katman da ekler). */
  headers: { 'Idempotency-Key': string; 'X-Requested-With': string }
  /** `true` ise uç onayı verilmiştir: sorguda `?confirm=true` ya da gövdede `confirm: true`. */
  confirm: boolean
  /** Zaman aşımında iptal edilir; openapi-fetch `signal` olarak geçirilir. */
  signal: AbortSignal
}

/** openapi-fetch sonucu (`{data, error, response}`). */
export interface SendResult<D> {
  data?: D
  error?: unknown
  response: Response
}

export interface EngineOptions<V, D, S> {
  operation: OperationId
  send: (vars: V, ctx: SendContext) => Promise<SendResult<D>>
  /** `edit_conflict`'te sunucunun güncel değerini okur (ör. `getWorkItem`). */
  readCurrent?: (vars: V) => Promise<S>
  timeoutMs?: number
  now?: () => number
  /** Gönderim anındaki güncel kapsam; eylemin yakalanmış kapsamıyla karşılaştırılır. */
  scope?: () => ScopeSnapshot
  /** Gönderim anındaki oturum nesli (`AuthSession.generation`); her çıkışta artar. */
  generation?: () => number
  /** Sonuç K6/Y1 yetki kaybı kodu taşıyorsa çağrılır (sonuç yine normalize döner). */
  onAuthorityLoss?: (error: ApiError) => void
}

/** Aynı ya da yeni eylemi yeniden koşturan geri çağrı (hook'ta `mutateAsync`). */
export type Rerun<V, D, S> = (action: MutationAction<V>) => Promise<MutationOutcome<V, D, S>>

/**
 * Gövdenin derin kopyası: çağıran taslağı sonradan değiştirse de tekrar aynı gövdeyi gönderir.
 * Kopyalanamayan gövde (fonksiyon, sembol, DOM düğümü…) açıkça reddedilir; özgün değişebilir
 * nesneye asla geri düşülmez. Dosya yüklemelerinde `File`/`Blob` taşınır, `FormData` `send`
 * içinde kurulur.
 */
export function freezeVars<V>(vars: V): V {
  try {
    return structuredClone(vars)
  } catch (cause) {
    throw new TypeError('Yazma gövdesi kopyalanamıyor (structuredClone desteklemiyor).', {
      cause,
    })
  }
}

/** Kapsam kimliği: program + departman + mercek (`null` ≡ yok). */
export function sameScope(a: ScopeSnapshot, b: ScopeSnapshot): boolean {
  return (
    (a.programId ?? null) === (b.programId ?? null) &&
    (a.departmentId ?? null) === (b.departmentId ?? null) &&
    (a.lens ?? null) === (b.lens ?? null)
  )
}

/** Yeni kullanıcı eylemi: yeni anahtar, dondurulmuş gövde, o anki kapsamın anlık görüntüsü. */
export function newAction<V>(
  vars: V,
  opts: {
    confirm?: boolean
    now?: () => number
    scope?: ScopeSnapshot | null
    generation?: number | null
  } = {},
): MutationAction<V> {
  return {
    vars: freezeVars(vars),
    idempotencyKey: generateIdempotencyKey(),
    confirm: opts.confirm ?? false,
    firstSentAt: (opts.now ?? Date.now)(),
    priorAttempts: 0,
    scope: opts.scope ? { ...opts.scope } : null,
    generation: opts.generation ?? null,
  }
}

type Attempt<D> =
  | { ok: true; data: D; status: number }
  | { ok: false; error: ApiError; body: unknown; reason: UnknownReason | null }

class TimeoutSignal extends Error {}

async function sendOnce<V, D, S>(
  action: MutationAction<V>,
  opts: EngineOptions<V, D, S>,
): Promise<Attempt<D>> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const signal = new TimeoutSignal('timeout')
      controller.abort(signal)
      reject(signal)
    }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  })
  const ctx: SendContext = {
    idempotencyKey: action.idempotencyKey,
    headers: { 'Idempotency-Key': action.idempotencyKey, 'X-Requested-With': CSRF_HEADER_VALUE },
    confirm: action.confirm,
    signal: controller.signal,
  }
  try {
    const result = await Promise.race([opts.send(action.vars, ctx), timeout])
    if (result.response.ok) {
      return { ok: true, data: result.data as D, status: result.response.status }
    }
    const error = normalizeErrorResponse(result.response, result.error)
    return {
      ok: false,
      error,
      body: result.error,
      reason: result.response.status >= 500 ? 'server' : null,
    }
  } catch (cause) {
    if (cause instanceof TimeoutSignal || controller.signal.aborted) {
      return {
        ok: false,
        error: clientError('client.network_error', { cause }),
        body: null,
        reason: 'timeout',
      }
    }
    if (cause instanceof SyntaxError) {
      return {
        ok: false,
        error: new ApiError({ code: 'client.invalid_response', cause }),
        body: null,
        reason: 'server',
      }
    }
    const error = toApiError(cause)
    const reason: UnknownReason | null = error.code === 'client.network_error' ? 'network' : null
    return { ok: false, error, body: null, reason }
  } finally {
    clearTimeout(timer)
  }
}

const isConflictRetry = (a: Attempt<unknown>): boolean =>
  !a.ok && a.error.status === 409 && a.error.code === CONFLICT_RETRY_CODE

type Failure<D> = Extract<Attempt<D>, { ok: false }>

interface Classify<V, D, S> {
  action: MutationAction<V>
  opts: EngineOptions<V, D, S>
  rerun: Rerun<V, D, S>
  attempts: number
  now: () => number
}

/**
 * Sonuç bilinmiyor: taslak + anahtar korunur; pencere içinde aynı eylem yeniden gönderilir.
 * `draft` gönderilecek gövdenin ayrı kopyasıdır (UI değiştirse de tekrar gövdesi değişmez).
 * 24 saat penceresi `retry()` çağrıldığı anda yeniden denetlenir; dolmuşsa gönderim yapılmaz.
 */
function unknownOutcome<V, D, S>(
  failure: Failure<D> & { reason: UnknownReason },
  { action, rerun, attempts, now }: Classify<V, D, S>,
): MutationUnknown<V, D, S> {
  const expired = () => now() - action.firstSentAt >= RETRY_WINDOW_MS
  const outcome: MutationUnknown<V, D, S> = {
    kind: 'unknown_outcome',
    error: failure.error,
    reason: failure.reason,
    draft: freezeVars(action.vars),
    idempotencyKey: action.idempotencyKey,
    firstSentAt: action.firstSentAt,
    retry: null,
  }
  if (!expired()) {
    outcome.retry = () =>
      expired()
        ? Promise.resolve({ ...outcome, retry: null })
        : rerun({ ...action, priorAttempts: attempts })
  }
  return outcome
}

/** Onay yalnız organizasyon uçlarında ve henüz onay verilmemişse sınıf olur. */
function needsConfirmation<V, D, S>(error: ApiError, c: Classify<V, D, S>): boolean {
  return (
    error.code === CONFIRMATION_REQUIRED_CODE &&
    CONFIRMATION_OPERATIONS.has(c.opts.operation) &&
    !c.action.confirm
  )
}

/** 409 dalları; eşleşme yoksa null (→ failed). */
async function classifyConflict<V, D, S>(
  failure: Failure<D>,
  c: Classify<V, D, S>,
): Promise<MutationOutcome<V, D, S> | null> {
  const { error } = failure
  if (error.code === CONFLICT_RETRY_CODE) return { kind: 'conflict_retry', error }
  if (error.code.endsWith('.idempotency_key_reused')) {
    return { kind: 'idempotency_key_reused', error }
  }
  if (error.code.endsWith('.edit_conflict')) {
    return {
      kind: 'edit_conflict',
      error,
      groups: error.fields.map((f) => f.field),
      draft: freezeVars(c.action.vars),
      server: await readServer(c.action.vars, c.opts),
    }
  }
  if (!needsConfirmation(error, c)) return null
  return {
    kind: 'confirmation_required',
    error,
    taskTitles: extractTaskTitles(failure.body),
    // Onay yeni bir kullanıcı kararıdır: yeni eylem (yeni anahtar), aynı taslak, aynı kapsam.
    confirm: () =>
      c.rerun(
        newAction(c.action.vars, {
          confirm: true,
          now: c.now,
          scope: c.action.scope,
          generation: c.action.generation,
        }),
      ),
  }
}

async function classifyFailure<V, D, S>(
  failure: Failure<D>,
  c: Classify<V, D, S>,
): Promise<MutationOutcome<V, D, S>> {
  const { error, reason } = failure
  if (reason !== null) return unknownOutcome({ ...failure, reason }, c)
  if (error.status === 429) {
    return { kind: 'rate_limited', error, retryAfter: error.retryAfter }
  }
  const conflict = error.status === 409 ? await classifyConflict(failure, c) : null
  return conflict ?? { kind: 'failed', error }
}

/**
 * Gönderim kapısı: eylemin oturum nesli ya da kapsamı güncel değerden farklıysa gönderilmeyecek
 * sonuç; aynıysa null. Nesil değişimi (çıkış) `client.session_ended` olarak döner.
 */
function blockedSend<V, D, S>(
  action: MutationAction<V>,
  opts: EngineOptions<V, D, S>,
): MutationOutcome<V, D, S> | null {
  if (action.generation !== null && opts.generation && action.generation !== opts.generation()) {
    return { kind: 'failed', error: clientError('client.session_ended') }
  }
  if (!action.scope || !opts.scope || sameScope(action.scope, opts.scope())) return null
  return {
    kind: 'scope_changed',
    draft: freezeVars(action.vars),
    idempotencyKey: action.idempotencyKey,
    scope: { ...action.scope },
  }
}

type Sent<D> = { attempt: Attempt<D>; attempts: number }

/**
 * Gönderim + `platform.conflict_retry`'da aynı anahtar ve gövdeyle tek otomatik tekrar. Her
 * `sendOnce` öncesi kapı denetlenir: ilk istek beklerken kapsam ya da nesil değiştiyse ikinci
 * istek çıkmaz (CX-F0-E-06).
 */
async function sendGuarded<V, D, S>(
  action: MutationAction<V>,
  opts: EngineOptions<V, D, S>,
): Promise<Sent<D> | MutationOutcome<V, D, S>> {
  const blocked = blockedSend(action, opts)
  if (blocked) return blocked
  const first = await sendOnce(action, opts)
  if (!isConflictRetry(first)) return { attempt: first, attempts: action.priorAttempts + 1 }
  const again = blockedSend(action, opts)
  if (again) return again
  return { attempt: await sendOnce(action, opts), attempts: action.priorAttempts + 2 }
}

/**
 * Bir eylemi koşturur ve sonucu sınıflandırır. `platform.conflict_retry` aynı anahtar + aynı
 * gövdeyle **bir kez** otomatik tekrar edilir; başka hiçbir sonuç otomatik tekrar edilmez.
 * Kapsam ya da oturum nesli eylemden bu yana değiştiyse (otomatik tekrar dahil) gönderilmez.
 * Yetki kaybı kodları `onAuthorityLoss` ile bildirilir (K6).
 */
export async function runAction<V, D, S>(
  action: MutationAction<V>,
  opts: EngineOptions<V, D, S>,
  rerun: Rerun<V, D, S>,
): Promise<MutationOutcome<V, D, S>> {
  const sent = await sendGuarded(action, opts)
  if ('kind' in sent) return sent
  const { attempt, attempts } = sent
  const context = contextOf(action)
  if (!attempt.ok) {
    if (isAuthorityLoss(attempt.error)) opts.onAuthorityLoss?.(attempt.error)
    const c = { action, opts, rerun, attempts, now: opts.now ?? Date.now }
    const outcome = await classifyFailure(attempt, c)
    return outcome.kind === 'failed' ? { ...outcome, context } : outcome
  }
  return {
    kind: 'success',
    data: attempt.data,
    status: attempt.status,
    replayed: attempt.status === 200 && attempts > 1,
    idempotencyKey: action.idempotencyKey,
    context,
  }
}

/** Eylemin bağlamı (kapsam kopyası + nesil); sonuçta ardıl karar/adım için açığa çıkar. */
function contextOf<V>(action: MutationAction<V>): ActionContext {
  return { scope: action.scope ? { ...action.scope } : null, generation: action.generation }
}

async function readServer<V, D, S>(vars: V, opts: EngineOptions<V, D, S>): Promise<S | null> {
  if (!opts.readCurrent) return null
  try {
    return await opts.readCurrent(vars)
  } catch {
    return null
  }
}
