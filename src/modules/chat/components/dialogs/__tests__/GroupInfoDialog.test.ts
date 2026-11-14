import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  $,
  $$,
  called,
  click,
  clickText,
  errorEnvelope,
  json,
  ME,
  mountDialog,
  msg,
  noContent,
  on,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
  type WhoSeed,
} from './harness'
import GroupInfoDialog from '../GroupInfoDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const GROUP = {
  chat_id: 'c1',
  kind: 'group',
  name: 'Eğitim',
  role: 'admin',
  auto_kind: null,
  source: 'none',
  created_by_account_id: 'u1',
  created_at: '2026-11-14T08:00:00Z',
  last_seq: 3,
}
const member = (id: string, name: string, role = 'member', fromSource = false) => ({
  account_id: id,
  full_name: name,
  role,
  founder: role === 'founder',
  from_source: fromSource,
})
const MEMBERS = {
  items: [
    member(ME, 'Ben', 'admin'),
    member('u1', 'Ayşe Yılmaz'),
    member('u2', 'Can Demir', 'member', true),
  ],
  truncated: false,
}
const props = { chatId: 'c1' }
const ADMIN: WhoSeed = { companyAdmin: true }

function serve(chat: object = GROUP, members: object = MEMBERS) {
  on('get', '/v1/chats/c1', () => json(chat))
  on('get', '/v1/chats/c1/members', () => json(members))
  on('get', '/v1/chats/candidates', (c) =>
    json({
      items:
        c.query.get('purpose') === 'direct'
          ? [{ account_id: 'u1', full_name: 'Ayşe Yılmaz', role: 'member' }]
          : [{ account_id: 'u9', full_name: 'Yeni Kişi', role: 'member' }],
      truncated: false,
    }),
  )
  on('get', '/v1/chats/c1/pins', () => json({ items: [], truncated: false }))
}
async function ready() {
  await vi.waitFor(() =>
    expect($$('[data-testid="dlg-members"] .chat-dlg-row--split')).toHaveLength(3),
  )
}
function memberRow(name: string): HTMLElement {
  const row = $$('[data-testid="dlg-members"] .chat-dlg-row--split').find((r) =>
    r.textContent?.includes(name),
  )
  if (!row) throw new Error(`üye yok: ${name}`)
  return row
}

