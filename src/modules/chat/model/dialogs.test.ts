import { describe, expect, it } from 'vitest'

import { CHAT_DIALOGS, type DialogRequest } from './dialogs'

describe('10c pencereleri', () => {
  it('yedi pencere; "Mesajı ilet" BE-080 ile açılabilir (W185b), kaynak mesaj olgusuyla', () => {
    expect(CHAT_DIALOGS).toEqual([
      'groupInfo',
      'messageInfo',
      'newGroup',
      'forward',
      'taskFromMessage',
      'poll',
      'shareFile',
    ])
    const request: DialogRequest = { dialog: 'forward', chatId: 'c1', messageId: 'm1' }
    expect(request.dialog).toBe('forward')
  })
})
