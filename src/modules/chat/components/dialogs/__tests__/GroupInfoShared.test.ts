// W184: Grup bilgisi — paylaşılan sayılar/ek/görev bağı listeleri (BE-084), görev kartı durumları
// (BE-085), üye program rolü alt yazısı (BE-083) ve bildirim seviyesi (BE-027 ayar yüzü).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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
  on,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
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
  last_seq: 9,
}
const props = { chatId: 'c1' }
const who = { companyAdmin: true }
const ref = (id: string, kind: string, target: string) => ({
  ref_id: id,
  kind,
  target_id: target,
  message_id: `m-${id}`,
  sender_account_id: 'u1',
  created_at: '2026-11-14T08:00:00Z',
})
const attachment = (id: string, seq: number) => ({
  attachment_id: id,
  content_type: 'image/png',
  created_at: '2026-11-14T08:00:00Z',
  file_name: `${id}.png`,
  message_id: `m${seq}`,
  sender_account_id: 'u1',
  seq,
  size_bytes: 2048,
})
const link = (workItemId: string, seq: number) => ({
  created_at: '2026-11-14T08:00:00Z',
  message_id: `m${seq}`,
  seq,
  work_item_id: workItemId,
})

function serve(chat: object = GROUP) {
  on('get', '/v1/chats/c1', () => json(chat))
  on('get', '/v1/chats/c1/members', () => json({ items: [], truncated: false }))
  on('get', '/v1/chats/c1/pins', () => json({ items: [], truncated: false }))
  on('get', '/v1/program/departments', () => json({ departments: [] }))
  on('get', '/v1/chats/c1/refs', () => json({ items: [], next_cursor: null }))
  on('get', '/v1/chats/c1/attachments', () => json({ items: [], next_cursor: null }))
  on('get', '/v1/chats/c1/task-links', () => json({ items: [], next_cursor: null }))
}
const tabs = () => $$('[role="tab"]').map((t) => t.textContent?.trim().replace(/\s+/g, ' '))
const tab = (label: string) => vi.waitFor(() => expect(tabs()).toContain(label))

