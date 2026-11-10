import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from './error-codes.gen'
import { OPERATIONS } from './operations.gen'

// Üretilmiş haritanın sözleşme ilkeleriyle tutarlılığı (C1: S2 → program başlığı,
// S3 → program + departman; yazma → CSRF; S0 → kimliksiz).
describe('operations.gen', () => {
  const entries = Object.entries(OPERATIONS)

  it('v0.15.0-api sözleşmesinin 189 ucu üretildi', () => {
    expect(entries).toHaveLength(189)
  })

  it.each(entries)('%s kapsam/CSRF/kimlik tutarlı', (key, meta) => {
    const op = meta as {
      scope: string
      programHeader: boolean
      departmentHeader: boolean
      csrf: boolean
      auth: boolean
    }
    const method = key.split(' ')[0]
    expect(op.programHeader).toBe(op.scope === 'S2' || op.scope === 'S3')
    expect(op.departmentHeader).toBe(op.scope === 'S3')
    // Sözleşme istisnası: dosya yükleme (multipart) CSRF başlığı istemez, taşıyıcı yalnız Bearer.
    expect(op.csrf).toBe(method !== 'GET' && key !== 'POST /v1/work-items/{id}/files')
    expect(op.auth).toBe(op.scope !== 'S0')
  })

  it('hata kataloğu 194 kod ve message_key = errors.<kod>', () => {
    const codes = Object.entries(ERROR_CODES)
    expect(codes).toHaveLength(194)
    for (const [code, entry] of codes) expect(entry.messageKey).toBe(`errors.${code}`)
  })
})
