// W164 · CX-F7-Ö-02: önbellekli sohbete dönüşte (A→B→A, Mesajlar→Görevler→Mesajlar) pencere
// `staleTime: Infinity` yüzünden kendiliğinden okunmaz; akış aboneliği hazır olunca TEK uzlaştırma
// kaçan yeni mesaj/düzenleme/silmeyi getirir. Gerçek süre yok: sahte saat.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  advance,
  boot,
  chatOf,
  fakeClock,
  GROUP,
  idle,
  MEMBER,
  messageEls,
  resetChats,
  sent,
  streamOpen,
  teardown,
  until,
  useChatBackend,
  watchStreams,
  WHO,
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
  watchStreams()
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

const texts = () => messageEls().map((el) => el.querySelector('.chat-bub')?.textContent ?? '')
const afterReads = () =>
  sent('GET', `/v1/chats/${GROUP}/messages`).filter((r) => r.query.has('after')).length

/** Sohbet uzaktayken sunucuda: yeni mesaj + düzenleme + silme (akış olayı kaçtı). */
async function changeWhileAway(): Promise<void> {
  const { addMessage } = await import('./fake-chat')
  const group = chatOf(GROUP)
  addMessage(group, WHO.second, 'Uzaktayken gelen')
  const edited = group.messages.find((m) => m.base.seq === 58)!
  Object.assign(edited.base, {
    body: 'Mekanik mesaj 58 (düzeltildi)',
    edit_revision: 2,
    edited: true,
  })
  group.messages = group.messages.filter((m) => m.base.seq !== 57)
}

async function expectCaughtUp(app: Awaited<ReturnType<typeof boot>>): Promise<void> {
  await until(() => texts().some((t) => t.includes('Uzaktayken gelen')), 'yeni mesaj')
  await idle(app.queryClient)
  expect(texts().some((t) => t.includes('58 (düzeltildi)'))).toBe(true)
  expect(texts().some((t) => t.includes('Mekanik mesaj 57'))).toBe(false)
}

describe('önbellekli sohbete dönüş (CX-F7-Ö-02)', () => {
  it('A→B→A: kaçan mesaj/düzenleme/silme güncel; dönüşte tek uzlaştırma', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    await app.router.push('/mesajlar/dm1')
    await until(() => texts().some((t) => t.includes('Cem')), 'B sohbeti')
    await idle(app.queryClient)
    await changeWhileAway()
    const before = afterReads()
    await app.router.push(`/mesajlar/${GROUP}`)
    await expectCaughtUp(app)
    expect(afterReads()).toBe(before + 1)
    await advance(5000)
    await idle(app.queryClient)
    expect(afterReads()).toBe(before + 1)
  })

  it('Mesajlar→Görevler→Mesajlar: sayfa yeniden kurulur; akış hazır olunca tek uzlaştırma', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    await app.router.push('/gorevler')
    await until(() => !$('[data-testid="chat-page"]'), 'sayfa söküldü')
    await changeWhileAway()
    const before = afterReads()
    await app.router.push(`/mesajlar/${GROUP}`)
    await streamOpen()
    await expectCaughtUp(app)
    expect(afterReads()).toBe(before + 1)
  })
})
