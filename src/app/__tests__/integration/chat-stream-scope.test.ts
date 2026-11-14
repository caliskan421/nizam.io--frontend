// W164 · CX-F7-E-01: aynı programda birim/mercek değişince akış açık kalır ama olay uygulama bağlamı
// GÜNCEL kapsamdan üretilir (eski kapsam anahtarlarına yazılmaz). Gerçek süre yok: sahte saat.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  advance,
  boot,
  chatOf,
  fakeClock,
  GROUP,
  idle,
  ADMIN,
  messageEls,
  peerSays,
  resetChats,
  rowEls,
  sent,
  serverEmit,
  switchScope,
  streamOpen,
  teardown,
  toasts,
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
  await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
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

/** Aynı program: mercek (Rol) değişir; akış aynı kalır, sorgu anahtarları değişir (gerçek kabuk seçicisi). */
async function sameProgramScopeChange(app: Awaited<ReturnType<typeof boot>>): Promise<void> {
  await switchScope('Rol', 'Koordinatör')
  await until(() => app.scope.lens === 'coordinator', 'mercek')
}

describe('aynı programda kapsam değişimi (CX-F7-E-01)', () => {
  it('birim değişir → üyelikten çıkarılma: güncel anahtarla getChat 404, tek bildirim, listeye dönüş', async () => {
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    await sameProgramScopeChange(app)
    expect(app.scope.programId).toBe('p1')
    expect(app.scope.lens).toBe('coordinator')
    await idle(app.queryClient)
    await until(() => messageEls().length > 0, 'güncel kapsamda mesajlar')
    const group = chatOf(GROUP)
    group.members = group.members.filter((m) => m.account_id !== WHO.admin.account_id)
    serverEmit(GROUP, 'member.changed', {
      actor: WHO.second.account_id,
      affected: [WHO.admin.account_id],
    })
    await advance(1000)
    await until(() => app.router.currentRoute.value.path === '/mesajlar', 'listeye döndü')
    expect(toasts().split('Bu konuşma bulunamadı').length - 1).toBe(1)
    await idle(app.queryClient)
    expect($('[data-chat-id="' + GROUP + '"]')).toBeNull()
  })

  it('aynı geçişten sonra liste ve mesaj olayları güncel önbelleğe işler', async () => {
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    await sameProgramScopeChange(app)
    await idle(app.queryClient)
    await until(() => messageEls().length > 0, 'güncel kapsamda mesajlar')
    const before = messageEls().length
    const lists = sent('GET', '/v1/chats').length
    peerSays(GROUP, 'second', 'Kapsam sonrası yeni mesaj')
    await advance(1000)
    await until(() => messageEls().length === before + 1, 'yeni mesaj güncel pencerede')
    await idle(app.queryClient)
    expect(sent('GET', '/v1/chats').length).toBeGreaterThan(lists)
    expect(rowEls().length).toBeGreaterThan(0)
    const gone = chatOf(GROUP).messages.find((m) => m.base.seq === 57)!
    chatOf(GROUP).messages = chatOf(GROUP).messages.filter((m) => m !== gone)
    serverEmit(GROUP, 'message.deleted', {
      messageId: gone.base.message_id,
      actor: WHO.second.account_id,
    })
    await advance(1000)
    await until(
      () => !messageEls().some((el) => el.textContent?.includes('Mekanik mesaj 57')),
      'silinen güncel pencereden kalktı',
    )
  })
})
