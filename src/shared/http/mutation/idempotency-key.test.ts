import { describe, expect, it } from 'vitest'

import { generateIdempotencyKey, isValidIdempotencyKey } from './idempotency-key'

describe('Idempotency-Key', () => {
  it('crypto.getRandomValues ile 16 bayt → 22 karakter base64url, sözleşme sınırında', () => {
    const key = generateIdempotencyKey()
    expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(isValidIdempotencyKey(key)).toBe(true)
  })

  it('her çağrı yeni anahtar', () => {
    const keys = new Set(Array.from({ length: 200 }, () => generateIdempotencyKey()))
    expect(keys.size).toBe(200)
  })

  it('rastgele kaynak enjekte edilebilir; base64url alfabesi (+/ yok, dolgu yok)', () => {
    const key = generateIdempotencyKey((bytes) => bytes.fill(0xff))
    expect(key).toBe('_____________________w')
  })

  it('uzunluk kuralı kırpılmış UTF-8 bayttır: 22–200', () => {
    expect(isValidIdempotencyKey('a'.repeat(21))).toBe(false)
    expect(isValidIdempotencyKey(`  ${'a'.repeat(21)}  `)).toBe(false)
    expect(isValidIdempotencyKey('a'.repeat(22))).toBe(true)
    expect(isValidIdempotencyKey('a'.repeat(200))).toBe(true)
    expect(isValidIdempotencyKey('a'.repeat(201))).toBe(false)
    expect(isValidIdempotencyKey('ğ'.repeat(11))).toBe(true)
  })
})
