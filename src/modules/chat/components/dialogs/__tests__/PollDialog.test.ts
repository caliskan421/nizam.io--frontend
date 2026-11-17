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
  msg,
  on,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
} from './harness'
import PollDialog from '../PollDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

function serve(send: () => Response | Promise<Response> = () => json(msg(9), 201)) {
  on('get', '/v1/chats/c1', () =>
    json({ chat_id: 'c1', kind: 'group', name: 'Eğitim', role: 'member' }),
  )
  on('post', '/v1/chats/c1/messages', send)
}
function fill(question = 'Hangi gün?', a = 'Salı', b = 'Çarşamba') {
  setValue('input[name="question"]', question)
  const options = $$('.chat-dlg__option input')
  ;(options[0] as HTMLInputElement).value = a
  options[0]!.dispatchEvent(new Event('input'))
  ;(options[1] as HTMLInputElement).value = b
  options[1]!.dispatchEvent(new Event('input'))
}

describe('PollDialog (E-10-93…100)', () => {
  it('başlık, açıklama "<Sohbet> grubuna gönderilecek"; sayaçlar', async () => {
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    await vi.waitFor(() =>
      expect($('.t-modal__desc')?.textContent).toBe('Eğitim grubuna gönderilecek'),
    )
    expect($('.t-modal__title')?.textContent).toBe('Anket oluştur')
    setValue('input[name="question"]', 'Soru')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-question-count"]')?.textContent).toContain('4 / 200'),
    )
    expect($('[data-testid="dlg-option-count"]')?.textContent).toContain('2 / 10')
  })

  it('"Anketi gönder" = sendChatMessage + poll; mesaj kimliği istemci üretir; soru = body', async () => {
    serve()
    const { wrapper } = mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    clickText('Çoklu')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(1))
    const [call] = called('POST', '/v1/chats/c1/messages')
    expect(call!.body).toMatchObject({
      body: 'Hangi gün?',
      poll: { options: ['Salı', 'Çarşamba'], multi: true, anonymous: false },
    })
    expect((call!.body as { client_message_id: string }).client_message_id).toMatch(
      /^[\x21-\x7e]+$/,
    )
    expect((call!.body as { poll: object }).poll).not.toHaveProperty('closes_at')
    expect(call!.headers.get('Idempotency-Key')).toBeNull()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
  })

  it("seçenek ekle/sil: 10'da ekle devre dışı, 2'de sil devre dışı", async () => {
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    expect(($$('.chat-dlg__option button')[0] as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 8; i += 1) click('[data-testid="dlg-add-option"]')
    await vi.waitFor(() => expect($$('.chat-dlg__option')).toHaveLength(10))
    expect(($('[data-testid="dlg-add-option"]') as HTMLButtonElement).disabled).toBe(true)
    $$('.chat-dlg__option button')[3]!.click()
    await vi.waitFor(() => expect($$('.chat-dlg__option')).toHaveLength(9))
  })

  it('doğrulama: eksik seçenek istek atmaz; "Anonim" (BE-161) devre dışı, "İsimli" sabit', async () => {
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    setValue('input[name="question"]', 'Soru')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('En az iki seçenek girin'))
    expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(0)
  })

  it('oy görünürlüğü canlı: "İsimli" varsayılan basılı; "Anonim" seçilebilir (stub yok), not görünür', async () => {
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    const seg = () => $$('[data-testid="dlg-visibility"] button')
    expect(seg().map((b) => [b.textContent?.trim(), b.getAttribute('aria-pressed')])).toEqual([
      ['İsimli', 'true'],
      ['Anonim', 'false'],
    ])
    expect($('[data-design-stub="BE-161"]')).toBeNull()
    expect($('[data-testid="dlg-anonymous-note"]')).toBeNull()
    clickText('Anonim')
    await vi.waitFor(() => expect($('[data-testid="dlg-anonymous-note"]')).not.toBeNull())
    expect(seg()[1]!.getAttribute('aria-pressed')).toBe('true')
    expect($('[data-testid="dlg-anonymous-note"]')!.textContent).toContain('sonradan değişmez')
  })

  it('isimli gönderimde poll.anonymous:false, anonimde true gider (açık alan)', async () => {
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(1))
    expect(called('POST', '/v1/chats/c1/messages')[0]!.body).toMatchObject({
      poll: { anonymous: false },
    })
    resetDialogs()
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    clickText('Anonim')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(1))
    expect(called('POST', '/v1/chats/c1/messages')[0]!.body).toMatchObject({
      poll: { options: ['Salı', 'Çarşamba'], anonymous: true },
    })
  })

  it('anonimlik açılışta kilitlidir: aynı kimlikle tekrar (Yeniden gönder) aynı anonymous değerini taşır', async () => {
    let n = 0
    serve(() => (n++ === 0 ? errorEnvelope('platform.internal', 503) : json(msg(9), 201)))
    mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    clickText('Anonim')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    clickText('Yeniden gönder')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(2))
    const [a, b] = called('POST', '/v1/chats/c1/messages')
    expect(b!.body).toEqual(a!.body)
    expect((b!.body as { poll: { anonymous: boolean } }).poll.anonymous).toBe(true)
  })

  it('son tarih geçmişteyse alan hatası; ileri tarih closes_at olarak gider', async () => {
    serve()
    mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    setValue('input[name="closes"]', '2020-01-01T10:00')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Son tarih şimdiden sonra'))
    setValue('input[name="closes"]', '2031-01-01T10:00')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(1))
    expect(
      (called('POST', '/v1/chats/c1/messages')[0]!.body as { poll: { closes_at: string } }).poll
        .closes_at,
    ).toMatch(/^2031-01-01T/)
  })

  it('422 poll alanı pencere içinde gösterilir; sunucu iletisi gösterilmez', async () => {
    serve(
      () =>
        new Response(
          JSON.stringify({
            code: 'messaging.input_invalid',
            message: 'sunucu iletisi',
            request_id: 'r',
            fields: [{ field: 'poll', code: 'messaging.input_invalid' }],
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
    )
    const { wrapper } = mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect($('[data-testid="dlg-error"]')).not.toBeNull())
    expect(document.body.textContent).not.toContain('sunucu iletisi')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('ağ kopması: "sonuç bilinmiyor" + Yeniden gönder AYNI mesaj kimliğiyle', async () => {
    let n = 0
    serve(() => {
      n += 1
      return n === 1 ? errorEnvelope('platform.internal', 503) : json(msg(9), 201)
    })
    const { wrapper } = mountDialog(PollDialog, { chatId: 'c1' })
    fill()
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    clickText('Yeniden gönder')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(2))
    const [first, second] = called('POST', '/v1/chats/c1/messages')
    expect((second!.body as { client_message_id: string }).client_message_id).toBe(
      (first!.body as { client_message_id: string }).client_message_id,
    )
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
  })

  it('Esc ve Vazgeç kapatır', async () => {
    serve()
    const { wrapper } = mountDialog(PollDialog, { chatId: 'c1' })
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Vazgeç')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})
