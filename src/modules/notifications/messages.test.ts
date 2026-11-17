import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { notificationText, trNotifications, type NotificationTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('bildirim metinleri (tek ağaç trNotifications)', () => {
  it('her anahtar çözülür; vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trNotifications) as NotificationTextKey[]) {
      const text = notificationText(key, { n: 3 })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toBe(key)
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('alt dallar: bell, panel, mutes, rows, target, push', () => {
    expect(Object.keys(trNotifications.notifications)).toEqual([
      'bell',
      'panel',
      'mutes',
      'rows',
      'target',
      'push',
    ])
  })

  it('tasarım metinleri birebir', () => {
    expect(notificationText('notifications.panel.markAll')).toBe('Tümünü okundu say')
    expect(notificationText('notifications.bell.unread', { n: 4 })).toBe('Bildirimler, 4 okunmamış')
    expect(notificationText('notifications.push.title')).toBe(
      'Portal kapalıyken de haber verelim mi?',
    )
    expect(notificationText('notifications.target.workNotFound')).toBe(
      'Bu görev bu kapsamda bulunamadı',
    )
  })
})
