// BE-029 (W185b): "Görev arşivine de kaydet" → tek `archiveChatFile` multipart isteği (gerçek API
// istemcisi + durumlu sahte uç). Anahtar/kimlik arşivleme boyunca sabit, eski iki adımlı yol yok.
import { nextTick } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  browserLikeClone,
  called,
  calls,
  click,
  errorEnvelope,
  json,
  mountDialog,
  msg,
  on,
  onRaw,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
} from './harness'
import ShareFileDialog from '../ShareFileDialog.vue'

const PATH = '/v1/chats/c1/archived-files'
const archived = (status = 201) => json({ file_id: 'f9', message: msg(7) }, status)
let appended: Array<[string, unknown]> = []

beforeAll(() => {
  vi.stubGlobal('structuredClone', browserLikeClone)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  resetDialogs()
  resetAll()
  vi.restoreAllMocks()
})
afterAll(() => {
  vi.unstubAllGlobals()
  server.close()
})
beforeEach(() => {
  signIn()
  appended = []
  const proto = FormData.prototype as { append: (...args: Parameters<FormData['append']>) => void }
  const original = proto.append
  vi.spyOn(FormData.prototype, 'append').mockImplementation(function (
    this: FormData,
    ...args: Parameters<FormData['append']>
  ) {
    appended.push([args[0], args[1]])
    return original.call(this, ...args)
  })
})

function serve(archive: () => Response | Promise<Response> = () => archived()) {
  on('get', '/v1/chats/c1', () =>
    json({ chat_id: 'c1', kind: 'group', name: 'Eğitim', role: 'member' }),
  )
  on('get', '/v1/program/departments', () =>
    json({ departments: [{ department_id: 'd1', display_name: 'Yazılım', code: 'YZL' }] }),
  )
  on('get', '/v1/program/archive/tasks', (call) =>
    json({
      tasks: [
        {
          work_item_id: 'w1',
          title: 'Saha raporu',
          department_id: call.query.get('department_id'),
          file_count: 0,
        },
        {
          work_item_id: 'w2',
          title: 'Altyapı',
          department_id: call.query.get('department_id'),
          file_count: 2,
        },
      ],
    }),
  )
  onRaw('post', PATH, archive)
  onRaw('post', '/v1/chats/c1/attachments', () => json(msg(8), 201))
  on('post', '/v1/chats/c1/messages', () => json(msg(8), 201))
}

