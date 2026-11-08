import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import { programHeaders, retryTransient, scopeHeaders, WORK_ITEM_PAGE_LIMIT } from './http'

describe('görev HTTP yardımcıları', () => {
  it('kapsam başlıkları hedeften birebir', () => {
    expect(scopeHeaders({ programId: 'p1', departmentId: 'd2' })).toEqual({
      'X-Nizamio-Program': 'p1',
      'X-Nizamio-Department': 'd2',
    })
    expect(programHeaders({ programId: 'p1' })).toEqual({ 'X-Nizamio-Program': 'p1' })
  })

  it('tekrar yalnız geçici hatalarda, en çok iki kez', () => {
    const network = new ApiError({ code: 'client.network_error' })
    const server = new ApiError({ code: 'platform.internal', status: 500 })
    const verdict = new ApiError({ code: 'work.item_not_found', status: 404 })
    expect(retryTransient(0, network)).toBe(true)
    expect(retryTransient(1, server)).toBe(true)
    expect(retryTransient(2, server)).toBe(false)
    expect(retryTransient(0, verdict)).toBe(false)
    expect(retryTransient(0, new Error('x'))).toBe(true)
  })

  it('sayfa boyu 200 (P4)', () => {
    expect(WORK_ITEM_PAGE_LIMIT).toBe(200)
  })
})
