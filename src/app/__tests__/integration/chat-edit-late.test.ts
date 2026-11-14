// W165 · CX-F7-Ö-04 (KESİN 26): eylemin geç sonucu yalnız KENDİ taslak SÜRÜMÜNÜ temizler. Düzenleme
// kaydı beklerken vazgeçip başka mesajı düzenlemek, gönderim beklerken yanıt bağlamını değiştirmek ve
// metni değiştirip eski hâline döndürmek yeni taslağı eski başarıyla silmez. Yanıtlar bariyerde tutulur.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  boot,
  GROUP,
  hold,
  idle,
  MEMBER,
  menuItem,
  messageEls,
  pressEnter,
  resetChats,
  rowOf,
  sent,
  teardown,
  tool,
  typeText,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  WHO,
  chatOf,
} from './chat-support'
import { addMessage } from './fake-chat'

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
afterEach(() => teardown())
afterAll(() => backend.server.close())

const field = () => $('[data-chat-composer-input]') as HTMLTextAreaElement
const band = () => $('[data-testid="chat-composer-band"]')

/** İki kendi mesajım: sıra numaraları döner. */
function ownMessages(): [number, number] {
  const group = chatOf(GROUP)
  addMessage(group, WHO.member, 'Benim A')
  addMessage(group, WHO.member, 'Benim B')
  return [group.last_seq - 1, group.last_seq]
}

async function startEdit(seq: number, text: string): Promise<void> {
  await userClick(() => tool(rowOf(seq)!, 'Diğer'))
  await userClick(() => menuItem('Düzenle'))
  await until(() => field().value === text, `düzenleme alanı ${text}`)
}

describe('geç düzenleme / gönderim sonucu (CX-F7-Ö-04)', () => {
  it('düzenleme kaydı beklerken vazgeç + başka mesajı düzenle: ilk kaydın başarısı yeni kipi silmez', async () => {
    const [a, b] = ownMessages()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(b), 'kendi mesajlarım')
    await idle(app.queryClient)
    await startEdit(a, 'Benim A')
    const gate = hold('PATCH', new RegExp(`/v1/chats/${GROUP}/messages/${GROUP}-m${a}$`))
    await typeText('A düzeltildi')
    await pressEnter()
    await gate.arrived
    await userClick(() => band()!.querySelector<HTMLElement>('button'))
    expect(band()).toBeNull()
    await startEdit(b, 'Benim B')
    await typeText('B yeni metin')
    gate.release()
    await idle(app.queryClient)
    await until(() => sent('PATCH', `/v1/chats/${GROUP}/messages/${GROUP}-m${a}`).length === 1, 'A')
    await until(() => rowOf(a)?.textContent?.includes('A düzeltildi'), 'A güncellendi')
    expect(field().value).toBe('B yeni metin')
    expect(band()).not.toBeNull()
    expect(sent('PATCH', `/v1/chats/${GROUP}/messages/${GROUP}-m${b}`)).toHaveLength(0)
  })

  it('gönderim beklerken gövde aynı kalıp Yanıtla hedefi değişir: yeni yanıt bağlamı korunur', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const gate = hold('POST', new RegExp(`/v1/chats/${GROUP}/messages$`))
    await typeText('taslak')
    await pressEnter()
    await gate.arrived
    await userClick(() => tool(rowOf(59)!, 'Diğer'))
    await userClick(() => menuItem('Yanıtla'))
    await until(() => band(), 'yanıt şeridi')
    gate.release()
    await idle(app.queryClient)
    await until(() => chatOf(GROUP).messages.some((m) => m.base.body === 'taslak'), 'gönderildi')
    await idle(app.queryClient)
    expect(band()).not.toBeNull()
    expect(field().value).toBe('taslak')
  })

  it('gövde değiştirilip eski metne döndürülür: yeni sürüm temizlenmez', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const gate = hold('POST', new RegExp(`/v1/chats/${GROUP}/messages$`))
    await typeText('ilk')
    await pressEnter()
    await gate.arrived
    await typeText('ilk ve fazlası')
    await typeText('ilk')
    gate.release()
    await idle(app.queryClient)
    await until(() => chatOf(GROUP).messages.some((m) => m.base.body === 'ilk'), 'gönderildi')
    await idle(app.queryClient)
    expect(field().value).toBe('ilk')
  })
})
