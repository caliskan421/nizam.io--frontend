import { describe, expect, it } from 'vitest'

import { notificationCapabilities } from './capabilities'

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
})
