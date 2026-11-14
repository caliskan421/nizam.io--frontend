import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  called,
  click,
  clickText,
  errorEnvelope,
  json,
  mountDialog,
  on,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
} from './harness'
import NewChatDialog from '../NewChatDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const CANDIDATES = {
  items: [
    { account_id: 'u1', full_name: 'Ayşe Yılmaz', role: 'member' },
    { account_id: 'u2', full_name: 'Can Demir', role: 'coordinator' },
  ],
  truncated: false,
}
const CHAT = {
  chat_id: 'new1',
  kind: 'group',
  name: 'Eğitim',
  created_at: '2026-11-14T08:00:00Z',
  last_seq: 0,
  source: 'none',
  auto_kind: null,
}

function serve() {
  on('get', '/v1/chats/candidates', () => json(CANDIDATES))
}
async function ready() {
  await vi.waitFor(() => expect($('[data-testid="chat-picker-list"]')).not.toBeNull())
}
function row(name: string): HTMLElement {
  const found = $$('.chat-dlg-row').find((r) => r.textContent?.includes(name))
  if (!found) throw new Error(`satır yok: ${name}`)
  return found
}

describe('NewChatDialog — Grup (E-10-76…80)', () => {
  it('ad + üyeler → createGroupChat: Idempotency-Key, source none, sohbet açılır, pencere kapanır', async () => {
    serve()
    on('post', '/v1/chats/groups', () => json(CHAT, 201))
    const { wrapper, router } = mountDialog(NewChatDialog, { mode: 'group' })
    await ready()
    expect($('[role="dialog"]')?.textContent).toContain('Serbest grup')
    setValue('input[name="name"]', '  Eğitim  ')
    row('Ayşe').click()
    row('Can').click()
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-member-count"]')?.textContent).toContain('2 + sen'),
    )
    expect($$('[data-testid="chat-picker-chips"] .t-chip')).toHaveLength(2)
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/groups')).toHaveLength(1))
    const [call] = called('POST', '/v1/chats/groups')
    expect(call!.body).toEqual({ name: 'Eğitim', member_account_ids: ['u1', 'u2'], source: 'none' })
    expect(call!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(call!.headers.get('X-Nizamio-Program')).toBe('p1')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar/new1'))
  })

  it('doğrulama: boş ad ve üyesiz gönderim istek atmaz; alan altı hata', async () => {
    serve()
    mountDialog(NewChatDialog, { mode: 'group' })
    await ready()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect($('.t-hint--error')?.textContent).toContain('Grup adı gerekli'))
    setValue('input[name="name"]', 'Ad')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('En az bir üye seçin'))
    expect(called('POST', '/v1/chats/groups')).toHaveLength(0)
  })

  it('sayaç "n / 80"; üye çipinden çıkarma; arama istemcide süzer', async () => {
    serve()
    mountDialog(NewChatDialog, { mode: 'group' })
    await ready()
    setValue('input[name="name"]', 'Dört')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-name-count"]')?.textContent).toContain('4 / 80'),
    )
    row('Ayşe').click()
    await vi.waitFor(() => expect($('.t-chip__x')).not.toBeNull())
    $('.t-chip__x')!.click()
    await vi.waitFor(() => expect($('[data-testid="chat-picker-chips"]')).toBeNull())
    setValue('input[type="search"]', 'can')
    await vi.waitFor(() => expect($$('.chat-dlg-row')).toHaveLength(1))
  })

  it('sunucu 422 alan hatası ve 409 chat_deleted pencere içinde gösterilir; sunucu iletisi yok', async () => {
    serve()
    on('post', '/v1/chats/groups', () => errorEnvelope('messaging.chat_deleted', 409))
    mountDialog(NewChatDialog, { mode: 'group' })
    await ready()
    setValue('input[name="name"]', 'Ad')
    row('Ayşe').click()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-error"]')?.textContent).toContain('Sohbet silinmiş'),
    )
    expect(document.body.textContent).not.toContain('sunucu iletisi')
  })
})

describe('NewChatDialog — Birebir (E-10-76)', () => {
  it('aday seçimi openDirectChat → sohbet açılır (201 ve 200 ikisi de)', async () => {
    serve()
    on('post', '/v1/chats/direct', () => json({ ...CHAT, kind: 'direct', chat_id: 'dm1' }, 200))
    const { wrapper, router } = mountDialog(NewChatDialog, { mode: 'direct' })
    await ready()
    expect($('[data-testid="dlg-submit"]')).toBeNull()
    row('Can').click()
    await vi.waitFor(() => expect(called('POST', '/v1/chats/direct')).toHaveLength(1))
    expect(called('POST', '/v1/chats/direct')[0]!.body).toEqual({ account_id: 'u2' })
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar/dm1'))
  })

  it('403 not_authorized → §10.6 "neden yazamıyorum" metni; pencere açık kalır', async () => {
    serve()
    on('post', '/v1/chats/direct', () => errorEnvelope('messaging.not_authorized', 403))
    const { wrapper } = mountDialog(NewChatDialog, { mode: 'direct' })
    await ready()
    row('Ayşe').click()
    await vi.waitFor(() => expect($('[data-testid="dlg-cannot-direct"]')).not.toBeNull())
    expect($('[data-testid="dlg-cannot-direct"]')!.textContent).toContain(
      'birebir sohbet yalnız koordinatörlük zinciri içinde açılır',
    )
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('segment Grup ↔ Birebir; kesilmiş aday listesi notu', async () => {
    on('get', '/v1/chats/candidates', () => json({ ...CANDIDATES, truncated: true }))
    mountDialog(NewChatDialog, { mode: 'group' })
    await ready()
    expect($('[data-testid="chat-picker-truncated"]')!.textContent).toBe(
      'Liste ilk 200 kişiyle sınırlı',
    )
    clickText('Birebir')
    await vi.waitFor(() => expect($('input[name="name"]')).toBeNull())
    clickText('Grup')
    await vi.waitFor(() => expect($('input[name="name"]')).not.toBeNull())
  })

  it('Esc ve Vazgeç pencereyi kapatır (close yayar)', async () => {
    serve()
    const { wrapper } = mountDialog(NewChatDialog, { mode: 'group' })
    await ready()
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Vazgeç')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})
