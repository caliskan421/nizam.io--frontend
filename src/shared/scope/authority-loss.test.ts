import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import { AUTHORITY_LOSS_CODES, hasErrorCode, isAuthorityLoss } from './authority-loss'

describe('yetki kaybı kodları (K6 + Y1)', () => {
  it('K6 ve Y1 kodlarının tamamı', () => {
    expect([...AUTHORITY_LOSS_CODES].sort()).toEqual(
      [
        'organization.membership_required',
        'organization.not_authorized',
        'program.not_found',
        'reporting.not_authorized',
        'work.not_authorized',
        'work.program_scope_invalid',
      ].sort(),
    )
  })

  it.each(AUTHORITY_LOSS_CODES)('%s → yetki kaybı', (code) => {
    expect(isAuthorityLoss(new ApiError({ code, status: 403 }))).toBe(true)
  })

  it.each([
    'work.item_not_found',
    'identity.force_password_change_required',
    'platform.unauthenticated',
    'client.network_error',
  ])('%s → yetki kaybı değil', (code) => {
    expect(isAuthorityLoss(new ApiError({ code }))).toBe(false)
  })

  it('ApiError olmayan değer yetki kaybı değildir', () => {
    expect(isAuthorityLoss(new Error('work.not_authorized'))).toBe(false)
    expect(hasErrorCode(null, 'program.not_found')).toBe(false)
    expect(hasErrorCode(new ApiError({ code: 'program.not_found' }), 'program.not_found')).toBe(
      true,
    )
  })
})
