import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import { file, mountWith, stubObjectUrls, target } from './__tests__/support'
import FullFilePreview from './FullFilePreview.vue'

const jpeg = file({ content_type: 'image/jpeg', display_name: 'Yalnız yetkili fotoğraf.jpeg' })
const pdf = file({ content_type: 'application/pdf', display_name: 'Saha keşif raporu.pdf' })
const FILES = '/v1/work-items/w1/files'
const testId = (name: string) => document.querySelector<HTMLElement>(`[data-testid="${name}"]`)
const dialog = () => testId('archive-full-preview')!
const close = () => testId('archive-full-close')!
let urls: ReturnType<typeof stubObjectUrls>
let trigger: HTMLButtonElement

function binary(extension: 'thumbnail' | 'download') {
  return http.get(`${ORIGIN}/v1/files/f1/${extension}`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([255, 216, 255, 217]).buffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    }),
  )
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = true
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.open = false
      },
    },
  })
})
beforeEach(() => {
  urls = stubObjectUrls()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  trigger = document.createElement('button')
  document.body.append(trigger)
})
enableAutoUnmount(afterEach)
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
  trigger.remove()
})
afterAll(() => server.close())

function open(file = jpeg) {
  return mountWith(
    FullFilePreview,
    { file, target, taskTitle: 'Saha görevi', trigger },
    { standing: null },
  )
}

it('yetkili JPEG, özgün gövde, odak turu ve Esc sonrası tetiğe dönüş', async () => {
  server.use(
    http.get(`${ORIGIN}${FILES}`, () => json({ files: [jpeg] })),
    binary('download'),
  )
  const { wrapper } = open()
  expect(document.activeElement).toBe(close())
  expect(dialog().getAttribute('aria-modal')).toBe('true')
  await vi.waitFor(() => expect(dialog().querySelector('img')?.src).toBe('blob:onizleme-1'))
  expect(dialog().querySelector('h1')?.title).toBe(jpeg.display_name)
  const [proof] = sent('GET', FILES)
  expect(proof?.headers.get('X-Nizamio-Program')).toBe('p1')
  expect(proof?.headers.get('X-Nizamio-Department')).toBe('d1')
  expect(sent('GET', '/v1/files/f1/download')).toHaveLength(1)

  close().dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
  const download = Array.from(dialog().querySelectorAll('button')).at(-1)!
  expect(document.activeElement).toBe(download)
  download.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
  expect(document.activeElement).toBe(close())
  close().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(wrapper.emitted('close')).toEqual([[]])
  wrapper.unmount()
  await nextTick()
  expect(document.activeElement).toBe(trigger)
  expect(urls.revoked).toContain('blob:onizleme-1')
})

it('PDF ilk sayfa JPEG kullanır, belge gövdesini istemez', async () => {
  server.use(
    http.get(`${ORIGIN}${FILES}`, () => json({ files: [pdf] })),
    binary('thumbnail'),
  )
  open(pdf)
  await vi.waitFor(() => expect(dialog().querySelector('img')).not.toBeNull())
  expect(dialog().textContent).toContain('İlk sayfa önizlemesi')
  expect(dialog().querySelector('iframe, object, embed')).toBeNull()
  expect(sent('GET', '/v1/files/f1/thumbnail')).toHaveLength(1)
  expect(sent('GET', '/v1/files/f1/download')).toHaveLength(0)
})

it.each([403, 404])(
  '%s sonrasında eski adı, görseli ve indirmeyi hemen düşürür',
  async (status) => {
    let revoked = false
    server.use(
      http.get(`${ORIGIN}${FILES}`, () =>
        revoked ? errorEnvelope('records.file_not_found', status) : json({ files: [jpeg] }),
      ),
      binary('download'),
    )
    open()
    await vi.waitFor(() => expect(dialog().querySelector('img')).not.toBeNull())
    revoked = true
    window.dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect(dialog().textContent).toContain('Dosya açılamadı.'))

    expect(dialog().textContent).not.toContain(jpeg.display_name)
    expect(dialog().querySelector('[title]')).toBeNull()
    expect(dialog().querySelector('img')).toBeNull()
    expect(dialog().querySelectorAll('button')).toHaveLength(1)
    expect(urls.revoked).toContain('blob:onizleme-1')
  },
)

it('üretilemeyen PDF türevinde adı ve indirme yolunu korur', async () => {
  server.use(
    http.get(`${ORIGIN}${FILES}`, () => json({ files: [pdf] })),
    http.get(`${ORIGIN}/v1/files/f1/thumbnail`, () =>
      errorEnvelope('records.preview_unavailable', 422),
    ),
  )
  open(pdf)
  await vi.waitFor(() => expect(dialog().textContent).toContain('Önizleme oluşturulamadı'))
  expect(dialog().textContent).toContain(pdf.display_name)
  expect(dialog().textContent).toContain('Dosyayı indir')
})

it('PDF indirme tam dosya için arşiv bileti kullanır', async () => {
  server.use(
    http.get(`${ORIGIN}${FILES}`, () => json({ files: [pdf] })),
    binary('thumbnail'),
    http.post(`${ORIGIN}/v1/download-tickets`, () =>
      json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-12T12:01:00Z' }, 201),
    ),
    http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
      HttpResponse.arrayBuffer(new Uint8Array([37, 80, 68, 70]).buffer, {
        headers: { 'Content-Type': 'application/pdf' },
      }),
    ),
  )
  open(pdf)
  await vi.waitFor(() => expect(dialog().querySelector('img')).not.toBeNull())
  dialog().querySelector<HTMLButtonElement>('.full-preview__download button')!.click()
  await vi.waitFor(() => expect(urls.clicked).toEqual([pdf.display_name]))
  const [ticket] = sent('POST', '/v1/download-tickets')
  expect(ticket?.body).toEqual({ method: 'GET', path: '/v1/files/f1/download' })
  expect(ticket?.headers.get('X-Nizamio-Department')).toBe('d1')
})

it('yerel kapsam değiştiğinde ağ cevabını beklemeden önizlemeyi kapatır', async () => {
  server.use(
    http.get(`${ORIGIN}${FILES}`, () => json({ files: [jpeg] })),
    binary('download'),
  )
  const { h } = open()
  await vi.waitFor(() => expect(dialog().querySelector('img')).not.toBeNull())
  h.store.setProgram('p2')
  await nextTick()
  expect(dialog().textContent).toContain('Dosya açılamadı.')
  expect(dialog().textContent).not.toContain(jpeg.display_name)
  expect(dialog().querySelector('img')).toBeNull()
  expect(sent('GET', FILES)).toHaveLength(1)
})
