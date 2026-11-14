// CX-F7-Ö-01: gönderim sonucu yalnız gönderilen anahtarın GÖNDERİLEN sürümünü temizler.
import { afterEach, describe, expect, it } from 'vitest'

import { chatDrafts, chipsOf, resetDrafts, settleSent } from './drafts'

afterEach(() => resetDrafts())

const chip = { token: '@Cem', mention: { kind: 'account', target_id: 'a2' } } as never

describe('settleSent', () => {
  it('gönderilen sürüm aynıysa taslak ve çipler temizlenir', () => {
    chatDrafts.setBody('k1', 'merhaba')
    chipsOf('k1').mentions.push(chip)
    settleSent('k1', 'merhaba')
    expect(chatDrafts.get('k1')).toBeNull()
    expect(chipsOf('k1').mentions).toHaveLength(0)
  })

  it('başka anahtarın taslağı ve çipleri korunur', () => {
    chatDrafts.setBody('k1', 'A')
    chatDrafts.setBody('k2', 'B taslağı')
    chipsOf('k2').mentions.push(chip)
    settleSent('k1', 'A')
    expect(chatDrafts.get('k2')?.body).toBe('B taslağı')
    expect(chipsOf('k2').mentions).toHaveLength(1)
  })

  it('gönderim sürerken değişen metin ve çipleri korunur', () => {
    chatDrafts.setBody('k1', 'ilk')
    chipsOf('k1').mentions.push(chip)
    chatDrafts.setBody('k1', 'ilk ve devamı')
    settleSent('k1', 'ilk')
    expect(chatDrafts.get('k1')?.body).toBe('ilk ve devamı')
    expect(chipsOf('k1').mentions).toHaveLength(1)
  })
})