describe('sekme sayaçları (BE-084)', () => {
  it('Dosyalar = paylaşılanlar + cihaz ekleri; Görevler = tekil görev sayısı; sayaç liste toplamıdır, "n+" yok', async () => {
    serve()
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 1, attachments: 2, tasks: 2, polls: 0, departments: 0 }),
    )
    on('get', '/v1/chats/c1/refs', (c) =>
      json({
        items: c.query.get('kind') === 'file' ? [ref('r1', 'file', 'f1')] : [],
        next_cursor: null,
      }),
    )
    on('get', '/v1/chats/c1/attachments', () =>
      json({ items: [attachment('a2', 9), attachment('a1', 4)], next_cursor: null }),
    )
    on('get', '/v1/chat-refs/r1', () =>
      json({
        available: false,
        chat_id: 'c1',
        kind: 'file',
        message_id: 'm-r1',
        ref_id: 'r1',
        target_id: 'f1',
      }),
    )
    mountDialog(GroupInfoDialog, props, { who })
    await tab('Dosyalar 3')
    await tab('Görevler 2')
    expect(tabs().join(' ')).not.toContain('+ ')
    clickText('Dosyalar 3')
    await vi.waitFor(() => expect($$('[data-testid="dlg-attachment-row"]')).toHaveLength(2))
    expect($$('[data-testid="dlg-ref-row"]')).toHaveLength(1)
    // İki AYRI liste: toplam satır = sekme sayacı.
    expect(
      $$('[data-testid="dlg-ref-row"]').length + $$('[data-testid="dlg-attachment-row"]').length,
    ).toBe(3)
    expect($('[data-testid="dlg-attachments"]')!.textContent).toContain('Cihazdan eklenenler')
    expect($('[data-testid="dlg-refs"]')!.textContent).toContain('Arşivden paylaşılanlar')
  })

  it('cihaz ekleri imleçle sayfalanır; İndir bilet akışı attachment yoluyla; Mesaja git ?mesaj=<seq>', async () => {
    serve()
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 0, attachments: 3, tasks: 0, polls: 0, departments: 0 }),
    )
    on('get', '/v1/chats/c1/attachments', (c) =>
      c.query.get('cursor') === 'k1'
        ? json({ items: [attachment('a1', 2)], next_cursor: null })
        : json({ items: [attachment('a3', 8), attachment('a2', 5)], next_cursor: 'k1' }),
    )
    on('post', '/v1/download-tickets', () => errorEnvelope('messaging.attachment_not_found', 404))
    const { router } = mountDialog(GroupInfoDialog, props, { who })
    await tab('Dosyalar 3')
    clickText('Dosyalar 3')
    await vi.waitFor(() => expect($$('[data-testid="dlg-attachment-row"]')).toHaveLength(2))
    expect(called('GET', '/v1/chats/c1/attachments')[0]!.query.get('limit')).toBe('50')
    click('[data-testid="dlg-attachments-more"]')
    await vi.waitFor(() => expect($$('[data-testid="dlg-attachment-row"]')).toHaveLength(3))
    expect($('[data-testid="dlg-attachments-more"]')).toBeNull()
    clickText('İndir', $$('[data-testid="dlg-attachment-row"]')[0])
    await vi.waitFor(() => expect(called('POST', '/v1/download-tickets')).toHaveLength(1))
    expect(called('POST', '/v1/download-tickets')[0]!.body).toMatchObject({
      path: '/v1/chat-attachments/a3',
    })
    clickText('Mesaja git', $$('[data-testid="dlg-attachment-row"]')[1])
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar/c1?mesaj=5'))
  })

  it('mesajdan açılan görevler: görev kartı durumları (available/forbidden/deleted) mesaj başına TEK istek; bağ imleçle', async () => {
    serve()
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 0, attachments: 0, tasks: 3, polls: 0, departments: 0 }),
    )
    on('get', '/v1/chats/c1/task-links', () =>
      json({ items: [link('w1', 7), link('w2', 5), link('w3', 3)], next_cursor: null }),
    )
    const state = (id: string, s: string, task: object | null) => ({
      state: s,
      work_item_id: id,
      task,
    })
    on('get', '/v1/chats/c1/messages/m7/tasks', () =>
      json({
        items: [
          state('w1', 'available', {
            title: 'Trafo',
            status: 'baslanmadi',
            code: 'EL-1',
            sequence_no: 1,
            department_id: 'd1',
          }),
        ],
      }),
    )
    on('get', '/v1/chats/c1/messages/m5/tasks', () =>
      json({ items: [state('w2', 'forbidden', null)] }),
    )
    on('get', '/v1/chats/c1/messages/m3/tasks', () =>
      json({ items: [state('w3', 'deleted', null)] }),
    )
    const { router } = mountDialog(GroupInfoDialog, props, { who })
    await tab('Görevler 3')
    clickText('Görevler 3')
    await vi.waitFor(() => expect($$('[data-testid="dlg-link-row"]')).toHaveLength(3))
    await vi.waitFor(() =>
      expect($$('[data-testid="dlg-link-row"]')[2]!.textContent).toContain('Görev silinmiş'),
    )
    const rows = $$('[data-testid="dlg-link-row"]')
    expect(rows[0]!.textContent).toContain('EL-1 Trafo')
    expect(rows[1]!.textContent).toContain('Görevi görme yetkiniz yok')
    // Yetkisiz/silinmiş görev açılamaz; yalnız mesaja gidilir.
    expect(rows[1]!.textContent).not.toContain('Görevi aç')
    expect(rows[2]!.textContent).not.toContain('Görevi aç')
    expect(called('GET', '/v1/work-items/w1')).toHaveLength(0)
    clickText('Görevi aç', rows[0])
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/gorevler?gorev=w1'))
  })
})

describe('üye alt yazısı: program rolü (BE-083)', () => {
  it('"<Rol> · <Koordinatörlük>"; departman adı programın listesinden; grup rolü ayrı; programdan çıkmış none', async () => {
    serve()
    on('get', '/v1/program/departments', () =>
      json({
        departments: [
          { department_id: 'd1', display_name: 'Yazılım', code: 'YZ', status: 'active' },
        ],
      }),
    )
    on('get', '/v1/chats/c1/members', () =>
      json({
        items: [
          {
            account_id: ME,
            full_name: 'Ben',
            role: 'admin',
            founder: false,
            from_source: false,
            program_role: { role: 'company_admin', department_ids: [] },
          },
          {
            account_id: 'u2',
            full_name: 'Koray',
            role: 'member',
            founder: false,
            from_source: false,
            program_role: { role: 'coordinator', department_ids: ['d1'] },
          },
          {
            account_id: 'u3',
            full_name: 'Eski Üye',
            role: 'member',
            founder: false,
            from_source: false,
            program_role: { role: 'none', department_ids: [] },
          },
        ],
        truncated: false,
      }),
    )
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 0, attachments: 0, tasks: 0, polls: 0, departments: 0 }),
    )
    mountDialog(GroupInfoDialog, props, { who })
    await vi.waitFor(() => expect($$('[data-testid="dlg-member-program-role"]')).toHaveLength(3))
    await vi.waitFor(() =>
      expect(
        $$('[data-testid="dlg-member-program-role"]').map((e) => e.textContent?.trim()),
      ).toEqual(['Admin', 'Koordinatör · Yazılım', 'Programda değil']),
    )
    // Grup rolü ("Yönetici") program rolüyle karışmaz: yalnız admin üyede, ayrı etiket.
    const first = $$('[data-testid="dlg-members"] .chat-dlg-row--split')[0]!
    expect(first.textContent).toContain('Yönetici')
    expect(first.textContent).toContain('Admin')
  })
})

