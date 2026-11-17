import { describe, expect, it } from 'vitest'

import { makeChatHistory } from '@/shared/api/__tests__/defaults'

import { msg } from '../__tests__/fixtures'
import { refreshReadState } from './read-state'
import type { ChatMessage } from './types'
import { windowFromLatest, type MessageWindow } from './window'
import type { WindowStore } from './window-io'

function store(win: MessageWindow): WindowStore & { now: () => MessageWindow } {
  let current = win
  return {
    get: () => current,
    set: (update) => void (current = update(current)),
    now: () => current,
  }
}

describe('refreshReadState', () => {
  it('grup: yalnız read_by_all (true/false/null) ve peer_read_seq güncellenir; gövde yerelde kalır', async () => {
    const local = [
      msg(1, { body: 'yerel', read_by_all: false }),
      msg(2, { read_by_all: false }),
      msg(3, { read_by_all: false }),
    ]
    const s = store(windowFromLatest(local, null))
    const fresh: ChatMessage[] = [
      msg(1, { body: 'sunucu', read_by_all: true }),
      msg(2, { read_by_all: null }),
      msg(3, { read_by_all: false }),
    ]
    const queries: unknown[] = []
    await refreshReadState((q) => {
      queries.push(q)
      return Promise.resolve(makeChatHistory({ items: fresh, peer_read_seq: null }))
    }, s)
    expect(queries).toEqual([{ around: 3 }])
    const items = s.now().items
    expect(items.map((m) => m.read_by_all)).toEqual([true, null, false])
    expect(items[0]!.body).toBe('yerel')
  })

  it('birebir: peer_read_seq güncellenir; read_by_all alanı yoksa yereli bozmaz', async () => {
    const s = store(windowFromLatest([msg(1), msg(2)], null))
    await refreshReadState(
      () => Promise.resolve(makeChatHistory({ items: [msg(1), msg(2)], peer_read_seq: 2 })),
      s,
    )
    expect(s.now().peerReadSeq).toBe(2)
    expect('read_by_all' in s.now().items[0]!).toBe(false)
  })

  it('pencere boşsa imleçsiz okur', async () => {
    const s = store(windowFromLatest([], null))
    const queries: unknown[] = []
    await refreshReadState((q) => {
      queries.push(q)
      return Promise.resolve(makeChatHistory({ items: [], peer_read_seq: null }))
    }, s)
    expect(queries).toEqual([{}])
  })
})
