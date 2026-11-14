import { describe, expect, it } from 'vitest'

import { notificationCapabilities } from './capabilities'
import { AWAITING_TAB, INLINE_DECISION } from './stubs'

describe('bildirim yetkileri', () => {
  it('rol/mercek girdisi yok: üç rolde aynı (mercek ≠ yetki)', () => {
    expect(notificationCapabilities.length).toBe(0)
    expect(notificationCapabilities()).toEqual({
      panel: true,
      markRead: true,
      markAllRead: true,
      pushOptIn: true,
    })
  })
  it('BE kaynaklı eksikler devre dışı (BE-144, BE-146)', () => {
    expect(AWAITING_TAB).toEqual({ enabled: false })
    expect(INLINE_DECISION).toEqual({ enabled: false })
  })
})
