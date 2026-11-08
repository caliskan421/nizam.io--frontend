import { describe, expect, it } from 'vitest'

import { ERROR_CODES } from '@/shared/api/error-codes.gen'
import { ApiError } from '@/shared/errors/api-error'
import { CLIENT_ERROR_CODES } from '@/shared/errors/client-codes'

import { errorText, i18n } from './index'
import { trErrors } from './tr/errors'
import { trMutation } from './tr/mutation'
import { trConfirm, trConflict, trUi } from './tr/ui'

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

  it('yazma protokolü metinleri (mutation.*) uygulama i18n ağacında çözülür', () => {
    const g = i18n.global
    const walk = (node: Record<string, unknown>, prefix: string): string[] =>
      Object.entries(node).flatMap(([k, v]) =>
        typeof v === 'string'
          ? [`${prefix}${k}`]
          : walk(v as Record<string, unknown>, `${prefix}${k}.`),
      )
    const keys = walk(trMutation, '')
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(g.te(key), key).toBe(true)
    expect(g.t('mutation.outcome.rate_limited_seconds', { seconds: 7 })).toContain('7')
  })

  it('shared/ui metinleri (ui.*, confirm.*, conflict.*) statik ağaçta; bileşen yüklenmeden çözülür', () => {
    const g = i18n.global
    const walk = (node: Record<string, unknown>, prefix: string): [string, string][] =>
      Object.entries(node).flatMap(([k, v]) =>
        typeof v === 'string'
          ? [[`${prefix}${k}`, v] as [string, string]]
          : walk(v as Record<string, unknown>, `${prefix}${k}.`),
      )
    // Bu test shared/ui modüllerini içe aktarmaz: çalışma anı birleştirme olsaydı anahtar yoktu.
    const entries = [trUi, trConfirm, trConflict].flatMap((tree) => walk(tree, ''))
    expect(entries.length).toBeGreaterThan(20)
    for (const [key, text] of entries) {
      expect(g.te(key), key).toBe(true)
      expect(g.tm(key), key).toBe(text)
    }
    expect(g.t('conflict.choice', { field: 'Başlık' })).toBe('Başlık: kalacak değer')
  })
})
