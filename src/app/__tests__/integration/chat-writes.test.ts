// W160 · O3 senaryo 1 (b): sohbet yazmaları — gönder (`client_message_id`; başarısız → aynı kimlikle
// yeniden dene; sunucu çift gönderimi tek sayar), düzenle (`edit_conflict` → güncel okuma), sil,
// tepki (4), sabitle, anket oyu/bitirme (`around`), read-all (KESİN 29 türevleri). Gerçek
// router/AppShell/oturum + durumlu sahte sunucu.
import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  byText,
  chat,
  chatOf,
  confirmDialog,
  GROUP,
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
  toasts,
  typeText,
  until,
  useChatBackend,
  watchStreams,
  userClick,
  COORD,
  WHO,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const texts = () => messageEls().map((el) => el.querySelector('.chat-bub')?.textContent ?? '')

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

describe('gönder', () => {
  it('Enter → TEK POST (client_message_id + CSRF + program başlığı); balon akışa girer, taslak boşalır', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await typeText('Selam ekip')
    await pressEnter()
    await until(() => texts().some((t) => t.includes('Selam ekip')), 'balon')
    await idle(app.queryClient)
    const posts = sent('POST', `/v1/chats/${GROUP}/messages`)
    expect(posts).toHaveLength(1)
    expect((posts[0]!.body as { client_message_id: string }).client_message_id).toMatch(/\S{8,}/)
    expect(posts[0]!.headers.get('X-Requested-With')).toBeTruthy()
    expect(posts[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(($('[data-chat-composer-input]') as HTMLTextAreaElement).value).toBe('')
    expect(chatOf(GROUP).messages.filter((m) => m.base.body === 'Selam ekip')).toHaveLength(1)
  })

  it('503 → "Gönderim doğrulanamadı"; Tekrar dene AYNI client_message_id ile gider', async () => {
    chat.state.sendFault = 'unavailable'
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await typeText('Tekrar denenecek')
    await pressEnter()
    await until(() => $('.chat-composer__notice'), 'doğrulanamadı')
    expect($('.chat-composer__notice')!.textContent).toContain('doğrulanamadı')
    await userClick(() => $('.chat-composer__notice button'))
    await until(() => texts().some((t) => t.includes('Tekrar denenecek')), 'balon')
    await idle(app.queryClient)
    const posts = sent('POST', `/v1/chats/${GROUP}/messages`)
    const ids = posts.map((p) => (p.body as { client_message_id: string }).client_message_id)
    expect(ids).toHaveLength(2)
    expect(ids[0]).toBe(ids[1])
    expect(chatOf(GROUP).messages.filter((m) => m.base.body === 'Tekrar denenecek')).toHaveLength(1)
  })

  it('yanıt yolda kaybolur (sunucu işledi): yeniden deneme TEK mesaj bırakır, ekranda tek balon', async () => {
    chat.state.sendFault = 'lost-response'
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await typeText('Çift gitmesin')
    await pressEnter()
    await until(() => $('.chat-composer__notice button'), 'doğrulanamadı')
    expect(chatOf(GROUP).messages.filter((m) => m.base.body === 'Çift gitmesin')).toHaveLength(1)
    await userClick(() => $('.chat-composer__notice button'))
    await until(() => texts().some((t) => t.includes('Çift gitmesin')), 'balon')
    await idle(app.queryClient)
    expect(chatOf(GROUP).messages.filter((m) => m.base.body === 'Çift gitmesin')).toHaveLength(1)
    expect(texts().filter((t) => t.includes('Çift gitmesin'))).toHaveLength(1)
  })
})

describe('düzenle ve sil', () => {
  /** Üyenin (Ayşe) kendi mesajı: seq 61. */
  function ownMessage(): string {
    const chatRow = chatOf(GROUP)
    return `${chatRow.last_seq + 1}`
  }

  async function ownBubble(): Promise<number> {
    const seq = Number(ownMessage())
    const sentAt = chatOf(GROUP)
    const { addMessage } = await import('./fake-chat')
    addMessage(sentAt, WHO.member, 'Benim mesajım')
    return seq
  }

  it('düzenle: expected_revision gider, gövde güncellenir ("düzenlendi")', async () => {
    const seq = await ownBubble()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(seq), 'kendi mesajım')
    await userClick(() => tool(rowOf(seq)!, 'Diğer'))
    await userClick(() => menuItem('Düzenle'))
    await until(
      () => ($('[data-chat-composer-input]') as HTMLTextAreaElement).value === 'Benim mesajım',
      'düzenleme alanı',
    )
    await typeText('Benim mesajım (düzeltildi)')
    await pressEnter()
    await until(() => rowOf(seq)?.textContent?.includes('düzeltildi'), 'güncel gövde')
    await idle(app.queryClient)
    const patch = sent('PATCH', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}`)
    expect(patch).toHaveLength(1)
    expect((patch[0]!.body as { expected_revision: number }).expected_revision).toBe(1)
    expect(rowOf(seq)!.textContent).toContain('düzenlendi')
  })

  it('edit_conflict: 409 → ortak çakışma penceresi (benim / güncel); "güncel" mesajı sunucudan okur', async () => {
    const seq = await ownBubble()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(seq), 'kendi mesajım')
    await userClick(() => tool(rowOf(seq)!, 'Diğer'))
    await userClick(() => menuItem('Düzenle'))
    await until(() => ($('[data-chat-composer-input]') as HTMLTextAreaElement).value, 'alan')
    // Başka bir oturum mesajı değiştirdi: sürüm ilerledi.
    const server = chatOf(GROUP).messages.find((m) => m.base.seq === seq)!
    Object.assign(server.base, { body: 'Başka cihazdaki metin', edit_revision: 2, edited: true })
    await typeText('Benim yeni metnim')
    await pressEnter()
    await until(() => $('[data-testid="conflict-fields"]'), 'çakışma penceresi')
    expect($('[data-testid="conflict-theirs"]')!.textContent).toContain('Başka cihazdaki metin')
    expect($('[data-testid="conflict-mine"]')!.textContent).toContain('Benim yeni metnim')
    expect(sent('PATCH', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}`)).toHaveLength(1)
    // "Güncel değer" seçilir: otomatik tekrar yok; mesaj sunucudan okunur ve düzenleme kapanır.
    await userClick(() =>
      byText('[role="dialog"] [role="radio"], [role="dialog"] button', 'Güncel değer'),
    )
    await userClick('[data-testid="conflict-submit"]')
    await until(() => rowOf(seq)?.textContent?.includes('Başka cihazdaki metin'), 'güncel gövde')
    await idle(app.queryClient)
    expect(sent('PATCH', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}`)).toHaveLength(1)
    expect(($('[data-chat-composer-input]') as HTMLTextAreaElement).value).toBe('')
  })

  it('sil: onay penceresi → DELETE → balon kalkar; vazgeç hiçbir istek atmaz', async () => {
    const seq = await ownBubble()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(seq), 'kendi mesajım')
    await userClick(() => tool(rowOf(seq)!, 'Diğer'))
    await userClick(() => menuItem('Sil'))
    await confirmDialog('cancel')
    await idle(app.queryClient)
    expect(sent('DELETE', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}`)).toHaveLength(0)
    await userClick(() => tool(rowOf(seq)!, 'Diğer'))
    await userClick(() => menuItem('Sil'))
    await confirmDialog('accept')
    await until(() => rowOf(seq) === null, 'balon kalktı')
    await idle(app.queryClient)
    expect(sent('DELETE', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}`)).toHaveLength(1)
    expect(chatOf(GROUP).messages.some((m) => m.base.seq === seq)).toBe(false)
  })
})

describe('tepki, sabit, anket', () => {
  it('dört tepki türü: PUT kind; aynı türe tık DELETE; çip sayısı sunucudan', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'son mesaj')
    for (const [kind, name] of [
      ['like', 'Beğen'],
      ['heart', 'Kalp'],
      ['check', 'Onay'],
      ['star', 'Yıldız'],
    ] as const) {
      await userClick(() => tool(rowOf(60)!, 'Tepki ver'))
      await userClick(() => $(`[role="menu"] button[aria-label="${name}"]`))
      await until(() => $(`.chat-react[aria-label="${name} 1"]`), `${kind} çipi`)
      await idle(app.queryClient)
    }
    const puts = sent('PUT', `/v1/chats/${GROUP}/messages/${GROUP}-m60/reaction`)
    expect(puts.map((p) => (p.body as { kind: string }).kind)).toEqual([
      'like',
      'heart',
      'check',
      'star',
    ])
    // Yer değiştirir: sunucuda hesap başına TEK tepki.
    expect($$('.chat-react', rowOf(60)!)).toHaveLength(1)
    await userClick(() => $('.chat-react[aria-pressed="true"]', rowOf(60)!))
    await until(() => $$('.chat-react', rowOf(60)!).length === 0, 'tepki kalktı')
    expect(sent('DELETE', `/v1/chats/${GROUP}/messages/${GROUP}-m60/reaction`)).toHaveLength(1)
  })

  it('sabitle: yalnız grup yöneticisinde menü öğesi; PUT pin → sabit şeridi; kaldır → DELETE', async () => {
    // Üye (Ayşe) menüde "Sabitle" görmez.
    await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(59), 'mesaj')
    await userClick(() => tool(rowOf(59)!, 'Diğer'))
    await until(() => menuItem('Yanıtla'), 'menü')
    expect(menuItem('Sabitle')).toBeNull()
    teardown()
    // Yönetici (Kerem) sohbetin yöneticisidir.
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(59), 'mesaj')
    await userClick(() => tool(rowOf(59)!, 'Diğer'))
    await userClick(() => menuItem('Sabitle'))
    await until(() => $('[data-testid="chat-pinbar"]'), 'sabit şeridi')
    await idle(app.queryClient)
    expect(sent('PUT', `/v1/chats/${GROUP}/messages/${GROUP}-m59/pin`)).toHaveLength(1)
    expect($('[data-testid="chat-pinbar"]')!.textContent).toContain('Mekanik mesaj 59')
    await userClick(() => tool(rowOf(59)!, 'Diğer'))
    await userClick(() => menuItem('Sabitlemeyi kaldır'))
    await until(() => !$('[data-testid="chat-pinbar"]'), 'şerit kalktı')
    expect(sent('DELETE', `/v1/chats/${GROUP}/messages/${GROUP}-m59/pin`)).toHaveLength(1)
  })

  async function seedPoll(): Promise<number> {
    const { addMessage } = await import('./fake-chat')
    const group = chatOf(GROUP)
    const message = addMessage(group, WHO.coord, 'Toplantı günü?', {
      poll: {
        closed_at: null,
        closes_at: null,
        multi: false,
        results: [
          { count: 0, label: 'Salı', option_index: 0, voters: [] },
          { count: 0, label: 'Çarşamba', option_index: 1, voters: [] },
        ],
      },
    })
    return message.base.seq
  }

  it('anket: oy PUT vote + around okuması; yüzde güncellenir; sahibi bitirir (onay) → kapandı', async () => {
    const seq = await seedPoll()
    await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(seq), 'anket')
    await userClick(() => $$('.chat-poll__opt', rowOf(seq)!)[1] ?? null)
    await until(() => $('.chat-poll__opt--on', rowOf(seq)!), 'oy işlendi')
    const votes = sent('PUT', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}/vote`)
    expect(votes.map((v) => (v.body as { option_indexes: number[] }).option_indexes)).toEqual([[1]])
    const around = sent('GET', `/v1/chats/${GROUP}/messages`).filter(
      (r) => r.query.get('around') === String(seq),
    )
    expect(around.length).toBeGreaterThanOrEqual(1)
    expect(rowOf(seq)!.textContent).toContain('%100')
    teardown()
    // Anketi açan (Kerem) bitirir.
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(seq), 'anket')
    await userClick(() => tool(rowOf(seq)!, 'Diğer'))
    await userClick(() => menuItem('Anketi bitir'))
    await confirmDialog('accept')
    await until(() => rowOf(seq)?.textContent?.includes('Anket kapandı'), 'kapandı')
    await idle(app.queryClient)
    expect(sent('POST', `/v1/chats/${GROUP}/messages/${GROUP}-m${seq}/poll/close`)).toHaveLength(1)
    expect([...$$('.chat-poll__opt', rowOf(seq)!)].every((b) => b.hasAttribute('disabled'))).toBe(
      true,
    )
  })
})

