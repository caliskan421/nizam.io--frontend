import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetAll,
  server,
  signIn,
} from '../../__tests__/harness'
import { mountPane, servePane, settle, unmountAll } from '../__tests__/pane-harness'

// jsdom'da `structuredClone(File)` FormData'nın kabul etmediği nesne üretir; tarayıcıdaki gibi
// Blob aynen taşınır (api/attachments.test.ts kalıbı).
const nativeClone = globalThis.structuredClone
function browserLikeClone(value: unknown): unknown {
  if (value instanceof Blob) return value
  if (Array.isArray(value)) return value.map(browserLikeClone)
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, browserLikeClone(v)]))
  }
  return nativeClone(value)
}
beforeAll(() => {
  vi.stubGlobal('structuredClone', browserLikeClone)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  resetAll()
  unmountAll()
})
afterAll(() => {
  vi.unstubAllGlobals()
  server.close()
})
beforeEach(signIn)

type Wrapper = Awaited<ReturnType<typeof mountPane>>['wrapper']
const field = (w: Wrapper) => w.get('textarea')
async function type(w: Wrapper, text: string) {
  const el = field(w)
  await el.setValue(text)
  ;(el.element as HTMLTextAreaElement).setSelectionRange(text.length, text.length)
  await el.trigger('keyup')
}
const created = (seq: number, body: string, over = {}) =>
  msg(seq, { body, sender_account_id: 'acc-1', sender_name: undefined, ...over })

function captureSend(
  replies: (body: Record<string, unknown>, n: number) => Response | Promise<Response>,
) {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.post(`${ORIGIN}/v1/chats/c1/messages`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return replies(body, bodies.length)
    }),
    http.post(`${ORIGIN}/v1/chats/c1/typing`, () => new HttpResponse(null, { status: 204 })),
  )
  return bodies
}