describe('Koordinatörler grubu kaynak bilgisi (BE-160)', () => {
  const note = () => $('[data-testid="dlg-group-sub"]')?.textContent?.replace(/\s+/g, ' ')
  const sourced = async (over: object) => {
    serve({ ...GROUP, ...over })
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 0, attachments: 0, tasks: 0, polls: 0, departments: 0 }),
    )
    mountDialog(GroupInfoDialog, props, { who })
    await vi.waitFor(() => expect(note()).toBeDefined())
  }

  it.each([{ source: 'coordinators' }, { auto_kind: 'coordinators' }])(
    'kaynak/auto_kind coordinators → salt bilgi metni; silme/kaynak değiştirme yok: %j',
    async (over) => {
      await sourced(over)
      expect(note()).toContain('Programdaki koordinatörler ve şirket yöneticisi')
      expect($('[data-testid="dlg-source-select"]')).toBeNull()
    },
  )

  it.each([{ source: 'none' }, { source: 'bilinmeyen-kaynak', auto_kind: 'yeni-tur' }])(
    'none ve bilinmeyen değer → bilgi satırı yok (ADR-0051 geri düşüş): %j',
    async (over) => {
      await sourced(over)
      expect(note()).not.toContain('koordinatörler ve şirket yöneticisi')
    },
  )
})

describe('bildirim seviyesi (BE-027 ayar yüzü)', () => {
  const level = (v?: string) => ({ ...GROUP, ...(v ? { notify_level: v } : {}) })

  it('yoksa all; seçim PUT {level}; sunucu cevabı + yeniden okuma sonrası görünür; CHAT_STUBS.mute yok', async () => {
    serve(level())
    let current = 'all'
    on('get', '/v1/chats/c1', () => json({ ...GROUP, notify_level: current }))
    on('put', '/v1/chats/c1/notification-level', (c) => {
      current = (c.body as { level: string }).level
      return json({ level: current })
    })
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 0, attachments: 0, tasks: 0, polls: 0, departments: 0 }),
    )
    mountDialog(GroupInfoDialog, props, { who })
    await vi.waitFor(() => expect($('[data-testid="dlg-notify-level"]')).not.toBeNull())
    const select = () => $('[data-testid="dlg-notify-level"]') as HTMLSelectElement
    expect(select().value).toBe('all')
    expect($('[data-design-stub="BE-027"]')).toBeNull()
    const reads = called('GET', '/v1/chats/c1').length
    setValue('[data-testid="dlg-notify-level"]', 'none')
    await vi.waitFor(() => expect(called('PUT', '/v1/chats/c1/notification-level')).toHaveLength(1))
    const put = called('PUT', '/v1/chats/c1/notification-level')[0]!
    expect(put.body).toEqual({ level: 'none' })
    expect(put.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(put.headers.get('X-Nizamio-Program')).toBe('p1')
    await vi.waitFor(() => expect(called('GET', '/v1/chats/c1').length).toBeGreaterThan(reads))
    await vi.waitFor(() => expect(select().value).toBe('none'))
    setValue('[data-testid="dlg-notify-level"]', 'mentions')
    await vi.waitFor(() => expect(called('PUT', '/v1/chats/c1/notification-level')).toHaveLength(2))
    expect(called('PUT', '/v1/chats/c1/notification-level')[1]!.body).toEqual({ level: 'mentions' })
  })

  it("mevcut seviye notify_level'dan; yazma 404 → hata gösterilir, seçim sunucudaki değerde kalır", async () => {
    serve(level('mentions'))
    on('get', '/v1/chats/c1/shared-counts', () =>
      json({ files: 0, attachments: 0, tasks: 0, polls: 0, departments: 0 }),
    )
    on('put', '/v1/chats/c1/notification-level', () =>
      errorEnvelope('messaging.chat_not_found', 404),
    )
    mountDialog(GroupInfoDialog, props, { who })
    await vi.waitFor(() => expect($('[data-testid="dlg-notify-level"]')).not.toBeNull())
    const select = $('[data-testid="dlg-notify-level"]') as HTMLSelectElement
    expect(select.value).toBe('mentions')
    setValue('[data-testid="dlg-notify-level"]', 'none')
    await vi.waitFor(() => expect($('[data-testid="dlg-notify-error"]')).not.toBeNull())
    expect(($('[data-testid="dlg-notify-level"]') as HTMLSelectElement).value).toBe('mentions')
  })
})
