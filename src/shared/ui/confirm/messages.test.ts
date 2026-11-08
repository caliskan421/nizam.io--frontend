import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { confirmText, mutationText, trConfirm, type ConfirmTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('onay metinleri', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trConfirm) as ConfirmTextKey[]) {
      const text = confirmText(key, { n: 2 })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('protokol eylem adları mutation.* ağacından', () => {
    expect(mutationText('mutation.action.retry')).toBe('Yeniden gönder')
    expect(confirmText('confirm.impact.result', { n: 3 })).toContain('3 görevdeki')
  })
})
