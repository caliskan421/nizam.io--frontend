import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  called,
  clickText,
  errorEnvelope,
  json,
  mountDialog,
  msg,
  on,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  signIn,
} from './harness'
import { chatText } from '../../../messages'
import MessageInfoDialog from '../MessageInfoDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const props = { chatId: 'c1', messageId: 'm5' }
const DIRECT = {
  chat_id: 'c1',
  kind: 'direct',
  name: null,
  counterpart_name: 'Ayşe Yılmaz',
  role: 'member',
}
const GROUP = { chat_id: 'c1', kind: 'group', name: 'Eğitim', role: 'member' }
const mine = msg(5, { body: 'Merhaba', created_at: new Date().toISOString() })
/** Oturum hesabı (`signIn` → acc-1) tarafından gönderilen grup mesajı. */
const mineGroup = msg(5, { sender_account_id: 'acc-1', body: 'Merhaba' })

describe('MessageInfoDialog (E-10-72…75)', () => {
  it('birebir: önizleme balonu ("Sen", metin, saat) ve okundu durumu seq ≤ peer_read_seq', async () => {
    on('get', '/v1/chats/c1', () => json(DIRECT))
    mountDialog(MessageInfoDialog, props, { window: { items: [mine], peerReadSeq: 5 } })
    await vi.waitFor(() => expect($('[data-testid="dlg-read-state"]')).not.toBeNull())
    expect($('.t-modal__title')?.textContent).toBe('Mesaj bilgisi')
    const bubble = $('[data-testid="dlg-info-bubble"]')!.textContent
    expect(bubble).toContain('Sen')
    expect(bubble).toContain('Merhaba')
    expect(bubble).toMatch(/bugün \d{2}:\d{2}/)
    expect($('[data-testid="dlg-read-state"]')!.textContent).toContain('Ayşe Yılmaz')
    expect($('[data-testid="dlg-read-state"]')!.textContent).toContain('Okundu')
    expect(document.body.textContent).toContain(
      'Okundu bilgisi karşı tarafın son okuduğu mesaja göre hesaplanır.',
    )
  })

  it('karşı taraf henüz okumadıysa "Henüz okunmadı"; imleç yoksa da', async () => {
    on('get', '/v1/chats/c1', () => json(DIRECT))
    mountDialog(MessageInfoDialog, props, { window: { items: [mine], peerReadSeq: 4 } })
    await vi.waitFor(() => expect($('[data-testid="dlg-read-state"]')).not.toBeNull())
    expect($('[data-testid="dlg-read-state"]')!.textContent).toContain('Henüz okunmadı')
  })

  it('grup: kendi mesajımda okuyanlar/okumayanlar listelenir (listChatMessageReceipts); last_read_at gösterilmez', async () => {
    on('get', '/v1/chats/c1', () => json(GROUP))
    on('get', '/v1/chats/c1/messages/m5/receipts', () =>
      json({
        message_id: 'm5',
        seq: 5,
        truncated: false,
        read: [
          { account_id: 'u2', full_name: 'Ayşe Yılmaz', last_read_at: '2026-11-14T09:41:00Z' },
        ],
        unread: [{ account_id: 'u3', full_name: 'Can Demir' }],
      }),
    )
    mountDialog(MessageInfoDialog, props, { window: { items: [mineGroup], peerReadSeq: null } })
    await vi.waitFor(() => expect($('[data-testid="dlg-who-read"]')).not.toBeNull())
    expect($('[data-testid="dlg-read-state"]')).toBeNull()
    expect($('[data-design-stub="BE-028"]')).toBeNull()
    expect($('[data-testid="dlg-receipts-read"]')!.textContent).toContain('Ayşe Yılmaz')
    expect($('[data-testid="dlg-receipts-unread"]')!.textContent).toContain('Can Demir')
    expect($('[data-testid="dlg-receipts-truncated"]')).toBeNull()
    // "Bu mesajı okuma anı" diye gösterilmez (imlecin son ilerleme anıdır).
    expect(document.body.textContent).not.toMatch(/09:41|9:41/)
    expect(called('GET', '/v1/chats/c1/messages/m5/receipts')).toHaveLength(1)
  })

  it('grup: 200 üyeyi aşan liste kesik notu; boş taraf "Kimse yok"', async () => {
    on('get', '/v1/chats/c1', () => json(GROUP))
    on('get', '/v1/chats/c1/messages/m5/receipts', () =>
      json({
        message_id: 'm5',
        seq: 5,
        truncated: true,
        read: [{ account_id: 'u2', full_name: 'Ayşe Yılmaz', last_read_at: null }],
        unread: [],
      }),
    )
    mountDialog(MessageInfoDialog, props, { window: { items: [mineGroup], peerReadSeq: null } })
    await vi.waitFor(() => expect($('[data-testid="dlg-receipts-truncated"]')).not.toBeNull())
    expect($('[data-testid="dlg-receipts-unread"]')!.textContent).toContain('Kimse yok')
  })

  it('grup: başkasının mesajında istek HİÇ gönderilmez (sunucu 403 verirdi); açıklama gösterilir', async () => {
    on('get', '/v1/chats/c1', () => json(GROUP))
    mountDialog(MessageInfoDialog, props, { window: { items: [mine], peerReadSeq: null } })
    await vi.waitFor(() => expect($('[data-testid="dlg-receipts-denied"]')).not.toBeNull())
    expect(called('GET', '/v1/chats/c1/messages/m5/receipts')).toHaveLength(0)
  })

  it('grup: receipts 403 → hata notu (sahte liste yok)', async () => {
    on('get', '/v1/chats/c1', () => json(GROUP))
    on('get', '/v1/chats/c1/messages/m5/receipts', () => errorEnvelope('messaging.forbidden', 403))
    mountDialog(MessageInfoDialog, props, { window: { items: [mineGroup], peerReadSeq: null } })
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(chatText('chat.states.error')),
    )
    expect($('[data-testid="dlg-who-read"]')).toBeNull()
  })

  it('Esc ve Kapat kapatır', async () => {
    on('get', '/v1/chats/c1', () => json(DIRECT))
    const { wrapper } = mountDialog(MessageInfoDialog, props, { window: { items: [mine] } })
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Kapat')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})
