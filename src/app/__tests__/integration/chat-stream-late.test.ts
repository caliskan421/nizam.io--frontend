// W165 · CX-F7-Ö-05 (KESİN 26): gecikmiş erişim denetimi sonucu A sohbetine aittir; kullanıcı bu arada
// B'yi açtıysa B'yi kapatmaz, yanlış "bulunamadı" bildirimi çıkmaz. Gerçek süre yok: sahte saat + bariyer.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  advance,
  boot,
  chatOf,
  DIRECT_OTHERS,
  fakeClock,
  GROUP,
  hold,
  idle,
  MEMBER,
  messageEls,
  resetChats,
  serverEmit,
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

/** A sohbetinin ayrıntı sorgusu 404 ile bitti mi (kapsam anahtarından bağımsız). */
const failedDetail = (client: Awaited<ReturnType<typeof boot>>['queryClient']) =>
  client
    .getQueryCache()
    .getAll()
    .some((q) => q.state.error !== null && JSON.stringify(q.queryKey).includes(GROUP))

const NOT_FOUND = 'Bu konuşma bulunamadı'

describe('gecikmiş erişim denetimi (CX-F7-Ö-05)', () => {
  it('A çıkarılma olayı: ayrıntı 404, liste bariyerde → B açılır → bırakılır: B açık kalır, bildirim yok; A’ya dönüş 404’ü gösterir', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const group = chatOf(GROUP)
    group.members = group.members.filter((m) => m.account_id !== WHO.member.account_id)
    const gate = hold('GET', /\/v1\/chats$/)
    serverEmit(GROUP, 'member.changed', {
      actor: WHO.coord.account_id,
      affected: [WHO.member.account_id],
    })
    await advance(1000)
    await gate.arrived
    // Liste bariyerde: `idle` beklenemez; A ayrıntısının 404'le tamamlandığı önbellekten okunur.
    await until(() => failedDetail(app.queryClient), 'A ayrıntısı 404')
    await app.router.push(`/mesajlar/${DIRECT_OTHERS}`)
    await until(() => app.router.currentRoute.value.path.endsWith(DIRECT_OTHERS), 'B rotası')
    await until(
      () => messageEls().some((el) => el.textContent?.includes('yarın toplantı')),
      'B mesajları',
    )
    gate.release()
    await idle(app.queryClient)
    await advance(1000)
    expect(app.router.currentRoute.value.path).toBe(`/mesajlar/${DIRECT_OTHERS}`)
    expect(toasts()).not.toContain(NOT_FOUND)
    expect(messageEls().length).toBeGreaterThan(0)
    await app.router.push(`/mesajlar/${GROUP}`)
    await until(() => $('main')?.textContent?.includes(NOT_FOUND), 'A için 404 durumu')
  })
})
