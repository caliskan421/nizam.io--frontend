import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from './error-codes.gen'
import { OPERATIONS } from './operations.gen'

// Üretilmiş haritanın sözleşme ilkeleriyle tutarlılığı (C1: S2 → program başlığı,
// S3 → program + departman; yazma → CSRF; S0 → kimliksiz).
describe('operations.gen', () => {
  const entries = Object.entries(OPERATIONS)

  it('ilk dilimin 32 ucu üretildi', () => {
    expect(entries).toHaveLength(32)
  })

  it.each(entries)('%s kapsam/CSRF/kimlik tutarlı', (key, meta) => {
    // Geniş tipe çevrilir: ilk dilimde S3 yok, ama kural gelecekteki etiketlerde de sınanır.
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
    expect(op.csrf).toBe(method !== 'GET')
    expect(op.auth).toBe(op.scope !== 'S0')
  })

  it('hata kataloğu 144 kod ve message_key = errors.<kod>', () => {
    const codes = Object.entries(ERROR_CODES)
    expect(codes).toHaveLength(144)
    for (const [code, entry] of codes) expect(entry.messageKey).toBe(`errors.${code}`)
  })
})
