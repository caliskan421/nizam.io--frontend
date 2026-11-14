// W160 · O3 senaryo 3: pencereler (W157) + tetikleyiciler (W156) — mesaj bilgisi, mesajdan görev
// (→ 03 `?gorev=`), Composer ek (yükle / Arşivden), anket oluştur, yeni grup (`Idempotency-Key`
// tekrarı), üye çıkarma onayı; odak dönüşü her kapanış yolunda (Esc / ✕ / eylem) 1440 ve 390.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  byText,
  withText,
  stubBrowserClone,
  chat,
  chatOf,
  click,
  COORD,
  dialogEl,
  GROUP,
  idle,
  MEMBER,
  menuItem,
  messageEls,
  pickFile,
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
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const texts = () => messageEls().map((el) => el.querySelector('.chat-bub')?.textContent ?? '')
const attachButton = () => $('.chat-composer__btn[aria-label="Ekle"]')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
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

describe('mesaj bilgisi (birebir) ve grup bilgisi', () => {
  it('birebirde kendi mesajım → "Mesaj bilgisi" penceresi okundu durumunu gösterir; grupta öğe devre dışı', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar/dm2' })
    await until(() => messageEls().length > 0, 'mesajlar')
    // dm2'de mesaj Ayşe'nindir (kendi mesajım): bilgi birebirde açılır.
    await userClick(() => tool(rowOf(1)!, 'Diğer'))
    await userClick(() => menuItem('Mesaj bilgisi'))
    await until(() => $('[data-testid="dlg-message-info"]'), 'mesaj bilgisi')
    expect($('[data-testid="dlg-read-state"]')!.textContent).toContain('Henüz okunmadı')
    expect($('[data-testid="dlg-info-bubble"]')!.textContent).toContain('raporu gönderdim')
    await idle(app.queryClient)
    teardown()

    await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'grup mesajı')
    // Kerem'in kendi mesajı (seq 59 ya da 58): grupta "Mesaj bilgisi" devre dışı (BE-028).
    await userClick(() => tool(rowOf(58)!, 'Diğer'))
    const info = await until(() => menuItem('Mesaj bilgisi'), 'menü öğesi')
    expect(info.getAttribute('aria-disabled') === 'true' || info.hasAttribute('disabled')).toBe(
      true,
    )
  })
})

