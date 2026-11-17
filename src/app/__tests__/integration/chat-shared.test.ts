// W184 · durumlu sahte sunucu (pin v0.25.0-api) ile gerçek uygulama: rol rozeti (BE-083), grup
// "herkes okudu" tiki (BE-028), grup bilgisi sayaçları + SSE yenilemesi (BE-084), mesaj görev
// kartları (BE-085), grup mesaj bilgisi (BE-028) ve bildirim seviyesi (BE-027 ayar yüzü).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  boot,
  chatOf,
  COORD,
  GROUP,
  idle,
  MEMBER,
  menuItem,
  messageEls,
  resetChats,
  rowOf,
  sent,
  serverEmit,
  teardown,
  tool,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  WHO,
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

const tabs = () => $$('[role="tab"]').map((t) => t.textContent?.trim().replace(/\s+/g, ' '))
const tickOf = (seq: number) => rowOf(seq)?.querySelector('.chat-tick')?.getAttribute('aria-label')
const openInfo = async () => {
  await userClick(() => $('.chat-thread__who'))
  await until(() => $('[data-testid="dlg-group-info"]'), 'grup bilgisi')
}

describe('rol rozeti (BE-083)', () => {
  it('Admin/Koordinatör rozetli, Üye ve programdan çıkmış (none) rozetsiz; başlık koordinatörlüğü söyler', async () => {
    const chat = chatOf(GROUP)
    addMessage(chat, WHO.admin, 'Yönetici duyurusu')
    addMessage(chat, WHO.coord, 'Koordinatör notu')
    addMessage(chat, WHO.free, 'Ayrılmış hesap')
    addMessage(chat, WHO.second, 'Üye mesajı')
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(64), 'mesajlar')
    const badge = (seq: number) => rowOf(seq)!.querySelector('[data-testid="chat-role-badge"]')
    expect(badge(61)!.textContent.trim()).toBe('Admin')
    expect(badge(62)!.textContent.trim()).toBe('Koordinatör')
    await until(() => badge(62)!.getAttribute('title')?.startsWith('Koordinatör · '), 'birim adı')
    expect(badge(63)).toBeNull()
    expect(badge(64)).toBeNull()
    // Rozet gösterimdir: yalnız `sender_role`'dan (sunucu); grup rolü (`admin`) rozet üretmez.
    expect(rowOf(63)!.querySelector('.chat-bub__role')).toBeNull()
    await idle(app.queryClient)
  })
})

describe('grup "herkes okudu" tiki (BE-028)', () => {
  it('read_by_all: true "Herkes okudu", false "Gönderildi"; başkasının mesajında tik yok; read.updated tiki yeniler', async () => {
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(58), 'mesajlar')
    // seq 38 (Kerem): Ayşe 40'a kadar okudu → herkes okudu; seq 58: Ayşe okumadı.
    await until(() => tickOf(38), 'tik')
    expect(tickOf(38)).toBe('Herkes okudu')
    expect(tickOf(58)).toBe('Gönderildi')
    expect(tickOf(57)).toBeUndefined() // Cem'in mesajı
    chatOf(GROUP).reads[WHO.member.account_id] = 60
    serverEmit(GROUP, 'read.updated', { actor: WHO.member.account_id })
    await until(() => tickOf(58) === 'Herkes okudu', 'tik yenilendi')
    await idle(app.queryClient)
  })
})

describe('grup bilgisi sayaçları (BE-084)', () => {
  const att = (id: string) => ({
    attachment_id: id,
    content_type: 'image/png',
    file_name: `${id}.png`,
    size_bytes: 10,
  })

  it('sekme sayacı sunucu toplamı = liste satırları; message.created/deleted olayında yenilenir', async () => {
    const chat = chatOf(GROUP)
    addMessage(chat, WHO.coord, 'ek 1', { attachments: [att('a1')] })
    const second = addMessage(chat, WHO.second, 'ek 2', { attachments: [att('a2'), att('a3')] })
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(62), 'mesajlar')
    await openInfo()
    await until(() => tabs().includes('Dosyalar 3'), 'sayaç')
    await userClick(
      () => $$('[role="tab"]').find((t) => t.textContent?.includes('Dosyalar')) ?? null,
    )
    await until(() => $$('[data-testid="dlg-attachment-row"]').length === 3, 'ek listesi')
    // Sayaç = liste toplamı; "n+" işareti yok.
    expect(tabs().join(' ')).not.toContain('+')

    const reads = sent('GET', `/v1/chats/${GROUP}/shared-counts`).length
    const fresh = addMessage(chat, WHO.second, 'ek 3', { attachments: [att('a4')] })
    serverEmit(GROUP, 'message.created', {
      messageId: fresh.base.message_id,
      actor: WHO.second.account_id,
    })
    await until(() => tabs().includes('Dosyalar 4'), 'sayaç arttı')
    expect(sent('GET', `/v1/chats/${GROUP}/shared-counts`).length).toBeGreaterThan(reads)
    await until(() => $$('[data-testid="dlg-attachment-row"]').length === 4, 'liste arttı')

    chat.messages = chat.messages.filter((m) => m !== second)
    serverEmit(GROUP, 'message.deleted', {
      messageId: second.base.message_id,
      actor: WHO.second.account_id,
    })
    await until(() => tabs().includes('Dosyalar 2'), 'sayaç azaldı')
    await until(() => $$('[data-testid="dlg-attachment-row"]').length === 2, 'liste azaldı')
    await idle(app.queryClient)
  })
})

