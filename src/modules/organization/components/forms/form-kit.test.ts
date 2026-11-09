import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ApiError } from '@/shared/errors/api-error'

import { personSchema, serverFieldErrors, toTypedSchema } from './form-kit'

describe('form-kit', () => {
  it('toTypedSchema: zod sorunları yol başına toplanır', async () => {
    const schema = toTypedSchema<{ a: string }, { a: string }>(
      z.object({ a: z.string().min(2, 'kısa') }),
    )
    expect(await schema.parse({ a: 'x' })).toEqual({ errors: [{ path: 'a', errors: ['kısa'] }] })
    expect(await schema.parse({ a: 'xy' })).toEqual({ value: { a: 'xy' }, errors: [] })
  })

  it('personSchema: seçim zorunlu', () => {
    expect(personSchema('seç').safeParse({ person: null }).success).toBe(false)
    expect(
      personSchema('seç').safeParse({ person: { accountId: 'u', fullName: 'A' } }).success,
    ).toBe(true)
  })

  it('serverFieldErrors: alan adı / kod eşlemesi; metin i18n, sunucu message yok', () => {
    const error = new ApiError({
      code: 'identity.input_invalid',
      fields: [
        {
          field: 'email',
          code: 'identity.invalid_email',
          messageKey: 'errors.identity.invalid_email',
        },
        { field: 'bilinmeyen', code: 'x.y', messageKey: 'errors.x.y' },
      ],
    })
    expect(serverFieldErrors(error, { email: 'email' as const })).toEqual({
      email: 'E-posta adresi geçersiz.',
    })
    const bare = new ApiError({ code: 'organization.membership_exists' })
    expect(
      serverFieldErrors(bare, {}, { 'organization.membership_exists': 'person' as const }),
    ).toEqual({ person: 'Kullanıcı bu departmanda zaten üye.' })
    expect(serverFieldErrors(bare, {})).toEqual({})
  })
})