describe('yazma çubuğu', () => {
  it('Enter gönderir (taslakla bağlı client_message_id), Shift+Enter göndermez; başarıda taslak temizlenir', async () => {
    servePane({ messages: [] })
    const bodies = captureSend((b) => json(created(1, String(b.body)), 201))
    const { wrapper, client } = await mountPane()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await type(wrapper, 'Merhaba')
    await field(wrapper).trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(bodies).toHaveLength(0)
    await field(wrapper).trigger('keydown', { key: 'Enter' })
    await settle(client)
    expect(bodies).toHaveLength(1)
    expect(bodies[0]).toMatchObject({ body: 'Merhaba' })
    expect(String(bodies[0]!.client_message_id)).toMatch(/^cm-/)
    expect((field(wrapper).element as HTMLTextAreaElement).value).toBe('')
    expect(wrapper.findAll('[data-testid="chat-message"]')).toHaveLength(1)
  })

  it('sonuç bilinmiyor: "Gönderim doğrulanamadı — Tekrar dene" AYNI kimlikle; gövde değişirse yeni eylem', async () => {
    const { fake } = servePane({ messages: [] })
    const bodies = captureSend((b, n) => {
      if (n === 1) return HttpResponse.error()
      fake.add(created(1, String(b.body)))
      return json(created(1, String(b.body)), 201)
    })
    const { wrapper, client } = await mountPane()
    await type(wrapper, 'Selam')
    await wrapper.get('form').trigger('submit')
    await settle(client)
    expect(wrapper.get('[role="alert"]').text()).toContain('Gönderim doğrulanamadı')
    expect((field(wrapper).element as HTMLTextAreaElement).value).toBe('Selam')
    await wrapper.get('[role="alert"] button').trigger('click')
    await settle(client)
    expect(bodies).toHaveLength(2)
    expect(bodies[1]!.client_message_id).toBe(bodies[0]!.client_message_id)
    await vi.waitFor(() => expect(wrapper.findAll('[data-testid="chat-message"]')).toHaveLength(1))
  })

  it('birebirde karşı taraf ayrıldı (403): yazma alanı kapanır', async () => {
    servePane({ chat: { kind: 'direct', name: null, counterpart_name: 'Ayşe' }, messages: [] })
    captureSend(() => errorEnvelope('messaging.not_authorized', 403))
    const { wrapper, client } = await mountPane()
    await type(wrapper, 'Merhaba')
    await wrapper.get('form').trigger('submit')
    await settle(client)
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.get('[data-testid="chat-composer"]').text()).toContain(
      'Bu kişi artık programda değil',
    )
  })

  it('yanıtla: şerit + reply_to_message_id; Vazgeç şeridi kaldırır', async () => {
    servePane({ messages: [msg(1, { sender_name: 'Ayşe Yılmaz', body: 'Soru?' })] })
    const bodies = captureSend((b) =>
      json(created(2, String(b.body), { reply_to_message_id: 'm1' }), 201),
    )
    const { wrapper, client } = await mountPane()
    await wrapper.get('[aria-label="Yanıtla"]').trigger('click')
    expect(wrapper.get('[data-testid="chat-composer-band"]').text()).toContain(
      'Ayşe Yılmaz kişisine yanıt',
    )
    await wrapper.get('[data-testid="chat-composer-band"] button').trigger('click')
    expect(wrapper.find('[data-testid="chat-composer-band"]').exists()).toBe(false)
    await wrapper.get('[aria-label="Yanıtla"]').trigger('click')
    await type(wrapper, 'Cevap')
    await wrapper.get('form').trigger('submit')
    await settle(client)
    expect(bodies[0]).toMatchObject({ body: 'Cevap', reply_to_message_id: 'm1' })
  })

  it('@ önerisi: üyeler listelenir (kendim hariç), seçim metne yazılır ve mentions[] gider', async () => {
    servePane({
      messages: [],
      members: [
        {
          account_id: 'acc-1',
          full_name: 'Ben Kişi',
          founder: false,
          from_source: false,
          role: 'member',
        },
        {
          account_id: 'u2',
          full_name: 'Ayşe Yılmaz',
          founder: false,
          from_source: false,
          role: 'member',
        },
      ],
    })
    const bodies = captureSend((b) => json(created(1, String(b.body)), 201))
    const { wrapper, client } = await mountPane()
    await settle(client)
    await type(wrapper, 'Selam @ay')
    const options = wrapper.findAll('[role="option"]')
    expect(options.map((o) => o.text())).toEqual(['Ayşe Yılmaz'])
    await field(wrapper).trigger('keydown', { key: 'Enter' })
    expect((field(wrapper).element as HTMLTextAreaElement).value).toBe('Selam @Ayşe Yılmaz ')
    await wrapper.get('form').trigger('submit')
    await settle(client)
    expect(bodies[0]).toMatchObject({ mentions: [{ kind: 'account', target_id: 'u2' }] })
  })

  it('@herkes yalnız yönetici/kurucuya önerilir; üyeye önerilmez', async () => {
    servePane({ messages: [], chat: { role: 'founder' } })
    const { wrapper, client } = await mountPane()
    await settle(client)
    await type(wrapper, '@')
    expect(wrapper.findAll('[role="option"]').map((o) => o.text())).toContain('herkes')
    unmountAll()
    servePane({ messages: [], chat: { role: 'member' } })
    const member = await mountPane()
    await settle(member.client)
    await type(member.wrapper, '@')
    expect(member.wrapper.findAll('[role="option"]').map((o) => o.text())).not.toContain('herkes')
  })

  it('taslak sohbet başına bellekte korunur (yeniden bağlanınca geri gelir)', async () => {
    servePane({ messages: [] })
    const first = await mountPane()
    await type(first.wrapper, 'yarım kalan')
    first.wrapper.unmount()
    const again = await mountPane()
    expect((field(again.wrapper).element as HTMLTextAreaElement).value).toBe('yarım kalan')
  })

  it('düzenle: alan dolar, PATCH expected_revision taşır; 409 çakışmada ortak diyalog açılır', async () => {
    const { fake } = servePane({ messages: [created(1, 'ilk', { edit_revision: 2 })] })
    let patches = 0
    server.use(
      http.patch(`${ORIGIN}/v1/chats/c1/messages/m1`, async ({ request }) => {
        patches += 1
        const body = (await request.json()) as { expected_revision: number }
        expect(body.expected_revision).toBe(2)
        return errorEnvelope('messaging.edit_conflict', 409)
      }),
    )
    const { wrapper } = await mountPane()
    await wrapper.get('[aria-label="Diğer"]').trigger('click')
    const edit = wrapper.findAll('[role="menuitem"]').find((e) => e.text() === 'Düzenle')!
    await edit.trigger('click')
    await flushPromises()
    expect((field(wrapper).element as HTMLTextAreaElement).value).toBe('ilk')
    expect(wrapper.get('[data-testid="chat-composer-band"]').text()).toContain('Düzenleniyor')
    await type(wrapper, 'değişti')
    fake.edit(1, { body: 'sunucu', edit_revision: 3 })
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    expect(document.body.textContent).toContain('sunucu')
    expect(patches).toBe(1)
  })

  it('dosya yükleme: tek dosya, client_message_id sorguda; sunucu reddi alan altında', async () => {
    servePane({ messages: [] })
    let query = ''
    server.use(
      http.post(`${ORIGIN}/v1/chats/c1/attachments`, ({ request }) => {
        query = new URL(request.url).search
        return errorEnvelope('messaging.file_too_large', 422)
      }),
    )
    const { wrapper, client } = await mountPane()
    const input = wrapper.get('[data-testid="chat-file"]')
    const file = new File(['x'], 'cok-buyuk.pdf', { type: 'application/pdf' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await settle(client)
    expect(query).toMatch(/client_message_id=cm-/)
    expect(wrapper.get('[role="alert"]').text()).toContain('Dosya çok büyük')
  })

  it('Ekle menüsü: anket yalnız grupta; Arşivden dosya pencere ister; Esc odağı + düğmesine döndürür', async () => {
    servePane({ messages: [] })
    const { wrapper, dialogs } = await mountPane()
    const plus = wrapper.get('[aria-label="Ekle"]')
    await plus.trigger('click')
    const labels = wrapper.findAll('.chat-plus__item').map((i) => i.find('strong').text())
    expect(labels).toEqual([
      'Arşivden dosya',
      'Yeni dosya yükle',
      'Görev kartı',
      'Kişi ya da grup an',
      'Anket',
    ])
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('.chat-plus').exists()).toBe(false)
    expect(document.activeElement).toBe(plus.element)
    await plus.trigger('click')
    await wrapper.findAll('.chat-plus__item')[0]!.trigger('click')
    expect(dialogs).toEqual([{ dialog: 'shareFile', chatId: 'c1' }])
  })

  it('birebirde Anket öğesi yok', async () => {
    servePane({ chat: { kind: 'direct', name: null, counterpart_name: 'Ayşe' }, messages: [] })
    const { wrapper } = await mountPane()
    await wrapper.get('[aria-label="Ekle"]').trigger('click')
    expect(wrapper.findAll('.chat-plus__item')).toHaveLength(4)
  })
})
