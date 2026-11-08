import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import { createPartialText, trWork, workText } from './messages'

const success = {
  kind: 'success',
  data: {},
  status: 201,
  replayed: false,
  idempotencyKey: 'k',
} as const

describe('work metinleri', () => {
  it('kısmi başarı metni (ortak-kurallar §7)', () => {
    expect(workText('work.create.partial')).toBe(trWork.work.create.partial)
    expect(
      createPartialText({ kind: 'partial', primary: success, steps: [], failed: ['assignments'] }),
    ).toBe('Görev oluşturuldu, ek atama yapılamadı.')
  })

  it('tam başarı ve birincil hata: ek metin yok', () => {
    expect(createPartialText({ kind: 'complete', primary: success, steps: [] })).toBeNull()
    expect(
      createPartialText({
        kind: 'primary_failed',
        primary: { kind: 'failed', error: new ApiError({ code: 'work.input_invalid' }) },
      }),
    ).toBeNull()
  })
})
