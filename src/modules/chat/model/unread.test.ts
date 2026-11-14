import { describe, expect, it } from 'vitest'

import { msg } from '../__tests__/fixtures'
import { readCursorMessage, unreadDivider } from './unread'

const mine = (seq: number) => msg(seq, { sender_account_id: 'me' })
const theirs = (seq: number) => msg(seq, { sender_account_id: 'u2' })

describe('okunmamış ayırıcısı (yaklaşık kural, BE-082)', () => {
  it('sondan geriye BAŞKASININ son n mesajı sayılır; kendi mesajlarım atlanır', () => {
    const items = [theirs(1), theirs(2), mine(3), theirs(4), mine(5), theirs(6)]
    expect(unreadDivider(items, 'me', 3)).toEqual({
      kind: 'at',
      messageId: 'm2',
      seq: 2,
      count: 3,
    })
    expect(unreadDivider(items, 'me', 1)).toMatchObject({ kind: 'at', seq: 6 })
  })

  it('n pencereyi aşıyorsa daha eski sayfa gerekir; eksik sayı bildirilir', () => {
    const items = [theirs(5), mine(6), theirs(7)]
    expect(unreadDivider(items, 'me', 5)).toEqual({ kind: 'needsOlder', missing: 3 })
  })

  it('okunmamış yok / negatif → ayırıcı yok', () => {
    expect(unreadDivider([theirs(1)], 'me', 0)).toEqual({ kind: 'none' })
    expect(unreadDivider([theirs(1)], 'me', -2)).toEqual({ kind: 'none' })
    expect(unreadDivider([], 'me', 2)).toEqual({ kind: 'needsOlder', missing: 2 })
  })

  it('okundu imleci pencerenin en yeni mesajına ilerler', () => {
    expect(readCursorMessage([theirs(1), mine(2)])?.message_id).toBe('m2')
    expect(readCursorMessage([])).toBeNull()
  })
})
