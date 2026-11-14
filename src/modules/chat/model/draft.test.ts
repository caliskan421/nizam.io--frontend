import { describe, expect, it } from 'vitest'

import { createDraftStore } from './draft'

function store() {
  let n = 0
  return createDraftStore(() => `id-${(n += 1)}`)
}

describe('sohbet taslağı (bellekte)', () => {
  it('sohbet başına ayrı; gönderim kimliği taslakla birlikte korunur, gövde değişince yenilenir', () => {
    const d = store()
    const first = d.setBody('c1', 'merhaba')
    const same = d.setBody('c1', 'merhaba')
    expect(same.clientMessageId).toBe(first.clientMessageId)
    const changed = d.setBody('c1', 'merhaba dünya')
    expect(changed.clientMessageId).not.toBe(first.clientMessageId)
    expect(d.get('c2')).toBeNull()
    expect(d.setBody('c2', 'x').clientMessageId).not.toBe(changed.clientMessageId)
  })

  it('yanıt bağlamı gövdeyi ve kimliği bozmaz; gövde değişince bağlam kalır', () => {
    const d = store()
    const base = d.setBody('c1', 'a')
    d.setReplyTo('c1', 'm5')
    expect(d.get('c1')).toMatchObject({
      body: 'a',
      replyTo: 'm5',
      clientMessageId: base.clientMessageId,
    })
    d.setBody('c1', 'ab')
    expect(d.get('c1')?.replyTo).toBe('m5')
    d.setReplyTo('c1', null)
    expect(d.get('c1')?.replyTo).toBeNull()
    d.setReplyTo('c9', 'm1')
    expect(d.get('c9')).toMatchObject({ body: '', replyTo: 'm1' })
  })

  it('düzenleme taslağı ayrıdır: bitince önceki taslak geri gelir', () => {
    const d = store()
    d.setBody('c1', 'yarım mesaj')
    d.startEdit('c1', { messageId: 'm1', body: 'eski', expectedRevision: 3 })
    d.setEditBody('c1', 'yeni')
    expect(d.getEdit('c1')).toEqual({ messageId: 'm1', body: 'yeni', expectedRevision: 3 })
    expect(d.get('c1')?.body).toBe('yarım mesaj')
    d.endEdit('c1')
    expect(d.getEdit('c1')).toBeNull()
    expect(d.get('c1')?.body).toBe('yarım mesaj')
    d.setEditBody('c1', 'yok sayılır')
    expect(d.getEdit('c1')).toBeNull()
  })

  it('clear ve clearAll (kapsam/oturum değişimi)', () => {
    const d = store()
    d.setBody('c1', 'a')
    d.setBody('c2', 'b')
    d.startEdit('c1', { messageId: 'm', body: 'x', expectedRevision: 1 })
    d.clear('c1')
    expect(d.get('c1')).toBeNull()
    expect(d.get('c2')).not.toBeNull()
    d.clearAll()
    expect(d.get('c2')).toBeNull()
    expect(d.getEdit('c1')).toBeNull()
  })
})
