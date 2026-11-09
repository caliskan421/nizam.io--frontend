import { describe, expect, it } from 'vitest'

import { trackingText, trUserTracking } from './messages'

function leaves(node: unknown, path: string): [string, string][] {
  if (typeof node === 'string') return [[path, node]]
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    leaves(v, path ? `${path}.${k}` : k),
  )
}

describe('05b metinleri', () => {
  it('yer tutucular doldurulur; eksik parametre olduğu gibi kalır', () => {
    expect(trackingText('userTracking.table.overdue', { n: 3 })).toBe('3 gün gecikti')
    expect(trackingText('userTracking.toolbar.caption', { list: 'Açık görevler' })).toBe(
      'Açık görevler · {n} görev',
    )
    expect(trackingText('userTracking.documentTitle', { name: 'Ada' })).toBe('RoketPortal — Ada')
  })

  it('her yaprak dolu; sunucu metni ya da sahte veri içermez', () => {
    const all = leaves(trUserTracking, '')
    expect(all.length).toBeGreaterThan(80)
    for (const [key, text] of all) {
      expect(text.trim(), key).not.toBe('')
      expect(trackingText(key as Parameters<typeof trackingText>[0])).toBe(text)
    }
  })

  it('olmayan anahtar anahtarın kendisini döndürür', () => {
    expect(trackingText('userTracking.yok' as Parameters<typeof trackingText>[0])).toBe(
      'userTracking.yok',
    )
  })
})
