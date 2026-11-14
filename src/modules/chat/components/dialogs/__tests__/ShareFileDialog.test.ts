import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  browserLikeClone,
  called,
  click,
  clickText,
  errorEnvelope,
  json,
  mountDialog,
  msg,
  on,
  onRaw,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
} from './harness'
import ShareFileDialog from '../ShareFileDialog.vue'

beforeAll(() => {
  vi.stubGlobal('structuredClone', browserLikeClone)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => {
  vi.unstubAllGlobals()
  server.close()
})
beforeEach(signIn)

function serve(attachment: () => Response | Promise<Response> = () => json(msg(7), 201)) {
  on('get', '/v1/chats/c1', () =>
    json({ chat_id: 'c1', kind: 'group', name: 'Eğitim', role: 'member' }),
  )
  onRaw('post', '/v1/chats/c1/attachments', attachment)
  on('post', '/v1/chats/c1/messages', () => json(msg(8), 201))
  on('get', '/v1/program/departments', () =>
    json({ departments: [{ department_id: 'd1', display_name: 'Yazılım', code: 'YZL' }] }),
  )
  on('get', '/v1/records/archive/attachments', (call) =>
    json({
      files: [
        {
          file_id: 'f1',
          display_name: 'rapor.pdf',
          size_bytes: 20480,
          content_type: 'application/pdf',
          tag: 'sonuc',
          uploaded_by_account_id: 'u1',
          work_item_id: 'w1',
        },
      ],
      next_cursor: '',
      search: call.query.get('search'),
    }),
  )
}

function choose(name: string, type = 'application/pdf') {
  const input = $('[data-testid="dlg-file-input"]') as HTMLInputElement
  const file = new File(['x'.repeat(2048)], name, { type })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  input.dispatchEvent(new Event('change'))
  return file
}

describe('ShareFileDialog — Yeni yükle (E-10-101…107)', () => {
  it('başlık, açıklama, "Yeni yükle" basılı; dosya yoksa Gönder kapalı', async () => {
    serve()
    mountDialog(ShareFileDialog, { chatId: 'c1' })
    await vi.waitFor(() => expect($('.t-modal__desc')?.textContent).toBe('Eğitim grubuna'))
    expect($('.t-modal__title')?.textContent).toBe('Dosya paylaş')
    expect($$('.rp-seg button').map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
    ])
    expect(($('[data-testid="dlg-submit"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('tek dosya multipart: client_message_id sorguda; "<ad> · <n> KB"', async () => {
    serve()
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose('plan.pdf')
    await vi.waitFor(() => expect($('[data-testid="dlg-file"]')?.textContent).toContain('plan.pdf'))
    expect($('[data-testid="dlg-file"]')!.textContent).toContain('2 KB')
    setValue('input[name="note"]', 'Bakın')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/attachments')).toHaveLength(1))
    const [call] = called('POST', '/v1/chats/c1/attachments')
    expect(call!.query.get('client_message_id')).toBeTruthy()
    expect(String(call!.headers.get('content-type'))).toContain('multipart/form-data')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
  })

  it('izinli olmayan tür reddedilir (istek yok); "görev arşivine de kaydet" devre dışı + BE-029', async () => {
    serve()
    mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose('film.mp4', 'video/mp4')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-file-error"]')?.textContent).toBe('Bu dosya türü paylaşılamaz.'),
    )
    expect(($('[data-testid="dlg-submit"]') as HTMLButtonElement).disabled).toBe(true)
    const stub = $('[data-design-stub="BE-029"]')!
    expect(stub.textContent).toContain('Bir görevin arşivine de kaydet')
    expect((stub.querySelector('input') as HTMLInputElement).disabled).toBe(true)
    expect(called('POST', '/v1/chats/c1/attachments')).toHaveLength(0)
  })

  it('422 file_too_large alan altında gösterilir; pencere açık kalır', async () => {
    serve(() => errorEnvelope('messaging.file_too_large', 422))
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    choose('plan.pdf')
    await vi.waitFor(() =>
      expect(($('[data-testid="dlg-submit"]') as HTMLButtonElement).disabled).toBe(false),
    )
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() =>
      expect($('[data-testid="dlg-error"]')?.textContent).toBe('Dosya çok büyük.'),
    )
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})

describe('ShareFileDialog — Arşivden (E-10-54)', () => {
  it('birim seç → arşiv dosyası → sendChatMessage refs[file] + gövde (boşsa dosya adı)', async () => {
    serve()
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    clickText('Arşivden')
    await vi.waitFor(() => expect($('[data-testid="dlg-archive"]')).not.toBeNull())
    await vi.waitFor(() => expect($$('select[name="department"] option')).toHaveLength(2))
    setValue('select[name="department"]', 'd1')
    await vi.waitFor(() => expect($('[data-testid="dlg-archive-list"]')).not.toBeNull())
    const [archive] = called('GET', '/v1/records/archive/attachments')
    expect(archive!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect($('[data-testid="dlg-archive-list"]')!.textContent).toContain('20 KB')
    expect(($('[data-testid="dlg-submit"]') as HTMLButtonElement).disabled).toBe(true)
    $('[data-testid="dlg-archive-list"] button')!.click()
    await vi.waitFor(() =>
      expect(($('[data-testid="dlg-submit"]') as HTMLButtonElement).disabled).toBe(false),
    )
    expect(document.body.textContent).toContain('bağlantı olarak paylaşılır')
    click('[data-testid="dlg-submit"]')
    await vi.waitFor(() => expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(1))
    expect(called('POST', '/v1/chats/c1/messages')[0]!.body).toMatchObject({
      body: 'rapor.pdf',
      refs: [{ kind: 'file', target_id: 'f1' }],
    })
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
  })

  it('Esc ve Vazgeç kapatır', async () => {
    serve()
    const { wrapper } = mountDialog(ShareFileDialog, { chatId: 'c1' })
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(1))
    clickText('Vazgeç')
    await vi.waitFor(() => expect(wrapper.emitted('close')).toHaveLength(2))
  })
})
