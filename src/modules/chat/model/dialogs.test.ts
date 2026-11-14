import { describe, expect, it } from 'vitest'

import { CHAT_DIALOGS, isOpenable } from './dialogs'
import { CHAT_STUBS } from './stubs'

describe('10c pencereleri', () => {
  it('yedi pencere; "Mesajı ilet" açılamaz (BE-080)', () => {
    expect(CHAT_DIALOGS).toEqual([
      'groupInfo',
      'messageInfo',
      'newGroup',
      'forward',
      'taskFromMessage',
      'poll',
      'shareFile',
    ])
    expect(CHAT_DIALOGS.filter((d) => !isOpenable(d))).toEqual(['forward'])
    expect(CHAT_STUBS.forward).toEqual({ enabled: false })
  })

  it('kayıtlı eksikler sahte veri taşımaz (yalnız var/yok olguları)', () => {
    for (const value of Object.values(CHAT_STUBS)) {
      expect(Object.values(value).every((v) => typeof v === 'boolean')).toBe(true)
    }
  })
})
