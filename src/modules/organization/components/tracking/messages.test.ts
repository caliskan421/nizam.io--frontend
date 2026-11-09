import { describe, expect, it } from 'vitest'

import { trackingText, trOrganization, type TrackingTextKey } from './messages'

function leaves(node: unknown, path: string): [string, string][] {
  if (typeof node === 'string') return [[path, node]]
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    leaves(v, path ? `${path}.${k}` : k),
  )
}

describe('05b metinleri (organization.tracking.*)', () => {
  it('yer tutucular doldurulur', () => {
    expect(trackingText('tracking.table.overdue', { n: 3 })).toBe('3 gün gecikti')
    expect(trackingText('tracking.documentTitle', { name: 'Ada' })).toBe('RoketPortal — Ada')
    expect(trackingText('tracking.cards.completionValue', { p: 25 })).toBe('%25')
    expect(trackingText('tracking.cards.overdueNote', { q: 44, suffix: '’ü' })).toBe(
      'Açık görevlerin %44’ü',
    )
  })

  it('her yaprak i18n ağacında çözülür ve dolu', () => {
    const all = leaves(trOrganization.organization.tracking, 'tracking')
    expect(all.length).toBeGreaterThan(80)
    for (const [key, text] of all) {
      expect(text.trim(), key).not.toBe('')
      if (!text.includes('{')) expect(trackingText(key as TrackingTextKey)).toBe(text)
    }
  })
})
