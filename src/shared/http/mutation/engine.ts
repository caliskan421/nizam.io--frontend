/**
 * Yazma protokolünün Vue'dan bağımsız çekirdeği (K5). `useProtectedMutation` bunu TanStack
 * `useMutation` içinde koşturur; testler doğrudan da koşturabilir.
 *
 * Bir **eylem** (`MutationAction`) = kullanıcının bir gönderimi: dondurulmuş gövde + tek
 * `Idempotency-Key`. Ağ tekrarı (sonuç bilinmiyor → `retry`, `platform.conflict_retry`) aynı
 * eylemi yeniden gönderir; düzeltip yeniden gönderme ve onay (`confirm`) yeni eylemdir.
 */
import {
  ApiError,
  clientError,
  normalizeErrorResponse,
  toApiError,
} from '@/shared/errors/api-error'
import { CONFIRMATION_REQUIRED_CODE, extractTaskTitles } from '@/shared/errors/confirmation'

import { CSRF_HEADER_VALUE } from '../client'
import type { OperationId } from '../query-keys'
import { generateIdempotencyKey } from './idempotency-key'
import type { MutationOutcome, UnknownReason } from './outcome'

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
}

/** Aynı ya da yeni eylemi yeniden koşturan geri çağrı (hook'ta `mutateAsync`). */
export type Rerun<V, D, S> = (action: MutationAction<V>) => Promise<MutationOutcome<V, D, S>>

/** Gövdeyi dondurur: çağıran taslağı sonradan değiştirse de tekrar aynı gövdeyi gönderir. */
export function freezeVars<V>(vars: V): V {
  try {
    return structuredClone(vars)
  } catch {
    return vars
  }
}

/** Yeni kullanıcı eylemi: yeni anahtar, dondurulmuş gövde. */
export function newAction<V>(
  vars: V,
  opts: { confirm?: boolean; now?: () => number } = {},
): MutationAction<V> {
  return {
    vars: freezeVars(vars),
    idempotencyKey: generateIdempotencyKey(),
    confirm: opts.confirm ?? false,
    firstSentAt: (opts.now ?? Date.now)(),
    priorAttempts: 0,
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

/** Gönderim + `platform.conflict_retry`'da aynı anahtar ve gövdeyle tek otomatik tekrar. */
async function sendWithConflictRetry<V, D, S>(
  action: MutationAction<V>,
  opts: EngineOptions<V, D, S>,
): Promise<{ attempt: Attempt<D>; attempts: number }> {
  let attempt = await sendOnce(action, opts)
  let attempts = action.priorAttempts + 1
  if (isConflictRetry(attempt)) {
    attempt = await sendOnce(action, opts)
    attempts += 1
  }
  return { attempt, attempts }
}

type Failure<D> = Extract<Attempt<D>, { ok: false }>

interface Classify<V, D, S> {
  action: MutationAction<V>
  opts: EngineOptions<V, D, S>
  rerun: Rerun<V, D, S>
  attempts: number
  now: () => number
}

/** Sonuç bilinmiyor: taslak + anahtar korunur; pencere içinde aynı eylem yeniden gönderilir. */
function unknownOutcome<V, D, S>(
  failure: Failure<D> & { reason: UnknownReason },
  { action, rerun, attempts, now }: Classify<V, D, S>,
): MutationOutcome<V, D, S> {
  const withinWindow = now() - action.firstSentAt < RETRY_WINDOW_MS
  return {
    kind: 'unknown_outcome',
    error: failure.error,
    reason: failure.reason,
    draft: action.vars,
    idempotencyKey: action.idempotencyKey,
    firstSentAt: action.firstSentAt,
    retry: withinWindow ? () => rerun({ ...action, priorAttempts: attempts }) : null,
  }
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
      draft: c.action.vars,
      server: await readServer(c.action.vars, c.opts),
    }
  }
  if (!needsConfirmation(error, c)) return null
  return {
    kind: 'confirmation_required',
    error,
    taskTitles: extractTaskTitles(failure.body),
    // Onay yeni bir kullanıcı kararıdır: yeni eylem (yeni anahtar), aynı taslak.
    confirm: () => c.rerun(newAction(c.action.vars, { confirm: true, now: c.now })),
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
 * Bir eylemi koşturur ve sonucu sınıflandırır. `platform.conflict_retry` aynı anahtar + aynı
 * gövdeyle **bir kez** otomatik tekrar edilir; başka hiçbir sonuç otomatik tekrar edilmez.
 */
export async function runAction<V, D, S>(
  action: MutationAction<V>,
  opts: EngineOptions<V, D, S>,
  rerun: Rerun<V, D, S>,
): Promise<MutationOutcome<V, D, S>> {
  const { attempt, attempts } = await sendWithConflictRetry(action, opts)
  if (!attempt.ok) {
    return classifyFailure(attempt, { action, opts, rerun, attempts, now: opts.now ?? Date.now })
  }
  return {
    kind: 'success',
    data: attempt.data,
    status: attempt.status,
    replayed: attempt.status === 200 && attempts > 1,
    idempotencyKey: action.idempotencyKey,
  }
}

async function readServer<V, D, S>(vars: V, opts: EngineOptions<V, D, S>): Promise<S | null> {
  if (!opts.readCurrent) return null
  try {
    return await opts.readCurrent(vars)
  } catch {
    return null
  }
}
