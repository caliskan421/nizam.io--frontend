import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'

import { classifyFailure, classifyTicketOutcome, failureKind } from './failure'
import type { ReportRequest } from './types'

const err = (code: string, status: number) => new ApiError({ code, status })

describe('rapor hata sınıflandırması', () => {
  it.each([
    ['reporting.export_in_progress', 429, 1, 'export_in_progress', 1],
    ['platform.rate_limited', 429, 60, 'rate_limited', 60],
    ['reporting.capacity_full', 503, null, 'capacity_full', null],
    ['reporting.not_authorized', 403, null, 'not_authorized', null],
    ['reporting.not_found', 404, null, 'not_found', null],
    ['reporting.input_invalid', 422, null, 'input_invalid', null],
    ['identity.download_ticket_invalid', 404, null, 'ticket_invalid', null],
    ['audit.entry_rejected', 500, null, 'report_failed', null],
    ['platform.body_too_large', 413, null, 'too_large', null],
    ['platform.conflict_retry', 409, null, 'retry', null],
    ['identity.unavailable', 503, null, 'unavailable', null],
    ['client.network_error', 0, null, 'network', null],
    ['records.busy', 429, null, 'other', null],
  ])('%s (%i) → %s', (code, status, header, kind, counter) => {
    const failure = classifyFailure(err(code, status), header)
    expect(failure).toMatchObject({ kind, code, retryAfter: counter })
  })

  it('sayaç yalnız Retry-After başlığı varsa (BE-135): yok/0 → null', () => {
    expect(classifyFailure(err('reporting.capacity_full', 503), null).retryAfter).toBeNull()
    expect(classifyFailure(err('reporting.export_in_progress', 429), 0).retryAfter).toBeNull()
    expect(classifyFailure(err('reporting.export_in_progress', 429), null).retryAfter).toBeNull()
  })

  it('kullanıcı metni anahtardan: kendi metni olanlar reports.failure.*, diğerleri errors.*', () => {
    expect(classifyFailure(err('reporting.capacity_full', 503), null).messageKey).toBe(
      'reports.failure.capacity_full',
    )
    expect(classifyFailure(err('audit.entry_rejected', 500), null).messageKey).toBe(
      'reports.failure.report_failed',
    )
    expect(classifyFailure(err('reporting.not_authorized', 403), null).messageKey).toBe(
      'errors.reporting.not_authorized',
    )
    expect(classifyFailure(err('platform.rate_limited', 429), 5).messageKey).toBe(
      'errors.platform.rate_limited',
    )
  })

  it('bilinmeyen kod genel sınıfa düşer', () => {
    expect(failureKind('yeni.bilinmeyen')).toBe('other')
  })
})

describe('bilet üretimi sonucu', () => {
  const outcome = (o: object) => o as unknown as MutationOutcome<ReportRequest, unknown, unknown>

  it('429 (açık bilet tavanı): rate_limited + Retry-After', () => {
    const failure = classifyTicketOutcome(
      outcome({ kind: 'rate_limited', error: err('platform.rate_limited', 429), retryAfter: 60 }),
    )
    expect(failure).toMatchObject({ kind: 'rate_limited', retryAfter: 60 })
  })

  it('422 identity.download_target_invalid: genel hata (programlama hatası)', () => {
    const failure = classifyTicketOutcome(
      outcome({ kind: 'failed', error: err('identity.download_target_invalid', 422) }),
    )
    expect(failure).toMatchObject({ kind: 'other', code: 'identity.download_target_invalid' })
  })

  it('ağ kopması: network (bilet tüketilmedi, kullanıcı yeniden tıklar)', () => {
    const failure = classifyTicketOutcome(
      outcome({ kind: 'unknown_outcome', error: err('client.network_error', 0) }),
    )
    expect(failure).toMatchObject({ kind: 'network' })
  })

  it('kapsam/sahip değişimi sessizdir (null)', () => {
    expect(classifyTicketOutcome(outcome({ kind: 'scope_changed' }))).toBeNull()
    expect(classifyTicketOutcome(outcome({ kind: 'owner_disposed' }))).toBeNull()
  })
})
