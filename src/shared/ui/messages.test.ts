import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { trUi, uiText, type UiTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('ui metinleri', () => {
  it('her anahtar i18n ağacında çözülür ve dolu; vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trUi) as UiTextKey[]) {
      const text = uiText(key)
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toBe(key)
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })
})
