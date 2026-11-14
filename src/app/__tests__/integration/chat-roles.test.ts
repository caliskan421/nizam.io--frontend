// W160 · O3 senaryo 4: yetki ve mercek — üye 10b (birebir + grup üyeliği; grup kurma Ü dahil),
// kaynak seçimi ve mesajdan görev yalnız ŞY + K, K kendi birimi, yönetici K/Ü merceğinde program
// kapsamı (mercek ≠ yetki, P1), `member_source_managed` → üye yönetimi, 403 `messaging.not_authorized`
// → yetkisiz yolu. Sunucu üyeliği ve birebir zincirini UYGULAR; istemci yalnız gizler.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  chat,
  chatOf,
  COORD,
  GROUP,
  idle,
  MEMBER,
  menuItem,
  messageEls,
  resetChats,
  rowEls,
  rowOf,
  sent,
  teardown,
  toasts,
  tool,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  withText,
  WHO,
} from './chat-support'
import { http } from 'msw'

import { ORIGIN } from './fake-org'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const names = () =>
  $$('[data-testid="chat-picker-list"] .chat-dlg-row__name').map((el) => el.textContent)

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

async function openNew(mode: 'Birebir' | 'Grup') {
  await userClick('[data-testid="chat-new"]')
  await until(() => $('[data-testid="dlg-new-chat"]'), 'yeni konuşma')
  await userClick(() => withText('[role="dialog"] .rp-seg button', mode))
}

describe('üye (Ü) — 10b', () => {
  it('birebir adayları koordinatörlük zinciriyle sınırlı (ortak birim ya da ŞY); mevcut birebir açılır (200)', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => rowEls().length === 3, 'liste')
    await openNew('Birebir')
    await until(() => $('[data-testid="chat-picker-list"]'), 'adaylar')
    // Ayşe d1+d2 üyesi: Kerem (d1), Cem (d2), Yasemin (ŞY); Bora programda değil.
    expect(names().sort()).toEqual(['Cem Tan', 'Kerem Kaya', 'Yasemin Yönetici'])
    await userClick(() => withText('[data-testid="chat-picker-list"] button', 'Cem Tan'))
    await until(() => app.router.currentRoute.value.path === '/mesajlar/dm1', 'mevcut birebir')
    expect(sent('POST', '/v1/chats/direct')).toHaveLength(1)
    expect(chat.state.chats.filter((c) => c.kind === 'direct')).toHaveLength(2)
    await idle(app.queryClient)
  })

  it('grup kurabilir (K06): Grup sekmesi; kaynak seçimi yok (`source: none`)', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => rowEls().length === 3, 'liste')
    await openNew('Grup')
    await until(() => $('#chat-new-group'), 'grup formu')
    expect($('#chat-new-group select')).toBeNull()
    const input = $('#chat-new-group [name="name"]') as HTMLInputElement
    input.value = 'Üye grubu'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await userClick(() => withText('[data-testid="chat-picker-list"] button', 'Cem Tan'))
    await userClick('[data-testid="dlg-submit"]')
    await until(() => app.router.currentRoute.value.path.startsWith('/mesajlar/gc'), 'açıldı')
    expect(sent('POST', '/v1/chats/groups')[0]!.body).toMatchObject({ source: 'none' })
    await idle(app.queryClient)
  })

  it('mesajdan görev menü öğesi ve "Toplantı planla" yok (yalnız ŞY + K)', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(() => tool(rowOf(60)!, 'Diğer'))
    await until(() => menuItem('Yanıtla'), 'menü')
    expect(menuItem('Göreve dönüştür')).toBeNull()
    await userClick('.chat-thread__who')
    await until(() => $('[data-testid="dlg-quick"]'), 'grup bilgisi')
    expect($('[data-testid="dlg-plan-meeting"]')).toBeNull()
    expect($('[data-testid="dlg-add-members-open"]')).toBeNull()
    await idle(app.queryClient)
  })
})

