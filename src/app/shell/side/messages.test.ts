import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { sideText, trSide, type SideTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('kenar menüsü metinleri', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trSide) as SideTextKey[]) {
      const text = sideText(key, { name: 'X', year: 2026, n: 3, title: 'T', phase: 'F1’de' })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toBe(key)
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('yer tutucular', () => {
    expect(sideText('side.menu.season', { year: 2026 })).toBe('2026 sezonu')
    expect(sideText('side.badge.overdue', { n: 4 })).toBe('4 geciken görev')
    expect(sideText('side.card.programName', { name: 'Program Bir' })).toBe('Program: Program Bir')
    expect(sideText('side.brand')).toBe('RoketPortal')
  })
})
