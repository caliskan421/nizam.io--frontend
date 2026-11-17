import { describe, expect, it } from 'vitest'

import type { CoalescedEvent } from '@/shared/sse'

import { planFor, type PlanContext } from './events'

const event = (name: string, over: Partial<CoalescedEvent> = {}): CoalescedEvent => ({
  name,
  chatId: 'c1',
  messageIds: [],
  actorAccountIds: ['u2'],
  affectedAccountIds: [],
  count: 1,
  ...over,
})

const ctx = (over: Partial<PlanContext> = {}): PlanContext => ({
  openChatId: 'c1',
  meAccountId: 'me',
  hasLocal: () => true,
  ...over,
})

describe('SSE olay planı (içeriksiz; içerik HTTP’den)', () => {
  it('message.created: açık sohbette after okuması; liste + rozet + paylaşılanlar', () => {
    const plan = planFor(event('message.created'), ctx())
    expect(plan).toMatchObject({
      open: true,
      readNewer: true,
      invalidateList: true,
      invalidateOverview: true,
      invalidateRefs: true,
    })
    const other = planFor(event('message.created'), ctx({ openChatId: 'c2' }))
    expect(other).toMatchObject({ open: false, readNewer: false, invalidateList: true })
  })

  it('message.updated: yalnız yerelde olan mesajlar around ile okunur; yoksa okuma yok', () => {
    const e = event('message.updated', { messageIds: ['a', 'b'] })
    expect(planFor(e, ctx({ hasLocal: (id) => id === 'a' })).refreshMessageIds).toEqual(['a'])
    expect(planFor(e, ctx({ hasLocal: () => false })).refreshMessageIds).toEqual([])
    expect(planFor(e, ctx({ openChatId: 'c2' })).refreshMessageIds).toEqual([])
    expect(planFor(e, ctx())).toMatchObject({ invalidatePins: true, readNewer: false })
  })

  it('message.deleted: yerel kayıt kimlikle kaldırılır (okuma yok); liste, rozet, sabit, ref', () => {
    const plan = planFor(
      event('message.deleted', { messageIds: ['x'] }),
      ctx({ hasLocal: () => false }),
    )
    expect(plan.removeMessageIds).toEqual(['x'])
    expect(plan).toMatchObject({
      readNewer: false,
      refreshMessageIds: [],
      invalidateList: true,
      invalidateOverview: true,
      invalidatePins: true,
      invalidateRefs: true,
    })
    // Açık olmayan sohbette de yerel pencere (önbellekteyse) temizlenir.
    expect(
      planFor(event('message.deleted', { messageIds: ['x'] }), ctx({ openChatId: null }))
        .removeMessageIds,
    ).toEqual(['x'])
  })

  it('read.updated: açık birebirde tik; liste + rozet', () => {
    expect(planFor(event('read.updated'), ctx())).toMatchObject({
      refreshPeerRead: true,
      invalidateList: true,
      invalidateOverview: true,
    })
    expect(planFor(event('read.updated'), ctx({ openChatId: null })).refreshPeerRead).toBe(false)
  })

  it('W184: paylaşılan sayı/görev kartı/okundu bilgisi bayrakları olaya göre (BE-084/085/028)', () => {
    const flags = (name: Parameters<typeof event>[0]) => {
      const p = planFor(event(name), ctx())
      return [p.invalidateShared, p.invalidateMessageTasks, p.invalidateReceipts]
    }
    expect(flags('message.created')).toEqual([true, false, false])
    expect(flags('message.updated')).toEqual([false, true, false])
    expect(flags('message.deleted')).toEqual([true, true, true])
    expect(flags('read.updated')).toEqual([false, false, true])
    expect(flags('member.changed')).toEqual([false, false, true])
    expect(flags('chat.changed')).toEqual([false, false, false])
    // Açık olmayan sohbette de önbellek geçersizlenir (sorgu başka yerden mount edilmiş olabilir).
    expect(planFor(event('message.created'), ctx({ openChatId: null })).invalidateShared).toBe(true)
  })

  it('member.changed / chat.changed: üyelik ve ayrıntı; kendi hesabım etkilendiyse erişim yeniden denetlenir', () => {
    const mine = event('member.changed', { affectedAccountIds: ['me', 'u3'] })
    expect(planFor(mine, ctx())).toMatchObject({
      invalidateMembers: true,
      invalidateDetail: true,
      invalidateList: true,
      invalidateCandidates: true,
      recheckAccess: true,
    })
    expect(
      planFor(event('member.changed', { affectedAccountIds: ['u3'] }), ctx()).recheckAccess,
    ).toBe(false)
    expect(planFor(mine, ctx({ openChatId: 'c9' })).recheckAccess).toBe(false)
    const chat = planFor(event('chat.changed', { affectedAccountIds: ['me'] }), ctx())
    expect(chat).toMatchObject({
      invalidateList: true,
      invalidateDetail: true,
      recheckAccess: true,
    })
    expect(chat.invalidateMembers).toBe(false)
  })

  it('typing ve bilinmeyen olay: hiçbir önbellek/okuma işi yok', () => {
    for (const name of ['typing', 'baska.olay']) {
      const plan = planFor(event(name), ctx())
      const work = Object.entries(plan).filter(
        ([k, v]) => k !== 'open' && (v === true || (Array.isArray(v) && v.length > 0)),
      )
      expect(work, name).toEqual([])
    }
  })
})