describe('mesaj görev kartları (BE-085)', () => {
  it('available/forbidden/deleted tek istekle çözülür; getWorkItem yoklaması yok; message.updated kartı yeniler', async () => {
    const chat = chatOf(GROUP)
    const msg = addMessage(chat, WHO.coord, 'Görevler açıldı', {
      task_ids: ['w1', 'w4', 'w-silinmis'],
    })
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(61), 'mesajlar')
    const cards = () => rowOf(61)!.querySelector('[data-testid="chat-task-cards"]')
    await until(() => cards()?.querySelectorAll('[data-state]').length === 3, 'kartlar')
    expect(cards()!.querySelector('[data-state="available"]')!.textContent).toContain('Motor testi')
    expect(cards()!.querySelector('[data-state="forbidden"]')!.textContent.trim()).toBe(
      'Görevi görme yetkiniz yok',
    )
    expect(cards()!.textContent).not.toContain('Arayüz taslağı') // forbidden başlığı sızmaz
    expect(cards()!.querySelector('[data-state="deleted"]')!.textContent.trim()).toBe(
      'Görev silinmiş',
    )
    expect(sent('GET', `/v1/chats/${GROUP}/messages/${msg.base.message_id}/tasks`)).toHaveLength(1)
    // Eski yol yok: görev başına getWorkItem yoklaması YOK.
    for (const id of ['w1', 'w4', 'w-silinmis'])
      expect(sent('GET', `/v1/work-items/${id}`)).toHaveLength(0)

    backend.db.items.find((i) => i.work_item_id === 'w1')!.title = 'Motor testi v2'
    serverEmit(GROUP, 'message.updated', {
      messageId: msg.base.message_id,
      actor: WHO.coord.account_id,
    })
    await until(() => cards()?.textContent?.includes('Motor testi v2'), 'kart yenilendi')
    await idle(app.queryClient)
  })
})

describe('mesaj bilgisi — grup (BE-028)', () => {
  it('kendi mesajımda okuyanlar/okumayanlar; başkasının mesajında menü öğesi yok ve istek gitmez', async () => {
    await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(58), 'mesajlar')
    await userClick(() => tool(rowOf(58)!, 'Diğer'))
    await userClick(() => menuItem('Mesaj bilgisi'))
    await until(() => $('[data-testid="dlg-receipts-read"]'), 'okuyanlar')
    const read = $('[data-testid="dlg-receipts-read"]')!.textContent
    expect(read).toContain('Yasemin')
    expect(read).toContain('Cem')
    expect($('[data-testid="dlg-receipts-unread"]')!.textContent).toContain('Ayşe')
    expect($('[data-testid="dlg-who-read"]')!.textContent).not.toMatch(/\d{1,2}:\d{2}/)
    expect(sent('GET', `/v1/chats/${GROUP}/messages/${GROUP}-m58/receipts`)).toHaveLength(1)
    teardown()

    await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(57), 'mesajlar')
    await userClick(() => tool(rowOf(57)!, 'Diğer')) // Cem'in mesajı
    await until(() => menuItem('Yanıtla'), 'menü')
    expect(menuItem('Mesaj bilgisi')).toBeNull()
    expect(sent('GET', `/v1/chats/${GROUP}/messages/${GROUP}-m57/receipts`)).toHaveLength(0)
  })
})

describe('bildirim seviyesi (BE-027 ayar yüzü)', () => {
  it('seçim PUT {level}; liste + ayrıntı yeniden okunur; sunucu durumu kalıcı; stub yok', async () => {
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(58), 'mesajlar')
    await openInfo()
    const select = () => $('[data-testid="dlg-notify-level"]') as HTMLSelectElement
    await until(select, 'bildirim seçimi')
    expect(select().value).toBe('all')
    expect($('[data-design-stub="BE-027"]')).toBeNull()
    const lists = sent('GET', '/v1/chats').length
    select().value = 'mentions'
    select().dispatchEvent(new Event('change'))
    await until(() => sent('PUT', `/v1/chats/${GROUP}/notification-level`).length === 1, 'PUT')
    expect(chatOf(GROUP).notify![WHO.coord.account_id]).toBe('mentions')
    await until(() => sent('GET', '/v1/chats').length > lists, 'liste yeniden okundu')
    await until(() => select().value === 'mentions', 'ayrıntı yeniden okundu')
    await idle(app.queryClient)
  })
})
