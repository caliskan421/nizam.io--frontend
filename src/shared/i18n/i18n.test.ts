import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from '@/shared/api/error-codes.gen'
import { ApiError } from '@/shared/errors/api-error'
import { CLIENT_ERROR_CODES } from '@/shared/errors/client-codes'

import { errorText, i18n } from './index'
import { trErrors } from './tr/errors'

// Katalogdaki her kod (zarf kodları + fields[] alan kodları) ve her istemci kodu için elle
// yazılmış TR metni vardır; fazlası yoktur.
const catalogCodes = new Set<string>()
for (const [code, entry] of Object.entries(ERROR_CODES)) {
  catalogCodes.add(code)
  for (const field of entry.fields) catalogCodes.add(field)
}
const expected = new Set<string>([...catalogCodes, ...CLIENT_ERROR_CODES])

describe('TR hata metinleri', () => {
  it('eksik kod yok', () => {
    const missing = [...expected].filter((code) => !(code in trErrors))
    expect(missing).toEqual([])
  })

  it('fazla kod yok', () => {
    const extra = Object.keys(trErrors).filter((code) => !expected.has(code))
    expect(extra).toEqual([])
  })

  it('her metin dolu ve vue-i18n özel karakteri içermiyor', () => {
    for (const [code, text] of Object.entries(trErrors)) {
      expect(text.trim(), code).not.toBe('')
      expect(text, code).not.toMatch(/[{}@$|]/)
    }
  })

  it('her messageKey i18n ağacında çözülür (client.* dahil)', () => {
    const g = i18n.global
    for (const code of expected) {
      const key = `errors.${code}`
      expect(g.te(key), key).toBe(true)
      expect(g.t(key)).toBe(trErrors[code])
    }
  })

  it('bilinmeyen kod genel metne düşer, sunucu mesajı gösterilmez', () => {
    expect(errorText(new ApiError({ code: 'yeni.kod' }))).toBe(trErrors['platform.internal'])
    expect(errorText(new ApiError({ code: 'identity.credentials_invalid' }))).toBe(
      'E-posta veya parola hatalı.',
    )
  })
})
