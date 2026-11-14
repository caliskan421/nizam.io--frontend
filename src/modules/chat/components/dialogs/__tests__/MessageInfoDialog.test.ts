import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  clickText,
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

  it('grupta sahte okuyan listesi yok: açıklama + BE-028 işareti', async () => {
    on('get', '/v1/chats/c1', () => json(GROUP))
    mountDialog(MessageInfoDialog, props, { window: { items: [mine], peerReadSeq: null } })
    await vi.waitFor(() => expect($('[data-testid="dlg-who-read"]')).not.toBeNull())
    expect($('[data-testid="dlg-read-state"]')).toBeNull()
    expect($('[data-testid="dlg-who-read"]')!.closest('[data-design-stub="BE-028"]')).not.toBeNull()
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
