import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'

import {
  errorEnvelope,
  fileRecord,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import { file, mountWith, target } from './__tests__/support'
import RenameFileDialog from './RenameFileDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
enableAutoUnmount(afterEach)

const PATH = `${ORIGIN}/v1/files/f1/name`
const input = () => document.body.querySelector<HTMLInputElement>('[data-testid="rename-input"]')!
const submit = () =>
  document.body.querySelector<HTMLButtonElement>('[data-testid="rename-submit"]')!
const text = () => document.body.textContent ?? ''

function open(props: Record<string, unknown> = {}) {
  return mountWith(
    RenameFileDialog,
    { open: true, file: file(), target, ...props },
    { standing: { companyAdmin: true } },
  )
}

async function type(value: string) {
  input().value = value
  input().dispatchEvent(new Event('input'))
  await nextTick()
}

async function send(h: ReturnType<typeof open>['h'], value: string) {
  await type(value)
  submit().click()
  await settleQueries(h.queryClient)
}

describe('RenameFileDialog (E-06-57/64)', () => {
  it('mevcut adla açılır; boş ad ve 150 karakter aşımı istek atmadan reddedilir', async () => {
    const { h } = open()
    expect(input().value).toBe('rapor.pdf')
    await send(h, '   ')
    expect(text()).toContain('Dosya adı boş olamaz.')
    await type('a'.repeat(151))
    expect(text()).toContain('en çok 150 karakter')
    submit().click()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1/name')).toHaveLength(0)
  })

  it('aynı ad istek atmadan kapanır', async () => {
    const { h, wrapper } = open()
    await send(h, ' rapor.pdf ')
    expect(sent('PATCH', '/v1/files/f1/name')).toHaveLength(0)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('başarı: dosyanın departman başlığıyla anahtarsız PATCH, renamed + kapanış, görev dosyaları yeniden okunur', async () => {
    server.use(http.patch(PATH, () => json({ ...fileRecord, display_name: 'yeni.pdf' })))
    const { h, wrapper } = open()
    const key = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(key, { seeded: true })
    await send(h, '  yeni.pdf ')
    const [req] = sent('PATCH', '/v1/files/f1/name')
    expect(req!.body).toEqual({ display_name: 'yeni.pdf' })
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(h.queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    expect(wrapper.emitted('renamed')).toEqual([['f1']])
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it.each([
    ['records.name_taken', 409, 'Bu adla bir dosya zaten var.'],
    ['records.name_invalid', 422, 'Dosya adı geçersiz.'],
    ['records.moved', 409, 'Dosya taşındı; listeyi yenileyin.'],
  ])('%s: tek alan bildirimi adın altında, pencere açık kalır', async (code, status, message) => {
    server.use(http.patch(PATH, () => errorEnvelope(code, status)))
    const { h, wrapper } = open()
    await send(h, 'baska.pdf')
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(text()).toContain(message)
    expect(text()).not.toContain('sunucu iletisi')
    expect(wrapper.emitted('renamed')).toBeUndefined()
    expect(input()).not.toBeNull()
  })

  it('records.moved listeyi yeniden okutur (kör tekrar yok)', async () => {
    server.use(http.patch(PATH, () => errorEnvelope('records.moved', 409)))
    const { h } = open()
    const key = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(key, { seeded: true })
    await send(h, 'baska.pdf')
    expect(sent('PATCH', '/v1/files/f1/name')).toHaveLength(1)
    expect(h.queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('ağ kopması: sonuç bilinmiyor bildirimi, anahtarsız uçta kör tekrar düğmesi yok, liste yeniden okunur', async () => {
    server.use(http.patch(PATH, () => HttpResponse.error()))
    const { h, wrapper } = open()
    const key = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(key, { seeded: true })
    await send(h, 'baska.pdf')
    expect(document.body.querySelector('[data-testid="outcome-notice"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="outcome-retry"]')).toBeNull()
    expect(sent('PATCH', '/v1/files/f1/name')).toHaveLength(1)
    expect(wrapper.emitted('renamed')).toBeUndefined()
  })

  it.each([
    [
      'Esc',
      () =>
        document.body
          .querySelector('[role="dialog"]')!
          .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
    ],
    ['✕', () => document.body.querySelector<HTMLButtonElement>('.t-modal__head button')!.click()],
    [
      'Vazgeç',
      () =>
        document.body.querySelector<HTMLButtonElement>('[data-testid="rename-cancel"]')!.click(),
    ],
  ])('%s ile kapanır: istek yok, update:open false', async (_name, close) => {
    const { wrapper } = open()
    close()
    await nextTick()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(sent('PATCH', '/v1/files/f1/name')).toHaveLength(0)
  })

  it('istek sürerken pencere kapatılamaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(PATH, async () => {
        await gate
        return json({ ...fileRecord, display_name: 'yeni.pdf' })
      }),
    )
    const { h, wrapper } = open()
    await type('yeni.pdf')
    submit().click()
    await nextTick()
    document.body
      .querySelector<HTMLButtonElement>('[data-testid="rename-cancel"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    document.body
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(submit().disabled).toBe(true)
    release()
    await settleQueries(h.queryClient)
    expect(wrapper.emitted('renamed')).toEqual([['f1']])
  })

  it('pencere sökülünce geç sonuç renamed/kapanış başlatmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(PATH, async () => {
        await gate
        return json({ ...fileRecord, display_name: 'yeni.pdf' })
      }),
    )
    const { h, wrapper } = open()
    await type('yeni.pdf')
    submit().click()
    await nextTick()
    wrapper.unmount()
    release()
    await settleQueries(h.queryClient)
    expect(wrapper.emitted('renamed')).toBeUndefined()
  })
})