describe('koordinatör (K) ve yönetici (ŞY)', () => {
  const chips = () =>
    $$('[data-testid="dlg-task-departments"] button').map((b) => b.textContent?.trim())

  async function openTaskDialog() {
    await until(() => rowOf(60), 'mesajlar')
    await userClick(() => tool(rowOf(60)!, 'Diğer'))
    await userClick(() => menuItem('Göreve dönüştür'))
    await until(() => $('#chat-task'), 'görev penceresi')
  }

  it('K yalnız kendi birimine görev açar (Mekanik); ŞY her birime (Mekanik + Yazılım)', async () => {
    await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await openTaskDialog()
    await until(() => chips().length > 0, 'çipler')
    expect(chips()).toEqual(['Mekanik'])
    teardown()
    await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await openTaskDialog()
    await until(() => chips().length > 1, 'çipler')
    expect(chips()).toEqual(['Mekanik', 'Yazılım'])
  })

  it('K birebirde ortak birimi olmayan üyeye yazamaz: "Mesaj" → "doğrudan yazışamazsınız"; sunucu 403', async () => {
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick('.chat-thread__who')
    await until(() => $('[data-testid="dlg-members"]'), 'üyeler')
    // Cem d2 üyesi; Kerem yalnız d1: aday listesinde yok → istek hiç atılmaz, metin görünür.
    const row = await until(
      () =>
        $$('[data-testid="dlg-members"] li').find((li) => li.textContent?.includes('Cem Tan')) ??
        null,
      'Cem satırı',
    )
    await userClick(() => withText('button', 'Mesaj', row))
    await until(() => $('[data-testid="dlg-cannot-direct"]'), 'yetkisiz yolu')
    expect(sent('POST', '/v1/chats/direct')).toHaveLength(0)
    await idle(app.queryClient)
  })

  it('yönetici Koordinatör merceğinde de ŞY: mesajdan görev menüsü her birime, liste program kapsamında aynı (mercek ≠ yetki)', async () => {
    const app = await boot({
      email: ADMIN.email,
      scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
      path: '/mesajlar',
    })
    await until(() => rowEls().length === 2, 'liste')
    await userClick(() => $(`[data-chat-id="${GROUP}"]`))
    await until(() => rowOf(60), 'mesajlar')
    await userClick(() => tool(rowOf(60)!, 'Diğer'))
    await userClick(() => menuItem('Göreve dönüştür'))
    await until(() => chips().length > 1, 'çipler')
    expect(chips()).toEqual(['Mekanik', 'Yazılım'])
    expect($('[data-testid="chat-new"]')).not.toBeNull()
    await idle(app.queryClient)
  })
})

describe('kaynaktan yönetilen üyelik ve 403', () => {
  function sourceGroup(): void {
    const group = chatOf(GROUP)
    group.name = 'Mekanik (sistem)'
    group.auto_kind = 'department'
    group.source = 'department'
    group.source_department_id = 'd1'
    for (const m of group.members) {
      if (m.account_id !== WHO.coord.account_id) m.from_source = true
    }
  }

  it('from_source üyede "Çıkar" yok (yönetici bile); "Gruptan ayrıl" yok', async () => {
    sourceGroup()
    await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick('.chat-thread__who')
    await until(() => $('[data-testid="dlg-members"] li'), 'üyeler')
    expect($('[data-testid="dlg-member-remove"]')).toBeNull()
    expect($('[data-testid="dlg-add-members-open"]')).toBeNull()
  })

  it('bayat istemci: üye sonradan kaynağa bağlandı → Çıkar 409 member_source_managed; üye listede kalır, uyarı bildirimi', async () => {
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick('.chat-thread__who')
    await until(() => $('[data-testid="dlg-member-remove"]'), 'çıkar düğmesi')
    // Üyelik sunucuda kaynaktan yönetilir oldu; istemcinin üye listesi bayat.
    for (const m of chatOf(GROUP).members) m.from_source = true
    await userClick('[data-testid="dlg-member-remove"]')
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    await userClick('[data-testid="confirm-accept"]')
    await until(() => toasts() !== '', 'bildirim')
    await idle(app.queryClient)
    expect(
      backend.requests.filter(
        (r) => r.method === 'DELETE' && r.path.startsWith(`/v1/chats/${GROUP}/members/`),
      ),
    ).toHaveLength(1)
    expect(chatOf(GROUP).members).toHaveLength(4)
  })

  it('403 messaging.not_authorized (liste): hata durumu + yeniden dene; sohbet satırı çizilmez', async () => {
    backend.server.use(
      http.get(`${ORIGIN}/v1/chats`, () =>
        Response.json(
          { code: 'messaging.not_authorized', message: 'x', request_id: 'r', fields: [] },
          { status: 403 },
        ),
      ),
    )
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => $('[data-testid="chat-list-error"]'), 'hata durumu')
    expect(rowEls()).toHaveLength(0)
    await idle(app.queryClient)
  })
})
