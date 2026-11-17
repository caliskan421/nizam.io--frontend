import { describe, expect, it } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import { buildEntries } from './grouping'

const at = (seq: number, iso: string, sender = 'u2') =>
  msg(seq, { created_at: iso, sender_account_id: sender })

describe('buildEntries', () => {
  it('gün ayırıcı + ardışık gruplama (aynı gönderen ve ≤5 dk)', () => {
    const items = [
      at(1, '2026-11-13T08:00:00Z'),
      at(2, '2026-11-13T08:03:00Z'),
      at(3, '2026-11-13T08:10:00Z'),
      at(4, '2026-11-13T08:11:00Z', 'u3'),
      at(5, '2026-11-14T08:00:00Z', 'u3'),
    ]
    const out = buildEntries(items, { meId: 'me', unreadAnchor: null, unreadCount: 0 })
    expect(out.map((e) => e.type)).toEqual([
      'day',
      'message',
      'message',
      'message',
      'message',
      'day',
      'message',
    ])
    const flags = out.flatMap((e) => (e.type === 'message' ? [[e.first, e.last]] : []))
    expect(flags).toEqual([
      [true, false],
      [false, true],
      [true, true],
      [true, true],
      [true, true],
    ])
  })

  it('giden mesaj `mine`; okunmamış ayırıcı grubu böler', () => {
    const items = [
      at(1, '2026-11-14T08:00:00Z'),
      at(2, '2026-11-14T08:01:00Z'),
      at(3, '2026-11-14T08:02:00Z', 'me'),
    ]
    const out = buildEntries(items, { meId: 'me', unreadAnchor: 2, unreadCount: 2 })
    expect(out.map((e) => e.type)).toEqual(['day', 'message', 'unread', 'message', 'message'])
    const msgs = out.filter((e) => e.type === 'message')
    expect(msgs.map((e) => e.type === 'message' && e.mine)).toEqual([false, false, true])
    expect(msgs[0]!.type === 'message' && msgs[0]!.last).toBe(true)
    expect(msgs[1]!.type === 'message' && msgs[1]!.first).toBe(true)
  })

  it('sayı sıfırsa ayırıcı çizilmez', () => {
    const out = buildEntries([at(1, '2026-11-14T08:00:00Z')], {
      meId: null,
      unreadAnchor: 1,
      unreadCount: 0,
    })
    expect(out.some((e) => e.type === 'unread')).toBe(false)
  })
})
