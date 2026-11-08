import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import { trMutation } from '@/shared/i18n/tr/mutation'

import { outcomeMessage, rateLimitMessage, type MutationOutcome } from './outcome'

const error = new ApiError({ code: 'work.not_authorized', status: 403 })
const noop = () => Promise.reject(new Error('kullanılmaz'))

const samples: Array<MutationOutcome<unknown, unknown>> = [
  { kind: 'success', data: null, status: 201, replayed: false, idempotencyKey: 'k' },
  { kind: 'edit_conflict', error, groups: [], draft: {}, server: null },
  { kind: 'idempotency_key_reused', error },
  { kind: 'conflict_retry', error },
  {
    kind: 'unknown_outcome',
    error,
    reason: 'network',
    draft: {},
    idempotencyKey: 'k',
    firstSentAt: 0,
    retry: noop,
  },
  {
    kind: 'unknown_outcome',
    error,
    reason: 'timeout',
    draft: {},
    idempotencyKey: 'k',
    firstSentAt: 0,
    retry: null,
  },
  { kind: 'rate_limited', error, retryAfter: null },
  { kind: 'rate_limited', error, retryAfter: 5 },
  { kind: 'rate_limited', error, retryAfter: 61 },
  { kind: 'confirmation_required', error, taskTitles: [], confirm: noop },
]

const i18n = createI18n({ legacy: false, locale: 'tr', messages: { tr: trMutation } })

describe('outcomeMessage', () => {
  it('her protokol sınıfının anahtarı TR dosyasında çözülür ve parametresi işlenir', () => {
    const g = i18n.global
    for (const outcome of samples) {
      const { key, params } = outcomeMessage(outcome)
      expect(g.te(key), key).toBe(true)
      const text = g.t(key, params ?? {})
      expect(text).not.toMatch(/[{}]/)
    }
    expect(g.t('mutation.outcome.partial')).not.toBe('')
  })

  it('scope_changed kendi anahtarına gider (TR metni i18n sahibince eklenecek)', () => {
    expect(
      outcomeMessage({
        kind: 'scope_changed',
        draft: {},
        idempotencyKey: 'k',
        scope: { programId: 'p1', departmentId: null },
      }),
    ).toEqual({ key: 'mutation.outcome.scope_changed' })
  })

  it('failed hata kodunun kendi metnine gider', () => {
    expect(outcomeMessage({ kind: 'failed', error })).toEqual({
      key: 'errors.work.not_authorized',
    })
  })

  it('Retry-After metni: saniye, dakika (yukarı yuvarlanır), bilinmiyor', () => {
    expect(rateLimitMessage(null).key).toBe('mutation.outcome.rate_limited')
    expect(rateLimitMessage(0).key).toBe('mutation.outcome.rate_limited')
    expect(rateLimitMessage(59)).toEqual({
      key: 'mutation.outcome.rate_limited_seconds',
      params: { seconds: 59 },
    })
    expect(rateLimitMessage(61)).toEqual({
      key: 'mutation.outcome.rate_limited_minutes',
      params: { minutes: 2 },
    })
    expect(i18n.global.t('mutation.outcome.rate_limited_seconds', { seconds: 42 })).toContain('42')
  })
})
