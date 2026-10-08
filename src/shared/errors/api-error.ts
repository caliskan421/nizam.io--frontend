import type { ServerErrorCode } from '@/shared/api/error-codes.gen'
import { ERROR_CODES } from '@/shared/api/error-codes.gen'
import type { components } from '@/shared/api/schema'

import type { ClientErrorCode } from './client-codes'

type ErrorEnvelope = components['schemas']['ErrorEnvelope']

/** Kararlı hata kodu: sunucu kataloğu, istemci kodu ya da (yeni etiket gelene dek) bilinmeyen kod. */
export type ErrorCode = ServerErrorCode | ClientErrorCode

export interface NormalizedFieldError {
  field: string
  code: string
  messageKey: string
}

/**
 * Normalize edilmiş hata (C2 zarfı → istemci biçimi). Kullanıcı metni yalnız `messageKey`'den
 * i18n ile üretilir; sunucunun `message` alanı bilinçli olarak taşınmaz.
 */
export class ApiError extends Error {
  readonly code: string
  readonly messageKey: string
  readonly requestId: string | null
  readonly fields: NormalizedFieldError[]
  readonly status: number | null
  /** 429 yanıtında `Retry-After` (saniye); yoksa null. Yazmalarda otomatik tekrar yapılmaz. */
  readonly retryAfter: number | null

  constructor(init: {
    code: string
    requestId?: string | null
    fields?: NormalizedFieldError[]
    status?: number | null
    retryAfter?: number | null
    cause?: unknown
  }) {
    super(init.code, { cause: init.cause })
    this.name = 'ApiError'
    this.code = init.code
    this.messageKey = messageKeyFor(init.code)
    this.requestId = init.requestId ?? null
    this.fields = init.fields ?? []
    this.status = init.status ?? null
    this.retryAfter = init.retryAfter ?? null
  }

  /** Kod sunucu kataloğunda mı (yeni etiketle gelen ama henüz üretilmemiş kodlar hariç)? */
  get isKnownServerCode(): boolean {
    return Object.hasOwn(ERROR_CODES, this.code)
  }
}

export function messageKeyFor(code: string): string {
  if (Object.hasOwn(ERROR_CODES, code)) return ERROR_CODES[code as ServerErrorCode].messageKey
  return `errors.${code}`
}

export function clientError(
  code: ClientErrorCode,
  extra: { status?: number | null; requestId?: string | null; cause?: unknown } = {},
): ApiError {
  return new ApiError({ code, ...extra })
}

/** `Retry-After`: saniye (tamsayı) veya HTTP tarihi. Okunamazsa null. */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | null {
  if (value === null || value.trim() === '') return null
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return null
  return Math.max(0, Math.ceil((date - now) / 1000))
}

function isEnvelope(body: unknown): body is ErrorEnvelope {
  if (typeof body !== 'object' || body === null) return false
  const candidate = body as Record<string, unknown>
  return typeof candidate.code === 'string' && candidate.code.length > 0
}

/**
 * Başarısız bir HTTP yanıtını normalize eder. `body`, openapi-fetch'in döndürdüğü `error`
 * değeridir (JSON ayrıştırılabildiyse nesne, değilse metin).
 */
export function normalizeErrorResponse(response: Response, body: unknown): ApiError {
  const headerRequestId = response.headers.get('X-Request-Id')
  const retryAfter =
    response.status === 429 ? parseRetryAfter(response.headers.get('Retry-After')) : null
  if (!isEnvelope(body)) {
    return new ApiError({
      code: 'client.invalid_response',
      status: response.status,
      requestId: headerRequestId,
      retryAfter,
    })
  }
  const fields = Array.isArray(body.fields)
    ? body.fields
        .filter((f) => typeof f?.code === 'string')
        .map((f) => ({ field: f.field, code: f.code, messageKey: messageKeyFor(f.code) }))
    : []
  return new ApiError({
    code: body.code,
    status: response.status,
    requestId:
      typeof body.request_id === 'string' && body.request_id !== ''
        ? body.request_id
        : headerRequestId,
    fields,
    retryAfter,
  })
}

/** Fırlatılan herhangi bir değeri ApiError'a çevirir (ağ hatası → client.network_error). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return clientError('client.network_error', { cause: error })
}
