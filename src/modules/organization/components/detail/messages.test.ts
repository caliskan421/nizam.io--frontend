import { describe, expect, it } from 'vitest'

import { trCoordinatorship } from '@/shared/i18n/tr/organization'

import { detailText, type DetailTextKey } from './messages'

function leaves(node: unknown, prefix = ''): [string, string][] {
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === 'string'
      ? [[`${prefix}${k}`, v] as [string, string]]
      : leaves(v, `${prefix}${k}.`),
  )
}

describe('08b metinleri (coordinatorship.*)', () => {
  const entries = leaves(trCoordinatorship)

  it('her yaprak dolu, statik ağaçtan çözülür; vue-i18n özel karakteri yok', () => {
    expect(entries.length).toBeGreaterThan(60)
    for (const [key, text] of entries) {
      expect(text.trim(), key).not.toBe('')
      expect(text.replace(/\{\w+\}/g, ''), key).not.toMatch(/[{}@$|]/)
      expect(detailText(key as DetailTextKey), key).toBe(text)
    }
  })

  it('yer tutucular doldurulur; eksik parametre olduğu gibi kalır', () => {
    expect(detailText('coordinatorship.head.people', { n: 9 })).toBe('9 kişi')
    expect(detailText('coordinatorship.kpi.openNote', { total: 12, done: 7, suffix: '’si' })).toBe(
      '12 görevin 7’si bitti',
    )
    expect(detailText('coordinatorship.team.open')).toBe('{n} açık iş')
  })
})