describe('GroupInfoDialog — grup (E-10-62…71)', () => {
  it('başlık, ad, "Grup · n üye · kuran ad"; sekme sayaçları; kaynaktan gelen üyede Çıkar yok', async () => {
    serve()
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    expect($('.t-modal__title')?.textContent).toBe('Grup bilgisi')
    expect($('.chat-dlg__name')?.textContent).toBe('Eğitim')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-group-sub"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Grup · 3 üye · kuran Ayşe Yılmaz',
      ),
    )
    expect(memberRow('Ben').textContent).toContain('Ben (sen)')
    expect(memberRow('Ben').textContent).toContain('Yönetici')
    expect(memberRow('Ben').querySelector('[data-testid="dlg-member-remove"]')).toBeNull()
    expect(memberRow('Ayşe').querySelector('[data-testid="dlg-member-remove"]')).not.toBeNull()
    expect(memberRow('Can').querySelector('[data-testid="dlg-member-remove"]')).toBeNull()
  })

  it('yönetici adı düzenler: form açılırken getChat taze; updateChat (anahtarsız)', async () => {
    serve()
    on('patch', '/v1/chats/c1', () => json({ ...GROUP, name: 'Yeni Ad' }))
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    const before = called('GET', '/v1/chats/c1').length
    click('[data-testid="dlg-rename"]')
    await vi.waitFor(() => expect(called('GET', '/v1/chats/c1').length).toBeGreaterThan(before))
    setValue('input[name="name"]', ' Yeni Ad ')
    clickText('Kaydet')
    await vi.waitFor(() => expect(called('PATCH', '/v1/chats/c1')).toHaveLength(1))
    expect(called('PATCH', '/v1/chats/c1')[0]!.body).toEqual({ name: 'Yeni Ad' })
    expect(called('PATCH', '/v1/chats/c1')[0]!.headers.get('Idempotency-Key')).toBeNull()
  })

  it('üye rolünde ad düzenleme, Üye ekle ve Çıkar yok; kendiliğinden grupta ad düzenleme gizli', async () => {
    serve({ ...GROUP, role: 'member' })
    mountDialog(GroupInfoDialog, props, { who: { rows: [{ departmentId: 'd1', role: 'uye' }] } })
    await ready()
    expect($('[data-testid="dlg-rename"]')).toBeNull()
    expect($('[data-testid="dlg-add-members-open"]')).toBeNull()
    expect($('[data-testid="dlg-member-remove"]')).toBeNull()
    expect($('[data-testid="dlg-plan-meeting"]')).toBeNull()
  })

  it('sistem grubunda (auto_kind) ad değişmez ve üye eklenmez', async () => {
    serve({ ...GROUP, auto_kind: 'general', created_by_account_id: null })
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    expect($('[data-testid="dlg-rename"]')).toBeNull()
    expect($('[data-testid="dlg-add-members-open"]')).toBeNull()
    expect($('[data-testid="dlg-group-sub"]')?.textContent).not.toContain('kuran')
  })

  it('üye çıkar: ortak onay (vazgeçte istek yok), onayda DELETE', async () => {
    serve()
    on('delete', '/v1/chats/c1/members/u1', () => noContent())
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    const dialog = useConfirm()
    memberRow('Ayşe').querySelector<HTMLElement>('[data-testid="dlg-member-remove"]')!.click()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    dialog.cancel(dialog.current.value!.id)
    await vi.waitFor(() => expect(dialog.current.value).toBeNull())
    expect(called('DELETE', '/v1/chats/c1/members/u1')).toHaveLength(0)
    memberRow('Ayşe').querySelector<HTMLElement>('[data-testid="dlg-member-remove"]')!.click()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    expect(dialog.current.value!.options.tone).toBe('danger')
    void dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() => expect(called('DELETE', '/v1/chats/c1/members/u1')).toHaveLength(1))
  })

  it('yönetici yap / yöneticiliği al', async () => {
    serve()
    on('put', '/v1/chats/c1/admins/u1', () => noContent())
    on('delete', '/v1/chats/c1/admins/u3', () => noContent())
    serve(GROUP, {
      items: [...MEMBERS.items, member('u3', 'Deniz Kaya', 'admin')],
      truncated: false,
    })
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await vi.waitFor(() =>
      expect($$('[data-testid="dlg-members"] .chat-dlg-row--split')).toHaveLength(4),
    )
    clickText('Yönetici yap', memberRow('Ayşe'))
    await vi.waitFor(() => expect(called('PUT', '/v1/chats/c1/admins/u1')).toHaveLength(1))
    expect(clickable(memberRow('Can'), 'Yöneticiliği al')).toBe(false)
    expect(clickable(memberRow('Ayşe'), 'Yöneticiliği al')).toBe(false)
    clickText('Yöneticiliği al', memberRow('Deniz'))
    await vi.waitFor(() => expect(called('DELETE', '/v1/chats/c1/admins/u3')).toHaveLength(1))
  })

  it('Mesaj: aday listesindekiyle birebir açılır; olmayanda §10.6 metni, istek yok', async () => {
    serve()
    on('post', '/v1/chats/direct', () => json({ ...GROUP, kind: 'direct', chat_id: 'dm1' }, 201))
    const { wrapper, router } = mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    await vi.waitFor(() => expect(called('GET', '/v1/chats/candidates').length).toBeGreaterThan(0))
    await vi.waitFor(() =>
      expect($$('[data-testid="dlg-members"] button').length).toBeGreaterThan(0),
    )
    clickText('Mesaj', memberRow('Can'))
    await vi.waitFor(() => expect($('[data-testid="dlg-cannot-direct"]')).not.toBeNull())
    expect(called('POST', '/v1/chats/direct')).toHaveLength(0)
    clickText('Mesaj', memberRow('Ayşe'))
    await vi.waitFor(() => expect(called('POST', '/v1/chats/direct')).toHaveLength(1))
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar/dm1'))
  })

  it('Gruptan ayrıl: onaydan sonra kendi satırı silinir, pencere kapanır, liste açılır', async () => {
    serve()
    on('delete', `/v1/chats/c1/members/${ME}`, () => noContent())
    const { wrapper, router } = mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    const dialog = useConfirm()
    click('[data-testid="dlg-leave"]')
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    void dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() => expect(called('DELETE', `/v1/chats/c1/members/${ME}`)).toHaveLength(1))
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar'))
  })

  it('kaynaktan gelen kendi satırında Gruptan ayrıl yok (member_source_managed)', async () => {
    serve(GROUP, {
      items: [member(ME, 'Ben', 'admin', true), member('u1', 'Ayşe')],
      truncated: false,
    })
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await vi.waitFor(() =>
      expect($$('[data-testid="dlg-members"] .chat-dlg-row--split')).toHaveLength(2),
    )
    expect($('[data-testid="dlg-leave"]')).toBeNull()
  })

  it('409 member_source_managed: ortak bildirim (hata kodundan metin, sunucu iletisi yok)', async () => {
    serve()
    on('delete', '/v1/chats/c1/members/u1', () =>
      errorEnvelope('messaging.member_source_managed', 409),
    )
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    const dialog = useConfirm()
    memberRow('Ayşe').querySelector<HTMLElement>('[data-testid="dlg-member-remove"]')!.click()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    void dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() => expect(called('DELETE', '/v1/chats/c1/members/u1')).toHaveLength(1))
    await vi.waitFor(() =>
      expect(useToast().current.value?.message).toBe(
        'Bu üye grubun kaynağından gelir; elle çıkarılamaz.',
      ),
    )
  })

  it('Üye ekle: aday listesi chat_id ile; seçilenler addChatMembers', async () => {
    serve()
    on('post', '/v1/chats/c1/members', () => noContent())
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    click('[data-testid="dlg-add-members-open"]')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-add-members"] [data-testid="chat-picker-list"]')).not.toBeNull(),
    )
    const group = called('GET', '/v1/chats/candidates').find(
      (c) => c.query.get('purpose') === 'group',
    )
    expect(group!.query.get('chat_id')).toBe('c1')
    $('[data-testid="dlg-add-members"] .chat-dlg-row')!.click()
    await vi.waitFor(() =>
      expect(($('[data-testid="dlg-add-submit"]') as HTMLButtonElement).disabled).toBe(false),
    )
    click('[data-testid="dlg-add-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/members')).toHaveLength(1))
    expect(called('POST', '/v1/chats/c1/members')[0]!.body).toEqual({ account_ids: ['u9'] })
    await vi.waitFor(() => expect($('[data-testid="dlg-add-members"]')).toBeNull())
  })

  it("Toplantı planla (ŞY/K) /toplantilar'a yönlendirir; Sesi kapat devre dışı + BE-027", async () => {
    serve()
    const { wrapper, router } = mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    const mute = $('[data-testid="dlg-mute"]') as HTMLButtonElement
    expect(mute.disabled).toBe(true)
    expect(mute.closest('[data-design-stub="BE-027"]')).not.toBeNull()
    click('[data-testid="dlg-plan-meeting"]')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/toplantilar'))
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('404: "Bu konuşma bulunamadı"', async () => {
    on('get', '/v1/chats/c1', () => errorEnvelope('messaging.chat_not_found', 404))
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-not-found"]')?.textContent).toBe('Bu konuşma bulunamadı'),
    )
  })

  it('Esc ve Kapat pencereyi kapatır', async () => {
    serve()
    const { wrapper } = mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Kapat')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})

function clickable(scope: HTMLElement, text: string): boolean {
  return [...scope.querySelectorAll('button')].some((b) => b.textContent?.trim() === text)
}

describe('GroupInfoDialog — birebir', () => {
  it('"Konuşma bilgisi": karşı taraf adı; Üyeler/Dosyalar sekmeleri yok; yalnız sabitler', async () => {
    serve({
      chat_id: 'c1',
      kind: 'direct',
      name: null,
      counterpart_name: 'Ayşe Yılmaz',
      counterpart_account_id: 'u1',
      role: 'member',
      auto_kind: null,
      source: 'none',
      created_by_account_id: null,
      created_at: '2026-11-14T08:00:00Z',
      last_seq: 1,
    })
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await vi.waitFor(() => expect($('.chat-dlg__name')?.textContent).toBe('Ayşe Yılmaz'))
    expect($('.t-modal__title')?.textContent).toBe('Konuşma bilgisi')
    expect($('[role="tablist"]')).toBeNull()
    expect($('[data-testid="dlg-members"]')).toBeNull()
    expect($('[data-testid="dlg-direct-pins"]')).not.toBeNull()
    expect(called('GET', '/v1/chats/c1/members')).toHaveLength(0)
  })
})

describe('GroupInfoDialog — sabitler ve paylaşılanlar sekmeleri (E-10-68, E-10-43)', () => {
  const PINNED = msg(4, { pinned_at: '2026-11-14T09:00:00Z', body: 'Önemli duyuru' })

  it('Sabitli: liste + sayaç; satır → mesaja git (?mesaj=<seq>); Sabitlemeyi kaldır onaylı', async () => {
    serve()
    on('get', '/v1/chats/c1/pins', () => json({ items: [PINNED], truncated: false }))
    on('delete', '/v1/chats/c1/messages/m4/pin', () => noContent())
    on('get', '/v1/chats/c1/messages', () => json({ items: [PINNED], peer_read_seq: null }))
    const { wrapper, router } = mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    clickText('Sabitli 1')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-pins"]')?.textContent).toContain('Önemli duyuru'),
    )
    const dialog = useConfirm()
    clickText('Sabitlemeyi kaldır', $('[data-testid="dlg-pins"]')!)
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    void dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() => expect(called('DELETE', '/v1/chats/c1/messages/m4/pin')).toHaveLength(1))
    $('[data-testid="dlg-pins"] .chat-dlg-row__main')!.click()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar/c1?mesaj=4'))
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('üyede (yetki yok) Sabitlemeyi kaldır görünmez; kesik liste "n+" notu', async () => {
    serve({ ...GROUP, role: 'member' })
    on('get', '/v1/chats/c1/pins', () => json({ items: [PINNED], truncated: true }))
    mountDialog(GroupInfoDialog, props, { who: { rows: [{ departmentId: 'd1', role: 'uye' }] } })
    await ready()
    clickText('Sabitli 1+')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-pins"]')?.textContent).toContain('1+ sabitli mesaj var'),
    )
    expect(clickable($('[data-testid="dlg-pins"]')!, 'Sabitlemeyi kaldır')).toBe(false)
  })

  it('Dosyalar: ad özetten, "artık yok" kartı; İndir bilet akışı (sayaç çizilmez, BE-084)', async () => {
    serve()
    on('get', '/v1/chats/c1/refs', (c) =>
      json({
        items:
          c.query.get('kind') === 'file'
            ? [
                {
                  ref_id: 'r1',
                  kind: 'file',
                  target_id: 'f1',
                  message_id: 'm1',
                  sender_account_id: 'u1',
                  created_at: '2026-11-14T08:00:00Z',
                },
                {
                  ref_id: 'r2',
                  kind: 'file',
                  target_id: 'f2',
                  message_id: 'm2',
                  sender_account_id: 'u1',
                  created_at: '2026-11-14T08:00:00Z',
                },
              ]
            : [],
        next_cursor: null,
      }),
    )
    on('get', '/v1/chat-refs/r1', () =>
      json({
        available: true,
        chat_id: 'c1',
        kind: 'file',
        message_id: 'm1',
        ref_id: 'r1',
        target_id: 'f1',
        file: {
          name: 'rapor.pdf',
          content_type: 'application/pdf',
          created_at: '2026-11-14T08:00:00Z',
          size_bytes: 10,
        },
      }),
    )
    on('get', '/v1/chat-refs/r2', () =>
      json({
        available: false,
        chat_id: 'c1',
        kind: 'file',
        message_id: 'm2',
        ref_id: 'r2',
        target_id: 'f2',
      }),
    )
    on('post', '/v1/download-tickets', () => errorEnvelope('messaging.ref_not_found', 404))
    mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    expect($$('[role="tab"]').map((t) => t.textContent?.trim())).toContain('Dosyalar')
    clickText('Dosyalar')
    await vi.waitFor(() => expect($$('[data-testid="dlg-ref-row"]')).toHaveLength(2))
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-refs"]')?.textContent).toContain('rapor.pdf'),
    )
    expect($('[data-testid="dlg-refs"]')?.textContent).toContain('Bu öğe artık yok')
    expect($$('[data-testid="dlg-ref-row"] button')).toHaveLength(1)
    clickText('İndir')
    await vi.waitFor(() => expect(called('POST', '/v1/download-tickets')).toHaveLength(1))
    expect(called('POST', '/v1/download-tickets')[0]!.body).toMatchObject({
      method: 'GET',
      path: '/v1/chat-file-refs/r1',
    })
  })

  it('Görevler: boş durum; görev satırı /gorevler?gorev= açar', async () => {
    serve()
    on('get', '/v1/chats/c1/refs', (c) =>
      json({
        items:
          c.query.get('kind') === 'task'
            ? [
                {
                  ref_id: 'r5',
                  kind: 'task',
                  target_id: 'w5',
                  message_id: 'm1',
                  sender_account_id: 'u1',
                  created_at: '2026-11-14T08:00:00Z',
                },
              ]
            : [],
        next_cursor: null,
      }),
    )
    on('get', '/v1/chat-refs/r5', () =>
      json({
        available: true,
        chat_id: 'c1',
        kind: 'task',
        message_id: 'm1',
        ref_id: 'r5',
        target_id: 'w5',
        task: {
          title: 'Rapor görevi',
          assignees: [],
          department_id: 'd1',
          department_name: 'Yazılım',
          description: '',
          end_on: '2026-12-01',
          start_on: '2026-11-20',
          status: 'baslanmadi',
        },
      }),
    )
    const { router } = mountDialog(GroupInfoDialog, props, { who: ADMIN })
    await ready()
    clickText('Dosyalar')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Paylaşılan dosya yok'))
    clickText('Görevler')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-refs"]')?.textContent).toContain('Rapor görevi'),
    )
    clickText('Görevi aç')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/gorevler?gorev=w5'))
  })
})
