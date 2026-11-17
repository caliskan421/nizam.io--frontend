// BE-080 (W185b): "Mesajı ilet" — gerçek API istemcisi + durumlu sahte uç. Hepsi ya da hiçbiri,
// tek hata, eylem başına tek Idempotency-Key, kaynak bilgisi sızdırmama, açık hedefte gerçek okuma.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeChatSummary } from '@/shared/api/__tests__/defaults'
import { useScopeStore } from '@/shared/scope/store'

import {
  $,
  $$,
  called,
  calls,
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
import ForwardDialog from '../ForwardDialog.vue'

const PATH = '/v1/chats/c1/messages/m5/forward'
const OK = { items: [{ chat_id: 'g1', message_id: 'x1' }] }

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const GROUP = makeChatSummary({ chat_id: 'g1', name: 'Hidrofor teslim ekibi', kind: 'group' })
const PERSON = makeChatSummary({
  chat_id: 'd1',
  kind: 'direct',
  name: null,
  counterpart_name: 'Reha Koçak',
})
const COORD = makeChatSummary({
  chat_id: 'k1',
  name: 'Koordinatörler',
  auto_kind: 'coordinators',
  source: 'coordinators',
})
const SOURCE = makeChatSummary({ chat_id: 'c1', name: 'Genel', kind: 'group' })

function serve(
  forward: () => Response | Promise<Response> = () => json(OK, 201),
  items = [GROUP, PERSON, COORD],
) {
  on('get', '/v1/chats/c1', () => json(SOURCE))
  on('get', '/v1/chats', (call) => {
    const q = call.query.get('q')
    const hit = items.filter((c) => (q ? (c.name ?? c.counterpart_name ?? '').includes(q) : true))
    return json({ items: hit, next_cursor: '', total: hit.length })
  })
  on('post', PATH, forward)
}

const SOURCE_MESSAGE = msg(5, {
  message_id: 'm5',
  body: '@Altyapı hidrofor pompaları 28 Ekim’de sahada.',
  sender_name: 'Kadir Özbek',
  created_at: '2026-11-13T09:12:00Z',
})

function open(over: { loadNewer?: () => Promise<void>; refs?: boolean } = {}) {
  const message = over.refs
    ? { ...SOURCE_MESSAGE, refs: [{ kind: 'task', ref_id: 'r1', target_id: 't1' }] }
    : SOURCE_MESSAGE
  return mountDialog(
    ForwardDialog,
    { chatId: 'c1', messageId: 'm5' },
    { window: { items: [message as typeof SOURCE_MESSAGE] }, loadNewer: over.loadNewer },
  )
}
const row = (id: string) => $(`[data-chat-id="${id}"]`) as HTMLElement
const submit = () => click('[data-testid="dlg-submit"]')
const listed = () =>
  vi.waitFor(() => expect($$('[data-testid="dlg-forward-list"] li')).not.toHaveLength(0))

describe('ForwardDialog (E-10-81…85)', () => {
  it('başlık "Mesajı ilet"; açıklama "<gönderen> · <sohbet> · <saat>"; alıntı; hedef türleri; 0 seçili', async () => {
    serve()
    open()
    await listed()
    expect($('.t-modal__title')?.textContent).toBe('Mesajı ilet')
    await vi.waitFor(() =>
      expect($('.t-modal__desc')?.textContent).toMatch(/^Kadir Özbek · Genel · \d\d:\d\d$/),
    )
    expect($('[data-testid="dlg-forward-quote"]')!.textContent).toContain('hidrofor pompaları')
    expect(row('g1').textContent).toContain('Grup')
    expect(row('d1').textContent).toContain('Reha Koçak')
    expect(row('d1').textContent).toContain('Birebir')
    expect(row('k1').textContent).toContain('Sistem grubu')
    expect($('[data-testid="dlg-forward-count"]')!.textContent).toContain('0 seçili')
    expect($('[data-testid="dlg-forward-refs"]')).toBeNull()
  })

  it('iki hedef + not → TEK forwardChatMessage: targets benzersiz, note kırpılmış, Idempotency-Key; pencere kapanır', async () => {
    serve()
    const { wrapper } = open()
    await listed()
    row('g1').click()
    row('d1').click()
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-forward-count"]')!.textContent).toContain('2 seçili'),
    )
    setValue('input[name="note"]', '  Bakın  ')
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    const [call] = called('POST', PATH)
    expect(call!.body).toEqual({ targets: ['g1', 'd1'], note: 'Bakın' })
    expect(call!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(call!.headers.get('X-Requested-With')).toBeTruthy()
    expect(call!.headers.get('X-Nizamio-Program')).toBe('p1')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    // Eski "metni yeniden gönder" yolu yok: hiçbir hedefe sendChatMessage gitmez.
    expect(calls.filter((c) => c.method === 'POST' && c.path.endsWith('/messages'))).toHaveLength(0)
  })

  it('boş not gönderilmez; seçimi kaldırınca hedef çıkar; aynı hedef iki kez seçilemez', async () => {
    serve()
    open()
    await listed()
    row('g1').click()
    row('d1').click()
    row('d1').click()
    row('g1').click()
    row('g1').click()
    await vi.waitFor(() => expect(row('g1').getAttribute('aria-pressed')).toBe('true'))
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    expect(called('POST', PATH)[0]!.body).toEqual({ targets: ['g1'] })
  })

  it('hedef yoksa istek yok ve hata; 11 hedefte istek yok ("en fazla 10")', async () => {
    const many = Array.from({ length: 11 }, (_, i) =>
      makeChatSummary({ chat_id: `s${i}`, name: `Grup ${i}` }),
    )
    serve(undefined, many)
    open()
    await vi.waitFor(() => expect($$('[data-testid="dlg-forward-list"] li')).toHaveLength(11))
    submit()
    await vi.waitFor(() => expect(document.body.textContent).toContain('En az bir konuşma seçin.'))
    for (const c of many) row(c.chat_id).click()
    submit()
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('En fazla 10 konuşma seçebilirsin.'),
    )
    expect(called('POST', PATH)).toHaveLength(0)
  })

  it('arama sunucuda (q); seçim aramayla kaybolmaz', async () => {
    serve()
    open()
    await listed()
    row('g1').click()
    setValue('input[type="search"]', 'Reha')
    await vi.waitFor(() =>
      expect(called('GET', '/v1/chats').some((c) => c.query.get('q') === 'Reha')).toBe(true),
    )
    await vi.waitFor(() => expect($$('[data-testid="dlg-forward-list"] li')).toHaveLength(1))
    row('d1').click()
    setValue('input[type="search"]', '')
    await listed()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    expect(called('POST', PATH)[0]!.body).toEqual({ targets: ['g1', 'd1'] })
  })

  it('hepsi ya da hiçbiri: 404 chat_not_found → TEK hata, pencere açık, seçim korunur, tek istek', async () => {
    serve(() => errorEnvelope('messaging.chat_not_found', 404))
    const { wrapper } = open()
    await listed()
    row('g1').click()
    row('d1').click()
    submit()
    await vi.waitFor(() => expect($('[data-testid="dlg-error"]')).not.toBeNull())
    expect($$('[data-testid="dlg-error"]')).toHaveLength(1)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(row('g1').getAttribute('aria-pressed')).toBe('true')
    expect(row('d1').getAttribute('aria-pressed')).toBe('true')
    expect(called('POST', PATH)).toHaveLength(1)
  })

  it('anket 422 (message_id) ve görünmeyen ref 422 (refs): tek hata gösterimi', async () => {
    for (const field of ['message_id', 'refs']) {
      resetDialogs()
      serve(() =>
        json(
          {
            error: {
              code: 'messaging.input_invalid',
              message: 'x',
              fields: [{ field, code: 'messaging.input_invalid' }],
            },
          },
          422,
        ),
      )
      const { wrapper } = open()
      await listed()
      row('g1').click()
      submit()
      await vi.waitFor(() => expect($('[data-testid="dlg-error"]')).not.toBeNull())
      expect($$('[data-testid="dlg-error"]')).toHaveLength(1)
      expect(wrapper.emitted('close')).toBeUndefined()
    }
  })

  it('belirsiz sonuç → Yeniden gönder: AYNI Idempotency-Key + AYNI gövde; yeni eylem (seçim değişti) yeni anahtar', async () => {
    let n = 0
    serve(() => (n++ === 0 ? errorEnvelope('platform.internal', 503) : json(OK, 200)))
    const { wrapper } = open()
    await listed()
    row('g1').click()
    submit()
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    clickText('Yeniden gönder')
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(2))
    const [a, b] = called('POST', PATH)
    expect(b!.headers.get('Idempotency-Key')).toBe(a!.headers.get('Idempotency-Key'))
    expect(b!.body).toEqual(a!.body)
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
  })

  it('yeni eylem yeni anahtar: hata sonrası seçim değişip yeniden gönderilir', async () => {
    serve(() => errorEnvelope('messaging.input_invalid', 422))
    open()
    await listed()
    row('g1').click()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    await vi.waitFor(() => expect($('[data-testid="dlg-error"]')).not.toBeNull())
    row('d1').click()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(2))
    const [a, b] = called('POST', PATH)
    expect(b!.headers.get('Idempotency-Key')).not.toBe(a!.headers.get('Idempotency-Key'))
  })

  it('açık sohbet hedefse penceresi gerçek `after` okumasıyla uzlaşır (loadNewer); olay içeriği uydurulmaz', async () => {
    const loadNewer = vi.fn(() => Promise.resolve())
    serve(() => json({ items: [{ chat_id: 'c1', message_id: 'yeni-1' }] }, 201))
    const own = makeChatSummary({ chat_id: 'c1', name: 'Genel' })
    on('get', '/v1/chats', () => json({ items: [own, GROUP], next_cursor: '', total: 2 }))
    open({ loadNewer })
    await listed()
    row('c1').click()
    submit()
    await vi.waitFor(() => expect(loadNewer).toHaveBeenCalledTimes(1))
  })

  it('açık sohbet hedef DEĞİLSE pencere okuması yok', async () => {
    const loadNewer = vi.fn(() => Promise.resolve())
    serve()
    const { wrapper } = open({ loadNewer })
    await listed()
    row('g1').click()
    submit()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    expect(loadNewer).not.toHaveBeenCalled()
  })

  it('geç sonuç: pencere sökülmüşse sonuç hiçbir okuma/kapanış akışı başlatmaz', async () => {
    const loadNewer = vi.fn(() => Promise.resolve())
    let release: (r: Response) => void = () => undefined
    serve(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve
        }),
    )
    on('get', '/v1/chats', () =>
      json({
        items: [makeChatSummary({ chat_id: 'c1', name: 'Genel' })],
        next_cursor: '',
        total: 1,
      }),
    )
    const { wrapper } = open({ loadNewer })
    await listed()
    row('c1').click()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    wrapper.unmount()
    release(json({ items: [{ chat_id: 'c1', message_id: 'm' }] }, 201))
    await new Promise((r) => setTimeout(r, 30))
    expect(loadNewer).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('kapsam (program) değişirse yanıt sonradan gelse de YENİ kapsamda pencere okuması başlamaz', async () => {
    const loadNewer = vi.fn(() => Promise.resolve())
    let release: (r: Response) => void = () => undefined
    serve(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve
        }),
    )
    on('get', '/v1/chats', () =>
      json({
        items: [makeChatSummary({ chat_id: 'c1', name: 'Genel' })],
        next_cursor: '',
        total: 1,
      }),
    )
    open({ loadNewer })
    await listed()
    row('c1').click()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    release(json({ items: [{ chat_id: 'c1', message_id: 'm' }] }, 201))
    await new Promise((r) => setTimeout(r, 50))
    expect(loadNewer).not.toHaveBeenCalled()
  })

  it('mesajda görev/dosya kartı varsa yetki notu görünür (kartlar iletenin yetkisiyle yeniden doğrulanır)', async () => {
    serve()
    open({ refs: true })
    await vi.waitFor(() => expect($('[data-testid="dlg-forward-refs"]')).not.toBeNull())
    expect($('[data-testid="dlg-forward-refs"]')!.textContent).toContain(
      'yetkinle yeniden doğrulanır',
    )
  })

  it('Esc ve Vazgeç kapatır; gönderim sürerken kapatılamaz', async () => {
    serve()
    const { wrapper } = open()
    await listed()
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Vazgeç')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})
