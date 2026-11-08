import { afterEach, describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'

import { useToast } from '../use-toast'
import { notifyOutcome, outcomeText, outcomeToast } from './notify'

type Outcome = MutationOutcome<unknown, unknown, unknown>
const error = (code: string) => new ApiError({ code, status: 409 })

afterEach(() => useToast().clear())

const unknown: Outcome = {
  kind: 'unknown_outcome',
  error: error('client.network_error'),
  reason: 'network',
  draft: {},
  idempotencyKey: 'k',
  firstSentAt: 0,
  retry: null,
}

describe('yazma sonucu bildirimi', () => {
  it('başarı ve onay istemi bildirim üretmez', () => {
    const success: Outcome = {
      kind: 'success',
      data: {},
      status: 200,
      replayed: false,
      idempotencyKey: 'k',
    }
    expect(outcomeToast(success)).toBeNull()
    expect(notifyOutcome(success)).toBe(false)
  })

  it('sonuç bilinmiyor ve çakışma kalıcı tehlike bildirimi; metin i18n', () => {
    expect(outcomeToast(unknown)).toEqual({
      message: outcomeText(unknown),
      tone: 'danger',
      timeout: 0,
    })
    expect(outcomeText(unknown)).toContain('yeniden gönderme süresi doldu')
    const conflict: Outcome = {
      kind: 'edit_conflict',
      error: error('work.edit_conflict'),
      groups: ['expected_revision'],
      draft: {},
      server: null,
    }
    expect(outcomeToast(conflict)?.timeout).toBe(0)
    expect(notifyOutcome(conflict)).toBe(true)
    expect(useToast().current.value?.message).toContain('Siz düzenlerken kayıt değişti')
  })

  it('failed: hata kodunun metni; sunucu message gösterilmez', () => {
    const failed: Outcome = { kind: 'failed', error: error('organization.not_authorized') }
    expect(outcomeText(failed)).not.toBe('organization.not_authorized')
    expect(outcomeToast(failed)?.tone).toBe('danger')
    const limited: Outcome = {
      kind: 'rate_limited',
      error: error('platform.rate_limited'),
      retryAfter: 30,
    }
    expect(outcomeText(limited)).toContain('30 saniye')
  })
})
