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

describe('normalizeErrorResponse: veri alanı izin listesi', () => {
  const body = (fields: unknown[]) => ({
    code: 'organization.department_in_use',
    message: 'sunucu metni',
    request_id: 'r1',
    fields,
  })
  const make = (fields: unknown[]) =>
    normalizeErrorResponse(new Response(null, { status: 409 }), body(fields))

  it('department_usage alanı değeri yalnız izin listesindeki kodda taşır', () => {
    const error = make([{ field: 'tables', code: 'organization.department_usage', message: '3' }])
    expect(error.fields).toEqual([
      expect.objectContaining({
        field: 'tables',
        code: 'organization.department_usage',
        value: '3',
      }),
    ])
  })

  it('izin listesi dışı kodun message değeri taşınmaz, hata iletisi arayüze sızmaz', () => {
    const error = make([{ field: 'tables', code: 'organization.other_code', message: 'ham metin' }])
    expect(error.fields[0]).not.toHaveProperty('value')
    expect(JSON.stringify(error.fields)).not.toContain('ham metin')
    expect(JSON.stringify(error)).not.toContain('sunucu metni')
  })
})
