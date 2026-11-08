import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { topbarText, trTopbar, type TopbarTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('üst çubuk metinleri', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trTopbar) as TopbarTextKey[]) {
      const text = topbarText(key, { n: 3 })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('zil erişim adı sayıyı içerir (ozellikler §4)', () => {
    expect(topbarText('topbar.bellUnread', { n: 2 })).toBe('Bildirimler, 2 okunmamış')
    expect(topbarText('topbar.theme')).toBe('Temayı değiştir')
  })
})
