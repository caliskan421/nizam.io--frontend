import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'

import { useDialogWrite } from '../use-dialog-write'

afterEach(() => useToast().clear())

type Out = MutationOutcome<unknown, string, unknown>
const success = (data: string): Out => ({
  kind: 'success',
  data,
  status: 201,
  replayed: false,
  idempotencyKey: 'k',
})
const failed = (
  code: string,
  fields: { field: string; code: string; messageKey: string }[] = [],
): Out => ({ kind: 'failed', error: new ApiError({ code, status: 422, fields: fields }) })

function make() {
  const scope = effectScope()
  const write = scope.run(() => useDialogWrite())!
  return { scope, write }
}

describe('useDialogWrite', () => {
  it('başarı: onSuccess çağrılır, hata/uyarı temizlenir', () => {
    const { write } = make()
    const done = vi.fn()
    write.settle(failed('messaging.not_authorized'), done)
    expect(write.message.value).toBe('Bu işlem için yetkiniz yok.')
    expect(write.settle(success('x'), done)).toBeNull()
    expect(done).toHaveBeenCalledWith('x')
    expect(write.message.value).toBe('')
    expect(write.code.value).toBeNull()
  })

  it('failed: hata kodundan i18n metni + sınıf döner; sunucu iletisi yok', () => {
    const { write } = make()
    const failure = write.settle(failed('messaging.poll_closed'), vi.fn())
    expect(write.message.value).toBe('Anket kapandı.')
    expect(write.code.value).toBe('messaging.poll_closed')
    expect(failure?.class).toBe('conflict')
  })

  it('unknown_outcome yerinde bildirime gider', () => {
    const { write } = make()
    const unknown = {
      kind: 'unknown_outcome',
      error: new ApiError({ code: 'platform.network' }),
      reason: 'network',
      draft: {},
      idempotencyKey: 'k',
      firstSentAt: 0,
      retry: null,
    } as unknown as Out
    write.settle(unknown, vi.fn())
    expect(write.notice.value?.kind).toBe('unknown_outcome')
  })

  it('429 gibi diğer sınıflar ortak bildirimdir; owner_disposed sessiz', () => {
    const { write } = make()
    write.settle(
      {
        kind: 'rate_limited',
        error: new ApiError({ code: 'platform.rate_limited' }),
        retryAfter: 3,
      },
      vi.fn(),
    )
    expect(useToast().queue.value).toHaveLength(1)
    useToast().clear()
    write.settle({ kind: 'owner_disposed', draft: {}, idempotencyKey: 'k' }, vi.fn())
    expect(useToast().queue.value).toHaveLength(0)
  })

  it('sahip sökülünce geç sonuç hiçbir akış başlatmaz', () => {
    const { scope, write } = make()
    scope.stop()
    const done = vi.fn()
    write.settle(success('x'), done)
    write.settle(failed('messaging.not_authorized'), done)
    expect(done).not.toHaveBeenCalled()
    expect(write.message.value).toBe('')
  })
})
