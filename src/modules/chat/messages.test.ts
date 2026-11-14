import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { chatText, trChat, type ChatTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('sohbet metinleri (tek ağaç trChat)', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trChat) as ChatTextKey[]) {
      const text = chatText(key, { name: 'Ayşe', n: 3, i: 1, time: '10:30' })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toBe(key)
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('alt dallar O2b işçilerine ayrılmış: list/thread/composer/dialogs/states', () => {
    expect(Object.keys(trChat.chat)).toEqual(['list', 'thread', 'composer', 'dialogs', 'states'])
  })

  it('sözleşmeden gelen metinler birebir (istemci-akislari §10.6)', () => {
    expect(chatText('chat.composer.peerLeft')).toBe(
      'Bu kişi artık programda değil; mesaj gönderilemez.',
    )
    expect(chatText('chat.dialogs.cannotDirect')).toBe(
      'Bu kişiyle doğrudan yazışamazsınız: birebir sohbet yalnız koordinatörlük zinciri içinde açılır. Ortak bir grupta yazışabilirsiniz.',
    )
    expect(chatText('chat.dialogs.truncated')).toBe('Liste ilk 200 kişiyle sınırlı')
  })

  it('yer tutucular ve tepki simgeleri (dört tür)', () => {
    expect(chatText('chat.thread.typing', { name: 'Ayşe' })).toBe('Ayşe yazıyor…')
    expect(chatText('chat.thread.pinned', { i: 1, n: 3 })).toBe('Sabitlenen mesaj 1/3')
    expect(Object.keys(trChat.chat.thread.reaction)).toEqual(['like', 'heart', 'check', 'star'])
  })

  it('tasarımdaki sözleşme dışı özellikler için metin yok (iletme, sessize alma, anonim, Koordinatörler grubu)', () => {
    const all = leaves(trChat).join(' ')
    expect(all).not.toMatch(/sessize|anonim|Koordinatörler/i)
  })
})