function choose(name = 'plan.pdf') {
  const input = $('[data-testid="dlg-file-input"]') as HTMLInputElement
  const file = new File(['x'.repeat(2048)], name, { type: 'application/pdf' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  input.dispatchEvent(new Event('change'))
}

async function fillArchiveSave(task = 'w2', tag = 'plan') {
  click('[data-testid="dlg-save-archive"]')
  await vi.waitFor(() => expect($$('select[name="save-department"] option')).toHaveLength(2))
  setValue('select[name="save-department"]', 'd1')
  await vi.waitFor(() => expect($$('select[name="save-task"] option')).toHaveLength(3))
  setValue('select[name="save-task"]', task)
  setValue('select[name="save-tag"]', tag)
}

const sendButton = () => $('[data-testid="dlg-submit"]') as HTMLButtonElement
const ready = () => vi.waitFor(() => expect(sendButton().disabled).toBe(false))
const keys = () => appended.map(([k]) => k)
const submit = () => click('[data-testid="dlg-submit"]')

describe('ShareFileDialog — Görev arşivine de kaydet (BE-029)', () => {
  it('kutu kapalıyken görev/etiket yok; açılınca birim → görev (yükleyebildiği) → kapalı küme etiket', async () => {
    serve()
    mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    expect($('select[name="save-task"]')).toBeNull()
    await fillArchiveSave()
    expect($$('select[name="save-task"] option').map((o) => o.textContent)).toEqual([
      'Görev seçin',
      'Altyapı',
      'Saha raporu',
    ])
    expect($$('select[name="save-tag"] option').map((o) => o.textContent)).toEqual([
      'Etiket seçin',
      'İster',
      'Plan',
      'Girdi',
      'Analiz',
      'Çıktı',
      'Sonuç',
    ])
    const [tasks] = called('GET', '/v1/program/archive/tasks')
    expect(tasks!.query.get('include_empty')).toBe('true')
    expect(tasks!.query.get('department_id')).toBe('d1')
  })

  it("gönder: TEK archiveChatFile (201); alan sırası: metin alanları file'dan ÖNCE, file SON; eski yollar çağrılmaz", async () => {
    serve()
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    await fillArchiveSave('w2', 'sonuc')
    setValue('input[name="note"]', 'Bakın')
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    expect(keys()).toEqual(['client_message_id', 'work_item_id', 'tag', 'body', 'file'])
    expect(appended.find(([k]) => k === 'work_item_id')![1]).toBe('w2')
    expect(appended.find(([k]) => k === 'tag')![1]).toBe('sonuc')
    expect(appended.find(([k]) => k === 'body')![1]).toBe('Bakın')
    const [call] = called('POST', PATH)
    expect(call!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(call!.headers.get('X-Requested-With')).toBeTruthy()
    expect(call!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(String(call!.headers.get('content-type'))).toContain('multipart/form-data')
    // Eski iki adımlı yol yok: ne ek yükleme, ne refs'li mesaj, ne görev dosyası yükleme.
    expect(called('POST', '/v1/chats/c1/attachments')).toHaveLength(0)
    expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(0)
    expect(calls.filter((c) => c.path.startsWith('/v1/work-items/'))).toHaveLength(0)
  })

  it('boş not gönderilmez (sunucu dosya adını kullanır); alt görev alanı yok', async () => {
    serve()
    mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    await fillArchiveSave()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    expect(keys()).toEqual(['client_message_id', 'work_item_id', 'tag', 'file'])
  })

  it('görev ya da etiket yoksa istek yok; alan hataları görünür', async () => {
    serve()
    mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    await ready()
    click('[data-testid="dlg-save-archive"]')
    submit()
    await vi.waitFor(() => expect(document.body.textContent).toContain('Bir görev seçin.'))
    expect(document.body.textContent).toContain('Bir etiket seçin.')
    expect(called('POST', PATH)).toHaveLength(0)
  })

  it('belirsiz sonuç → Yeniden gönder: Idempotency-Key + client_message_id AYNI; pencere sonra kapanır', async () => {
    let n = 0
    serve(() => (n++ === 0 ? errorEnvelope('platform.internal', 503) : archived(200)))
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    await fillArchiveSave()
    submit()
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    ;[...document.body.querySelectorAll('button')]
      .find((b) => b.textContent?.trim() === 'Yeniden gönder')!
      .click()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(2))
    const [first, second] = called('POST', PATH)
    expect(second!.headers.get('Idempotency-Key')).toBe(first!.headers.get('Idempotency-Key'))
    const ids = appended.filter(([k]) => k === 'client_message_id').map(([, v]) => v)
    expect(ids).toHaveLength(2)
    expect(ids[1]).toBe(ids[0])
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
  })

  it('403 records.not_authorized / 404 work.item_not_found pencerede tek hata; pencere açık kalır', async () => {
    serve(() => errorEnvelope('records.not_authorized', 403))
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    await fillArchiveSave()
    submit()
    await vi.waitFor(() => expect($('[data-testid="dlg-error"]')).not.toBeNull())
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(called('POST', PATH)).toHaveLength(1)
  })

  it('yeni eylem (not değişti): yeni client_message_id; yeni Idempotency-Key', async () => {
    serve(() => errorEnvelope('records.too_large', 422))
    mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose()
    await fillArchiveSave()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(1))
    await vi.waitFor(() => expect($('[data-testid="dlg-error"]')).not.toBeNull())
    setValue('input[name="note"]', 'başka')
    await nextTick()
    submit()
    await vi.waitFor(() => expect(called('POST', PATH)).toHaveLength(2))
    const [a, b] = called('POST', PATH)
    expect(b!.headers.get('Idempotency-Key')).not.toBe(a!.headers.get('Idempotency-Key'))
    const ids = appended.filter(([k]) => k === 'client_message_id').map(([, v]) => v)
    expect(ids[1]).not.toBe(ids[0])
  })
})
