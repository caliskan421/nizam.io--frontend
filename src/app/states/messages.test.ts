import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { statesText, trStates, type StatesTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('açık durum metinleri', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trStates) as StatesTextKey[]) {
      const text = statesText(key, { action: 'Eylem' })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })
})
