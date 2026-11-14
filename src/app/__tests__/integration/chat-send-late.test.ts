// W164 · CX-F7-Ö-01 (KESİN 26): gönderimin geç sonucu yalnız KENDİ taslak anahtarının kendi sürümünü
// temizler; başka sohbetin taslağı (çipler: `composer/settle-sent.test.ts`) ve gönderim sürerken yazılan metin korunur.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  boot,
  chatOf,
  GROUP,
  hold,
  idle,
  MEMBER,
  messageEls,
  pressEnter,
  resetChats,
  teardown,
  typeText,
  until,
  useChatBackend,
  watchStreams,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
  await until(() => messageEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetChats()
  watchStreams()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

const field = () => $('[data-chat-composer-input]') as HTMLTextAreaElement | null
const sentBodies = (chatId: string, body: string) =>
  chatOf(chatId).messages.filter((m) => m.base.body === body)

describe('geç gönderim sonucu (CX-F7-Ö-01)', () => {
  it('A gönderimi sürerken B’ye geçilip taslak yazılır: A’da tek mesaj, B taslağı korunur', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const gate = hold('POST', new RegExp(`/v1/chats/${GROUP}/messages$`))
    await typeText('A gönderimi')
    await pressEnter()
    await gate.arrived
    await app.router.push('/mesajlar/dm1')
    await until(() => field() && messageEls().length > 0, 'B sohbeti')
    expect(field()!.disabled).toBe(false)
    await typeText('B taslağı')
    gate.release()
    await idle(app.queryClient)
    await until(() => sentBodies(GROUP, 'A gönderimi').length === 1, 'A mesajı')
    expect(sentBodies(GROUP, 'A gönderimi')).toHaveLength(1)
    expect(field()!.value).toBe('B taslağı')
    expect(sentBodies('dm1', 'B taslağı')).toHaveLength(0)
  })

  it('gönderim sürerken aynı alanda değiştirilen metin başarıyla silinmez', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const gate = hold('POST', new RegExp(`/v1/chats/${GROUP}/messages$`))
    await typeText('ilk metin')
    await pressEnter()
    await gate.arrived
    await typeText('ilk metin ve devamı')
    gate.release()
    await idle(app.queryClient)
    await until(() => sentBodies(GROUP, 'ilk metin').length === 1, 'gönderildi')
    expect(field()!.value).toBe('ilk metin ve devamı')
  })
})
