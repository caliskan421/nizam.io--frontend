import { describe, expect, it } from 'vitest'

import { buildSendBody } from './send-body'

const chips = {
  mentions: [
    { token: '@Ayşe Yılmaz', mention: { kind: 'account', target_id: 'a1' } },
    { token: '@herkes', mention: { kind: 'all' } },
    { token: '@Elektrik', mention: { kind: 'department', target_id: 'd1' } },
  ],
  refs: [
    { token: '#Trafo projesi', kind: 'task', targetId: 't1' },
    { token: '#Saha montajı', kind: 'task', targetId: 't2' },
  ],
} as const

describe('buildSendBody', () => {
  it('yalnız gövdede hâlâ geçen çipler gider; kimlik ve yanıt eklenir', () => {
    const body = buildSendBody({
      body: ' @Ayşe Yılmaz #Trafo projesi bakar mısın ',
      clientMessageId: 'cm-1',
      replyTo: 'm9',
      chips: { mentions: [...chips.mentions], refs: [...chips.refs] },
      allowAll: true,
    })
    expect(body).toEqual({
      body: '@Ayşe Yılmaz #Trafo projesi bakar mısın',
      client_message_id: 'cm-1',
      mentions: [{ kind: 'account', target_id: 'a1' }],
      refs: [{ kind: 'task', target_id: 't1' }],
      reply_to_message_id: 'm9',
    })
  })
  it('@herkes yalnız yetkiliye gider; boş liste alanı eklemez', () => {
    const input = {
      body: '@herkes toplantı',
      clientMessageId: 'cm-2',
      replyTo: null,
      chips: { mentions: [...chips.mentions], refs: [] },
    }
    expect(buildSendBody({ ...input, allowAll: true }).mentions).toEqual([{ kind: 'all' }])
    const plain = buildSendBody({ ...input, allowAll: false })
    expect(plain).toEqual({ body: '@herkes toplantı', client_message_id: 'cm-2' })
  })
  it('aynı hedef iki kez gitmez', () => {
    const dup = { token: '@Ayşe Yılmaz', mention: { kind: 'account', target_id: 'a1' } } as const
    const body = buildSendBody({
      body: '@Ayşe Yılmaz @Ayşe Yılmaz',
      clientMessageId: 'cm-3',
      replyTo: null,
      chips: { mentions: [dup, dup], refs: [] },
      allowAll: false,
    })
    expect(body.mentions).toHaveLength(1)
  })
})
