// W184 · P86: mevcut görev detayında "Kaynak mesaja git" (getWorkItemSourceMessage) — gerçek router
// ve uygulama: bağlantı doğru program/sohbet/`mesaj=<seq>` hedefini açar ve mevcut `around`
// okumasıyla konuşmayı konumlar; null/erişimsiz kaynakta bağlantı yok; kapsam değişince geç yanıt
// yeni kapsama uygulanmaz.
import { http } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  boot,
  chat,
  chatOf,
  GROUP,
  idle,
  MEMBER,
  messageEls,
  ORIGIN,
  resetChats,
  rowOf,
  sent,
  switchScope,
  teardown,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  WHO,
} from './chat-support'
import { addMessage, makeChat, member } from './fake-chat'

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

const link = () => $('[data-testid="detail-source-message"] button')

describe('görev detayı → Kaynak mesaja git', () => {
  it('kaynak mesaj varken bağlantı: tık /mesajlar/:chatId?mesaj=<seq> açar, konuşma around=<seq> ile konumlanır', async () => {
    const source = addMessage(chatOf(GROUP), WHO.coord, 'Motoru test edin', { task_ids: ['w1'] })
    const app = await boot({ ...MEMBER, path: '/gorevler?gorev=w1' })
    await until(link, 'kaynak mesaj bağlantısı')
    const [request] = sent('GET', '/v1/work-items/w1/source-message')
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBe('d1')
    await userClick(link)
    await until(() => app.router.currentRoute.value.path === `/mesajlar/${GROUP}`, 'sohbet rotası')
    expect(app.router.currentRoute.value.query.mesaj).toBe(String(source.base.seq))
    // Konuşma gerçek `mesaj` sorgusuyla açılır: mevcut `around` okuması hedef sırayı getirir.
    await until(() => rowOf(source.base.seq), 'hedef mesaj')
    const around = sent('GET', `/v1/chats/${GROUP}/messages`).map((r) => r.query.get('around'))
    expect(around).toContain(String(source.base.seq))
    expect(rowOf(source.base.seq)!.textContent).toContain('Motoru test edin')
    await idle(app.queryClient)
  })

  it('bağ yoksa (elle açılmış görev) bağlantı çizilmez', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler?gorev=w1' })
    await until(() => $('[data-testid="work-detail"] h2'), 'panel')
    await until(
      () => sent('GET', '/v1/work-items/w1/source-message').length === 1,
      'kaynak mesaj okuması',
    )
    await idle(app.queryClient)
    expect(link()).toBeNull()
  })

  it('kaynak sohbete erişim yoksa (üye değil) sunucu null verir; bağlantı yok, sohbet varlığı sızmaz', async () => {
    const hidden = makeChat(
      'gx',
      'group',
      [member(WHO.coord.account_id), member(WHO.second.account_id)],
      {
        name: 'Gizli',
      },
    )
    chat.state.chats.push(hidden)
    addMessage(hidden, WHO.coord, 'Kapalı sohbet', { task_ids: ['w1'] })
    const app = await boot({ ...MEMBER, path: '/gorevler?gorev=w1' })
    await until(() => $('[data-testid="work-detail"] h2'), 'panel')
    await until(
      () => sent('GET', '/v1/work-items/w1/source-message').length === 1,
      'kaynak mesaj okuması',
    )
    await idle(app.queryClient)
    expect(link()).toBeNull()
  })

  it('kapsam (program) değişince geç yanıt yeni kapsamda bağlantı çizmez ve gezinme yapmaz', async () => {
    addMessage(chatOf(GROUP), WHO.coord, 'Motoru test edin', { task_ids: ['w1'] })
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    backend.server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/source-message`, async () => {
        arrived()
        await gate
        return Response.json({ source_message: { chat_id: GROUP, message_id: 'x', seq: 7 } })
      }),
    )
    const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
    await reached
    await switchScope('Program', 'Teknofest 2027')
    release()
    await idle(app.queryClient)
    expect(link()).toBeNull()
    expect(app.router.currentRoute.value.path).not.toContain('/mesajlar')
  })
})
