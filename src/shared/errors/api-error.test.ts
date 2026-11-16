import { describe, expect, it } from 'vitest'

import { normalizeErrorResponse } from './api-error'

const envelope = { code: 'reporting.capacity_full', message: 'x', request_id: 'r', fields: [] }
const reply = (status: number, headers: Record<string, string> = {}) =>
  new Response(null, { status, headers })

describe('normalizeErrorResponse: Retry-After (BE-135)', () => {
  it('429 ve 503 yanıtında başlık saniye olarak okunur', () => {
    expect(normalizeErrorResponse(reply(429, { 'Retry-After': '17' }), envelope).retryAfter).toBe(
      17,
    )
    expect(normalizeErrorResponse(reply(503, { 'Retry-After': '12' }), envelope).retryAfter).toBe(
      12,
    )
  })

  it('başlık yoksa ya da başka durumdaysa null (500/422 başlığı yok sayılır)', () => {
    expect(normalizeErrorResponse(reply(503), envelope).retryAfter).toBeNull()
    expect(
      normalizeErrorResponse(reply(500, { 'Retry-After': '5' }), envelope).retryAfter,
    ).toBeNull()
    expect(
      normalizeErrorResponse(reply(422, { 'Retry-After': '5' }), envelope).retryAfter,
    ).toBeNull()
  })

  it('zarfsız 503 gövdesinde de başlık korunur', () => {
    const error = normalizeErrorResponse(reply(503, { 'Retry-After': '9' }), 'metin')
    expect(error).toMatchObject({ code: 'client.invalid_response', retryAfter: 9 })
  })
})
