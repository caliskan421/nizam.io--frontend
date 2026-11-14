// CX-F7-Ö-01 / Ö-04: gönderim sonucu yalnız gönderilen anahtarın GÖNDERİLEN sürümünü (nesil) temizler.
import { afterEach, describe, expect, it } from 'vitest'

import { chatDrafts, chipsOf, resetDrafts, settleSent } from './drafts'

afterEach(() => resetDrafts())

const chip = { token: '@Cem', mention: { kind: 'account', target_id: 'a2' } } as never

describe('settleSent', () => {
  it('gönderilen sürüm aynıysa taslak ve çipler temizlenir', () => {
    chatDrafts.setBody('k1', 'merhaba')
    chipsOf('k1').mentions.push(chip)
    settleSent('k1', chatDrafts.version('k1'))
    expect(chatDrafts.get('k1')).toBeNull()
    expect(chipsOf('k1').mentions).toHaveLength(0)
  })

  it('başka anahtarın taslağı ve çipleri korunur', () => {
    chatDrafts.setBody('k1', 'A')
    chatDrafts.setBody('k2', 'B taslağı')
    chipsOf('k2').mentions.push(chip)
    settleSent('k1', chatDrafts.version('k1'))
    expect(chatDrafts.get('k2')?.body).toBe('B taslağı')
    expect(chipsOf('k2').mentions).toHaveLength(1)
  })

  it('gönderim sürerken değişen metin ve çipleri korunur', () => {
    chatDrafts.setBody('k1', 'ilk')
    chipsOf('k1').mentions.push(chip)
    const sent = chatDrafts.version('k1')
    chatDrafts.setBody('k1', 'ilk ve devamı')
    settleSent('k1', sent)
    expect(chatDrafts.get('k1')?.body).toBe('ilk ve devamı')
    expect(chipsOf('k1').mentions).toHaveLength(1)
  })

  it('metin değiştirilip eski hâline dönse de yeni sürümdür: temizlenmez', () => {
    chatDrafts.setBody('k1', 'ilk')
    const sent = chatDrafts.version('k1')
    chatDrafts.setBody('k1', 'ilk+')
    chatDrafts.setBody('k1', 'ilk')
    settleSent('k1', sent)
    expect(chatDrafts.get('k1')?.body).toBe('ilk')
  })

  it('gövde aynı kalıp yanıt bağlamı değişirse korunur; sürümsüz eski gövde eşitliği yetmez', () => {
    chatDrafts.setBody('k1', 'aynı')
    const sent = chatDrafts.version('k1')
    chatDrafts.setReplyTo('k1', 'm9')
    settleSent('k1', sent)
    expect(chatDrafts.get('k1')?.replyTo).toBe('m9')
  })

  it('düzenleme sürümü: başlat / metin / bitir her seferinde artar', () => {
    chatDrafts.startEdit('k1', { messageId: 'm1', body: 'a', expectedRevision: 1 })
    const first = chatDrafts.editVersion('k1')
    chatDrafts.endEdit('k1')
    chatDrafts.startEdit('k1', { messageId: 'm2', body: 'a', expectedRevision: 1 })
    expect(chatDrafts.editVersion('k1')).toBeGreaterThan(first)
    const second = chatDrafts.editVersion('k1')
    chatDrafts.setEditBody('k1', 'b')
    expect(chatDrafts.editVersion('k1')).toBeGreaterThan(second)
  })
})
