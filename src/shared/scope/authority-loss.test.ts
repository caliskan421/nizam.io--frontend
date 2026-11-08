import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import {
  AUTHORITY_LOSS_CODES,
  hasErrorCode,
  isAuthorityLoss,
  onAuthorityLoss,
  reportAuthorityLoss,
} from './authority-loss'

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

describe('yetki kaybı kanalı (QueryClient başına)', () => {
  const loss = () => new ApiError({ code: 'organization.not_authorized', status: 403 })

  it('yalnız yetki kaybı yayınlanır; dinleyici hatayı alır', () => {
    const client = new QueryClient()
    const heard: string[] = []
    onAuthorityLoss(client, (e) => heard.push(e.code))
    expect(reportAuthorityLoss(client, loss())).toBe(true)
    expect(reportAuthorityLoss(client, new ApiError({ code: 'work.item_not_found' }))).toBe(false)
    expect(reportAuthorityLoss(client, new Error('work.not_authorized'))).toBe(false)
    expect(heard).toEqual(['organization.not_authorized'])
  })

  it('kanal istemci başına ayrıdır', () => {
    const a = new QueryClient()
    const b = new QueryClient()
    const heardA: string[] = []
    const heardB: string[] = []
    onAuthorityLoss(a, (e) => heardA.push(e.code))
    onAuthorityLoss(b, (e) => heardB.push(e.code))
    reportAuthorityLoss(a, loss())
    expect(heardA).toHaveLength(1)
    expect(heardB).toEqual([])
    // Dinleyicisi olmayan istemciye yayın sessizce biter.
    expect(reportAuthorityLoss(new QueryClient(), loss())).toBe(true)
  })

  it('abonelik iptali dinleyiciyi düşürür; diğer dinleyiciler kalır', () => {
    const client = new QueryClient()
    const first: string[] = []
    const second: string[] = []
    const off = onAuthorityLoss(client, (e) => first.push(e.code))
    onAuthorityLoss(client, (e) => second.push(e.code))
    off()
    off()
    reportAuthorityLoss(client, loss())
    expect(first).toEqual([])
    expect(second).toHaveLength(1)
  })
})
