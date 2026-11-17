import { describe, expect, it } from 'vitest'

import { msg } from '../__tests__/fixtures'
import * as unread from './unread'
import { readCursorMessage } from './unread'

describe('okundu imleci', () => {
  it('imleç pencerenin en yeni mesajıdır; boş pencerede null', () => {
    expect(readCursorMessage([msg(1), msg(2), msg(3)])?.seq).toBe(3)
    expect(readCursorMessage([])).toBeNull()
  })

  it("eski yol yok: `unread_count`'tan ayırıcı türeten işlev kalmadı (BE-082)", () => {
    expect(Object.keys(unread)).toEqual(['readCursorMessage'])
  })
})