describe('mesajdan görev', () => {
  const day = (offset: number) => {
    const d = new Date(Date.now() + offset * 86_400_000)
    return d.toISOString().slice(0, 10)
  }

  async function open(message: number) {
    await userClick(() => tool(rowOf(message)!, 'Diğer'))
    await userClick(() => menuItem('Göreve dönüştür'))
    await until(() => $('#chat-task'), 'görev penceresi')
  }

  it('yönetici: form → createTaskFromChatMessage (Idempotency-Key) → "Görevi aç" → 03 ?gorev= paneli', async () => {
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await open(60)
    await userClick(() => $$('[data-testid="dlg-task-departments"] button')[0] ?? null)
    const form = $('#chat-task')!
    const set = (name: string, value: string) => {
      const el = form.querySelector<HTMLInputElement>(`[name="${name}"]`)!
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    set('startOn', day(1))
    set('endOn', day(5))
    await userClick('[data-testid="dlg-submit"]')
    await until(() => $('[data-testid="dlg-task-done"]'), 'görev oluşturuldu')
    const posts = sent('POST', `/v1/chats/${GROUP}/messages/${GROUP}-m60/tasks`)
    expect(posts).toHaveLength(1)
    expect(posts[0]!.headers.get('Idempotency-Key')).toBeTruthy()
    const body = posts[0]!.body as { department_id: string }
    expect(body.department_id).toBe('d1')
    const id = backend.db.items.at(-1)!.work_item_id
    await userClick('[data-testid="dlg-open-task"]')
    await until(() => app.router.currentRoute.value.path === '/gorevler', '03')
    expect(app.router.currentRoute.value.query.gorev).toBe(id)
    await until(() => $('.wd-actions') ?? $('[data-testid="tasks-page"]'), '03 sayfası')
    await idle(app.queryClient)
    // Mesajda "Göreve dönüştürüldü" işareti SSE/yerel yamayla görünür (sohbete dönünce).
    expect(chatOf(GROUP).messages.find((m) => m.base.seq === 60)!.base.task_ids).toEqual([id])
  })

  it('yanıt kaybolur → "Yeniden gönder" AYNI Idempotency-Key ile; sunucuda TEK görev', async () => {
    chat.state.keyedFault = 'lost-response'
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await open(60)
    await userClick(() => $$('[data-testid="dlg-task-departments"] button')[0] ?? null)
    const form = $('#chat-task')!
    for (const [name, value] of [
      ['startOn', day(1)],
      ['endOn', day(3)],
    ] as const) {
      const el = form.querySelector<HTMLInputElement>(`[name="${name}"]`)!
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await userClick('[data-testid="dlg-submit"]')
    const retry = await until(
      () => byText('[role="dialog"] button', 'Yeniden gönder'),
      'yeniden gönder',
    )
    const before = backend.db.items.length
    await userClick(() => retry)
    await until(() => $('[data-testid="dlg-task-done"]'), 'görev oluşturuldu')
    await idle(app.queryClient)
    const posts = sent('POST', `/v1/chats/${GROUP}/messages/${GROUP}-m60/tasks`)
    expect(posts).toHaveLength(2)
    expect(posts[1]!.headers.get('Idempotency-Key')).toBe(posts[0]!.headers.get('Idempotency-Key'))
    expect(backend.db.items.length).toBe(before)
  })

  it('üye merceğinde "Göreve dönüştür" menü öğesi yok (yalnız ŞY + K)', async () => {
    await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(() => tool(rowOf(60)!, 'Diğer'))
    await until(() => menuItem('Yanıtla'), 'menü')
    expect(menuItem('Göreve dönüştür')).toBeNull()
  })
})

describe('Composer ek menüsü', () => {
  it('Yeni dosya yükle: multipart gövde + client_message_id sorguda; balon dosya kartıyla gelir', async () => {
    stubBrowserClone()
    chat.state.upload = { file_name: 'rapor.pdf', content_type: 'application/pdf' }
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(attachButton)
    await userClick(() => menuItem('Yeni dosya yükle'))
    const input = await until(
      () => $('[data-testid="chat-file"]') as HTMLInputElement | null,
      'dosya girdisi',
    )
    await typeText('Rapor ekte')
    await pickFile(input, new File(['%PDF-1.7'], 'rapor.pdf', { type: 'application/pdf' }))
    await until(() => texts().some((t) => t.includes('rapor.pdf')), 'dosya balonu')
    await idle(app.queryClient)
    const posts = sent('POST', `/v1/chats/${GROUP}/attachments`)
    expect(posts).toHaveLength(1)
    expect(posts[0]!.query.get('client_message_id')).toBeTruthy()
    expect(posts[0]!.headers.get('Content-Type')).toContain('multipart/form-data')
    expect(chatOf(GROUP).messages.at(-1)!.base.attachments[0]!.file_name).toBe('rapor.pdf')
  })

  it('Arşivden dosya: pencere → birim → dosya → refs[file] ile tek mesaj', async () => {
    const { archiveHandlers, createArchiveState, file } = await import('./archive-fake')
    const archive = createArchiveState()
    archive.files = [file('f1', 'w1', 'd1', WHO.member.account_id)]
    backend.server.use(...archiveHandlers(backend.db, archive))
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(attachButton)
    await userClick(() => menuItem('Arşivden dosya'))
    await until(() => $('[data-testid="dlg-archive"]'), 'arşiv paneli')
    const select = $('[data-testid="dlg-archive"] select') as HTMLSelectElement
    select.value = 'd1'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await userClick(() => $('[data-testid="dlg-archive-list"] button'))
    await userClick('[data-testid="dlg-submit"]')
    await until(() => !dialogEl(), 'pencere kapandı')
    await idle(app.queryClient)
    const posts = sent('POST', `/v1/chats/${GROUP}/messages`)
    expect(posts).toHaveLength(1)
    expect((posts[0]!.body as { refs: unknown[] }).refs).toEqual([
      { kind: 'file', target_id: 'f1' },
    ])
  })
})

describe('anket oluştur', () => {
  it('Ekle → Anket (yalnız grupta): soru + iki seçenek → TEK mesaj (poll gövdesi)', async () => {
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(attachButton)
    await userClick(() => menuItem('Anket'))
    await until(() => $('#chat-poll'), 'anket penceresi')
    const form = $('#chat-poll')!
    const set = (selector: string, value: string) => {
      const el = form.querySelector<HTMLInputElement>(selector)!
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    set('[name="question"]', 'Toplantı hangi gün?')
    set('[aria-label="Seçenek 1"]', 'Salı')
    set('[aria-label="Seçenek 2"]', 'Çarşamba')
    await userClick('[data-testid="dlg-submit"]')
    await until(() => !dialogEl(), 'pencere kapandı')
    await idle(app.queryClient)
    const posts = sent('POST', `/v1/chats/${GROUP}/messages`)
    expect(posts).toHaveLength(1)
    const body = posts[0]!.body as { poll: { options: string[] }; body: string }
    expect(body.poll.options).toEqual(['Salı', 'Çarşamba'])
    expect(body.body).toBe('Toplantı hangi gün?')
    await until(() => $('.chat-poll'), 'anket kartı')
  })

  it('birebirde "Anket" öğesi menüde yok', async () => {
    await boot({ ...MEMBER, path: '/mesajlar/dm2' })
    await until(() => messageEls().length > 0, 'mesajlar')
    await userClick(attachButton)
    await until(() => menuItem('Yeni dosya yükle'), 'menü')
    expect(menuItem('Anket')).toBeNull()
  })
})

describe('yeni grup', () => {
  async function fillGroup(name: string, memberName: string) {
    await userClick('[data-testid="chat-new"]')
    await until(() => $('[data-testid="dlg-new-chat"]'), 'yeni konuşma')
    await click(() => byText('[role="dialog"] button, [role="dialog"] [role="radio"]', 'Grup'))
    await until(() => $('#chat-new-group'), 'grup formu')
    const input = $('#chat-new-group [name="name"]') as HTMLInputElement
    input.value = name
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await userClick(() => withText('[data-testid="chat-picker-list"] button', memberName))
  }

  it('grup kur: Idempotency-Key; 201 → sohbet açılır', async () => {
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => $('[data-testid="chat-new"]'), 'liste')
    await fillGroup('Fuar hazırlık', 'Ayşe Demir')
    await userClick('[data-testid="dlg-submit"]')
    await until(
      () => app.router.currentRoute.value.path.startsWith('/mesajlar/gc'),
      'sohbet açıldı',
    )
    const posts = sent('POST', '/v1/chats/groups')
    expect(posts).toHaveLength(1)
    expect(posts[0]!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(posts[0]!.body).toMatchObject({ name: 'Fuar hazırlık', source: 'none' })
    await idle(app.queryClient)
  })

  it('yanıt kaybolur → "Yeniden gönder" AYNI Idempotency-Key; sunucuda TEK grup', async () => {
    chat.state.keyedFault = 'lost-response'
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => $('[data-testid="chat-new"]'), 'liste')
    await fillGroup('Tekrar grubu', 'Cem Tan')
    await userClick('[data-testid="dlg-submit"]')
    const retry = await until(
      () => byText('[role="dialog"] button', 'Yeniden gönder'),
      'yeniden gönder',
    )
    await userClick(() => retry)
    await until(
      () => app.router.currentRoute.value.path.startsWith('/mesajlar/gc'),
      'sohbet açıldı',
    )
    await idle(app.queryClient)
    const posts = sent('POST', '/v1/chats/groups')
    expect(posts).toHaveLength(2)
    expect(posts[1]!.headers.get('Idempotency-Key')).toBe(posts[0]!.headers.get('Idempotency-Key'))
    expect(chat.state.chats.filter((c) => c.name === 'Tekrar grubu')).toHaveLength(1)
  })
})

describe('üye çıkarma', () => {
  const memberRow = (name: string) =>
    $$('[data-testid="dlg-members"] li').find((li) => li.textContent?.includes(name)) ?? null
  const deletes = () =>
    backend.requests.filter(
      (r) => r.method === 'DELETE' && r.path.startsWith(`/v1/chats/${GROUP}/members/`),
    )

  it('yönetici üyeyi çıkarır: ortak onay → DELETE → üye listeden düşer; vazgeç istek atmaz', async () => {
    const app = await boot({ ...COORD, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick('.chat-thread__who')
    await until(() => memberRow('Cem Tan'), 'üyeler')
    await userClick(() =>
      withText('[data-testid="dlg-member-remove"]', 'Çıkar', memberRow('Cem Tan')!),
    )
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    expect($('[data-testid="confirm-dialog"]')!.textContent).toContain('Cem Tan')
    await userClick(() => $('[data-testid="confirm-dialog"] [data-autofocus]'))
    await idle(app.queryClient)
    expect(deletes()).toHaveLength(0)
    await userClick(() =>
      withText('[data-testid="dlg-member-remove"]', 'Çıkar', memberRow('Cem Tan')!),
    )
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    await userClick('[data-testid="confirm-accept"]')
    await until(() => memberRow('Cem Tan') === null, 'üye düştü')
    await idle(app.queryClient)
    expect(deletes()).toHaveLength(1)
    expect(deletes()[0]!.path).toBe(`/v1/chats/${GROUP}/members/${WHO.second.account_id}`)
    expect(chatOf(GROUP).members.some((m) => m.account_id === WHO.second.account_id)).toBe(false)
  })
})
