// İskelet sözleşmesi (KESİN 22): gövdeden BAĞIMSIZ — derlenmiş props/emits bildirimlerini denetler,
// bileşeni bağlamaz, gövdede metin ya da `data-placeholder` beklemez. Gövde (O2b) dolunca bu test
// kırılmaz: yalnız prop/emit adı değişirse kırılır ("gövde dolunca kırılır mı?" → HAYIR).
import { describe, expect, it } from 'vitest'

import ChatDialogs from './ChatDialogs.vue'
import ChatListPane from './ChatListPane.vue'
import Composer from './Composer.vue'
import ConversationPane from './ConversationPane.vue'

const emitsOf = (c: unknown) =>
  [...(((c as { emits?: unknown }).emits as string[] | undefined) ?? [])].sort()
const propsOf = (c: unknown) =>
  Object.keys(((c as { props?: unknown }).props as object | undefined) ?? {}).sort()

describe('chat bileşen sözleşmeleri', () => {
  it('ChatListPane: selectedId; select(id), create(kind)', () => {
    expect(propsOf(ChatListPane)).toEqual(['selectedId'])
    expect(emitsOf(ChatListPane)).toEqual(['create', 'select'])
  })
  it('ConversationPane: chatId', () => {
    expect(propsOf(ConversationPane)).toEqual(['chatId'])
    expect(emitsOf(ConversationPane)).toEqual([])
  })
  it('Composer: chatId, replyTo?; sent', () => {
    expect(propsOf(Composer)).toEqual(['chatId', 'replyTo'])
    expect(emitsOf(Composer)).toEqual(['sent'])
  })
  it('ChatDialogs: request; close', () => {
    expect(propsOf(ChatDialogs)).toEqual(['request'])
    expect(emitsOf(ChatDialogs)).toEqual(['close'])
  })
})
