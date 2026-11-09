import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { homeText, trHome, type HomeTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('ana sayfa metinleri', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trHome) as HomeTextKey[]) {
      const text = homeText(key, { name: 'A', p: 1, total: 2, done: 1, suffix: '’i', n: 3, q: 4 })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('yer tutucular doldurulur', () => {
    expect(homeText('home.greeting', { name: 'Ayşe Yılmaz' })).toBe('Merhaba Ayşe Yılmaz')
    expect(homeText('home.kpi.completionValue', { p: 49 })).toBe('%49')
    expect(homeText('home.kpi.completionNote', { total: 79, done: 39, suffix: '’u' })).toBe(
      '79 görevin 39’u bitti',
    )
    expect(homeText('home.kpi.overdueNote', { q: 38, suffix: '’i' })).toBe('Açık görevlerin %38’i')
  })
})
