import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCoalescer, type CoalescedEvent, type StreamEvent } from './coalesce'

const ev = (name: string, chatId: string, messageId: string | null = null): StreamEvent => ({
  name,
  chatId,
  messageId,
  actorAccountId: 'a',
  affectedAccountIds: [],
})

describe('createCoalescer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('aynı sohbetin art arda olayları 1 sn sonra TEK toplu olay olur', () => {
    const out: CoalescedEvent[] = []
    const c = createCoalescer((e) => out.push(e))
    c.push(ev('message.created', 'c1', 'm1'))
    vi.advanceTimersByTime(600)
    c.push(ev('message.created', 'c1', 'm2'))
    c.push(ev('message.created', 'c1', 'm2'))
    expect(out).toHaveLength(0)
    vi.advanceTimersByTime(400)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ chatId: 'c1', messageIds: ['m1', 'm2'], count: 3 })
  })

  it('farklı sohbet ya da olay adı ayrı gruptur; pencere uzamaz', () => {
    const out: CoalescedEvent[] = []
    const c = createCoalescer((e) => out.push(e))
    c.push(ev('message.created', 'c1'))
    c.push(ev('message.created', 'c2'))
    c.push(ev('read.updated', 'c1'))
    expect(c.pending).toBe(3)
    vi.advanceTimersByTime(1000)
    expect(out.map((e) => `${e.name}:${e.chatId}`).sort()).toEqual([
      'message.created:c1',
      'message.created:c2',
      'read.updated:c1',
    ])
  })

  it('clear bekleyenleri teslim etmeden atar', () => {
    const out: CoalescedEvent[] = []
    const c = createCoalescer((e) => out.push(e))
    c.push(ev('chat.changed', 'c1'))
    c.clear()
    vi.advanceTimersByTime(5000)
    expect(out).toEqual([])
    expect(c.pending).toBe(0)
  })
})
