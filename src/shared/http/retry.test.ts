import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import { SessionChangedError } from '@/shared/session/query-session'

import { retryTransient } from './retry'

describe('retryTransient', () => {
  it('ağ ve 5xx en çok iki kez; 4xx ve oturum değişimi hiç', () => {
    expect(retryTransient(0, new Error('ağ'))).toBe(true)
    expect(retryTransient(1, new ApiError({ code: 'platform.internal', status: 500 }))).toBe(true)
    expect(retryTransient(2, new ApiError({ code: 'platform.internal', status: 500 }))).toBe(false)
    expect(retryTransient(0, new ApiError({ code: 'work.item_not_found', status: 404 }))).toBe(
      false,
    )
    expect(retryTransient(0, new SessionChangedError())).toBe(false)
  })
})
