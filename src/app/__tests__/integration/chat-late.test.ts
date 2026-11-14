// W160 · O3 senaryo 8 (KESİN 26): geç sonuç, oturum ve kapsam — gönderim sürerken sayfa sökülür →
// bildirim yok; kapsam değişir → akış ve bekleyen okumalar iptal (eski programın yanıtı yeni
// programın listesine yazılmaz); hesap değişir → sohbet önbelleği, bildirim listesi ve taslaklar
// temizlenir; bekleyen gecikmeli okundu gönderimi sahip sökülünce ve kapsam değişince gitmez.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  advance,
  boot,
  chat,
  chatOf,
  fakeClock,
  GROUP,
  hold,
  idle,
  liveStreams,
  MEMBER,
  messageEls,
  PEOPLE,
  pressEnter,
  resetChats,
  rowEls,
  sent,
  streamOpen,
  streamCalls,
  switchScope,
  teardown,
  toasts,
  typeText,
  until,
  useChatBackend,
  userClick,
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

const draftField = () => $('[data-chat-composer-input]') as HTMLTextAreaElement | null

describe('geç sonuç — sökülmüş ekran', () => {
  it('gönderim sürerken sayfa sökülür: bildirim yok, ek okuma yok, ekrana akış yok', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const gate = hold('POST', new RegExp(`/v1/chats/${GROUP}/messages$`))
    await typeText('Sökülürken giden')
    await pressEnter()
    await gate.arrived
    await app.router.push('/gorevler')
    await until(() => !$('[data-testid="chat-page"]'), 'sayfa söküldü')
    const reads = sent('GET', `/v1/chats/${GROUP}/messages`).length
    gate.release()
    await idle(app.queryClient)
    await advance(0).catch(() => undefined)
    expect(toasts()).toBe('')
    expect(sent('GET', `/v1/chats/${GROUP}/messages`)).toHaveLength(reads)
    // Sunucu mesajı işledi (kullanıcı eylemi); ekran artık yok.
    expect(chatOf(GROUP).messages.filter((m) => m.base.body === 'Sökülürken giden')).toHaveLength(1)
  })

  it('bekleyen gecikmeli okundu gönderimi sahip sökülünce iptal edilir (istek gitmez)', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await until(() => messageEls().length > 0, 'mesajlar')
    await streamOpen()
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    await advance(400)
    await app.router.push('/gorevler')
    await until(() => !$('[data-testid="chat-page"]'), 'sayfa söküldü')
    await advance(5_000)
    await idle(app.queryClient)
    expect(sent('POST', `/v1/chats/${GROUP}/read`)).toHaveLength(0)
  })
})

describe('kapsam değişimi', () => {
  it('bekleyen liste okuması varken program değişir: akış p1 kapanır, p2 açılır; p1 satırları yeni listeye yazılmaz', async () => {
    const gate = hold('GET', /^\/v1\/chats$/)
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await gate.arrived
    await streamOpen()
    await switchScope('Program', 'Teknofest 2027')
    await until(() => liveStreams().some((c) => c.program === 'p2'), 'p2 akışı')
    expect(streamCalls.find((c) => c.program === 'p1')!.aborted).toBe(true)
    gate.release()
    await idle(app.queryClient)
    await until(() => $('[data-testid="chat-list-empty"]'), 'p2 boş listesi')
    expect(rowEls()).toHaveLength(0)
  })

  it('bekleyen okundu gönderimi kapsam (program) değişince iptal edilir', async () => {
    const app = await boot({ ...ADMIN, path: `/mesajlar/dm2` })
    fakeClock()
    await until(() => messageEls().length > 0, 'mesajlar')
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    await advance(300)
    await switchScope('Program', 'Teknofest 2027')
    await advance(5_000)
    await idle(app.queryClient)
    expect(sent('POST', '/v1/chats/dm2/read')).toHaveLength(0)
  })
})

describe('taslak ve hesap değişimi', () => {
  it('taslak program değişiminde boşalır (hesap:program:sohbet anahtarı)', async () => {
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await typeText('Yarım kalan taslak')
    await idle(app.queryClient)
    await switchScope('Program', 'Teknofest 2027')
    await idle(app.queryClient)
    await until(() => app.scope.programId === 'p2', 'p2')
    await switchScope('Program', 'Teknofest 2026')
    await idle(app.queryClient)
    await app.router.push(`/mesajlar/${GROUP}`)
    await until(() => draftField(), 'yazma alanı')
    expect(draftField()!.value).toBe('')
  })

  it('hesap değişince sohbet ve bildirim önbelleği, taslak ve sayaçlar önceki hesaptan kalmaz', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await typeText('Ayşe taslağı')
    await idle(app.queryClient)
    const keys = () =>
      app.queryClient
        .getQueryCache()
        .getAll()
        .filter(
          (q) =>
            /chats|notifications/.test(JSON.stringify(q.queryKey)) && q.state.data !== undefined,
        )
    expect(keys().length).toBeGreaterThan(0)
    await app.session.logout()
    await until(() => $('[data-testid="login-form"]'), 'giriş ekranı')
    await idle(app.queryClient)
    expect(keys()).toHaveLength(0)
    // Başka hesap (Cem) aynı sekmede girer: kendi sohbetleri; Ayşe'nin birebiri yok; taslak yok.
    await app.session.login({ email: PEOPLE.second.email, password: 'dogru-parola' })
    await app.router.push('/mesajlar')
    await idle(app.queryClient)
    await switchScope('Program', 'Teknofest 2026')
    await until(() => rowEls().length > 0, 'Cem listesi')
    await idle(app.queryClient)
    expect(
      rowEls()
        .map((r) => r.dataset.chatId)
        .sort(),
    ).toEqual(['dm1', GROUP])
    expect($('[data-chat-id="dm2"]')).toBeNull()
    await app.router.push(`/mesajlar/${GROUP}`)
    await until(() => draftField(), 'yazma alanı')
    expect(draftField()!.value).toBe('')
    expect(chat.state.chats).toHaveLength(3)
    await userClick(() => $('[data-testid="chat-new"]') ?? $('[data-testid="chat-composer"]'))
  })
})