describe('read-all (KESİN 29)', () => {
  it('uç bütün sohbetleri okunmuş yapar: liste rozetleri ve menü rozeti yeniden okunur', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => $('nav .side-badge[data-badge="unread"]'), 'menü rozeti')
    const { useMarkAllChatsRead } = await import('@/modules/chat/public')
    const { mount } = await import('@vue/test-utils')
    const { defineComponent, h } = await import('vue')
    const { VueQueryPlugin } = await import('@tanstack/vue-query')
    const { i18n } = await import('@/shared/i18n')
    let submit!: ReturnType<typeof useMarkAllChatsRead>['submit']
    const probe = mount(
      defineComponent({
        setup() {
          submit = useMarkAllChatsRead().submit
          return () => h('div')
        },
      }),
      {
        global: {
          plugins: [
            app.pinia,
            [VueQueryPlugin, { queryClient: app.queryClient }],
            app.router,
            i18n,
          ],
        },
      },
    )
    const outcome = await submit({ programId: 'p1' })
    expect(outcome.kind).toBe('success')
    await idle(app.queryClient)
    await flushPromises()
    await until(() => !$('nav .side-badge[data-badge="unread"]'), 'menü rozeti kalktı')
    expect($$('.chat-row__badge')).toHaveLength(0)
    expect(sent('POST', '/v1/chats/read-all')).toHaveLength(1)
    probe.unmount()
    expect(toasts()).toBe('')
    void ADMIN
  })
})
